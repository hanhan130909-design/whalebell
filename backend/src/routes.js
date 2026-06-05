/**
 * WhaleBell API Routes
 */
const express = require('express');
const router = express.Router();
const { createUser, loginUser, getUserProfile, getWhaleAlerts, getWhaleStats } = require('./database');
const { startMonitoring, stopMonitoring, getMonitorStatus } = require('./monitor');

// ============================================================
// Auth Routes
// ============================================================

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const data = await createUser(email, password, displayName);
    res.json({ user: data.user, session: data.session });
    analytics.login.push({ userId: data.user.id, timestamp: new Date().toISOString(), type: 'register' }); saveAnalytics();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const data = await loginUser(email, password);
    res.json({ user: data.user, session: data.session });
    analytics.login.push({ userId: data.user.id, timestamp: new Date().toISOString(), type: 'login' }); saveAnalytics();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Get profile
router.get('/profile', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { data, error } = await getUserProfile(userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================================================
// Monitor Routes
// ============================================================

// Start monitoring a room
router.post('/monitor/start', async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    if (!userId || !roomId) {
      return res.status(400).json({ error: 'userId and roomId required' });
    }
    const result = await startMonitoring(userId, roomId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop monitoring a room
router.post('/monitor/stop', async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId required' });
    stopMonitoring(roomId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get monitor status
router.get('/monitor/status', (req, res) => {
  res.json({ rooms: getMonitorStatus() });
});

// ============================================================
// Data Routes
// ============================================================

// Get whale alerts
router.get('/whales', async (req, res) => {
  try {
    const { userId, limit, offset } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { data, error } = await getWhaleAlerts(userId, parseInt(limit) || 50, parseInt(offset) || 0);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get whale stats
router.get('/whales/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const result = await getWhaleStats(userId);
    if (result.error) return res.status(500).json({ error: result.error.message });
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Tracking / Analytics Routes (埋点)
// ============================================================

// Analytics store with Supabase persistence
var analytics = { login: [], viewWhale: [], copyScript: [], commented: [], feedback: [], response: [], revenue: [] };
var supabaseAnalytics = null;
try {
  var { createClient } = require('@supabase/supabase-js');
  var supabaseUrl = process.env.SUPABASE_URL;
  var supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    supabaseAnalytics = createClient(supabaseUrl, supabaseKey, { db: { schema: 'public' } });
    // Create table if not exists
    supabaseAnalytics.from('analytics').select('count', { count: 'exact', head: true }).catch(function(){});
    console.log('Analytics Supabase ready');
  }
} catch(e) { console.log('Analytics: using memory fallback'); }

async function saveAnalytics(type, data) {
  if (supabaseAnalytics) {
    try { await supabaseAnalytics.from('analytics').insert([{ type: type, data: data, created_at: new Date().toISOString() }]); } catch(e) {}
  }
}

// Track login
router.post('/track/login', (req, res) => {
  const { userId } = req.body;
  analytics.login.push({ userId: userId || 'anon', timestamp: new Date().toISOString() }); saveAnalytics('login', { userId: userId || 'anon' });
  res.json({ success: true, totalLogins: analytics.login.length });
});

// Track whale view (点击查看金主)
router.post('/track/view', (req, res) => {
  const { userId, whaleId } = req.body;
  saveAnalytics(); analytics.viewWhale.push({ userId: userId || 'anon', whaleId, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Track copy script (复制话术)
router.post('/track/copy', (req, res) => {
  const { userId, whaleId, script } = req.body;
  saveAnalytics(); analytics.copyScript.push({ userId: userId || 'anon', whaleId, script: (script||'').substring(0,100), timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Track commented (已评论)
router.post('/track/commented', (req, res) => {
  const { userId, whaleId } = req.body;
  saveAnalytics(); analytics.commented.push({ userId: userId || 'anon', whaleId, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Track feedback (👍👎)
router.post('/track/feedback', (req, res) => {
  const { userId, whaleId, vote } = req.body;
  if (!vote || !['up','down'].includes(vote)) return res.status(400).json({ error: 'vote must be up or down' });
  saveAnalytics(); analytics.feedback.push({ userId: userId || 'anon', whaleId, vote, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Track response (关注回流)
router.post('/track/response', (req, res) => {
  const { userId, whaleId, type } = req.body;
  const valid = ['no_response','like','follow_back','dm','enter_room'];
  if (!type || !valid.includes(type)) return res.status(400).json({ error: 'invalid response type' });
  saveAnalytics(); analytics.response.push({ userId: userId || 'anon', whaleId, type, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Track revenue (流水反馈)
router.post('/track/revenue', (req, res) => {
  const { userId, whaleId, range } = req.body;
  const valid = ['0','1-50K','50-200K','200K+'];
  if (!range || !valid.includes(range)) return res.status(400).json({ error: 'invalid revenue range' });
  saveAnalytics(); analytics.revenue.push({ userId: userId || 'anon', whaleId, range, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// Get analytics summary (for debugging, later admin panel)
router.get('/track/summary', async (req, res) => {
  try {
    var stats = {
      totalLogins: analytics.login.length,
      totalViews: analytics.viewWhale.length,
      totalCopies: analytics.copyScript.length,
      totalCommented: analytics.commented.length,
      totalFeedback: analytics.feedback.length,
      feedbackUp: analytics.feedback.filter(function(f){return f.vote==='up'}).length,
      feedbackDown: analytics.feedback.filter(function(f){return f.vote==='down'}).length,
      totalResponses: analytics.response.length,
      enterRoom: analytics.response.filter(function(r){return r.type==='enter_room'}).length,
      followBack: analytics.response.filter(function(r){return r.type==='follow_back'}).length,
      dm: analytics.response.filter(function(r){return r.type==='dm'}).length,
      like: analytics.response.filter(function(r){return r.type==='like'}).length,
      noResponse: analytics.response.filter(function(r){return r.type==='no_response'}).length,
      totalRevenue: analytics.revenue.length,
      rev0: analytics.revenue.filter(function(r){return r.range==='0'}).length,
      rev1_50: analytics.revenue.filter(function(r){return r.range==='1-50K'}).length,
      rev50_200: analytics.revenue.filter(function(r){return r.range==='50-200K'}).length,
      rev200: analytics.revenue.filter(function(r){return r.range==='200K+'}).length
    };

    // Merge with Supabase stored data
    if (supabaseAnalytics) {
      var { data: rows, error } = await supabaseAnalytics.from('analytics').select('type,data');
      if (!error && rows) {
        rows.forEach(function(r) {
          var t = r.type;
          if (t === 'login' || !t) stats.totalLogins++;
          else if (t === 'viewWhale') stats.totalViews++;
          else if (t === 'copyScript') stats.totalCopies++;
          else if (t === 'commented') stats.totalCommented++;
          else if (t === 'feedback') {
            stats.totalFeedback++;
            if (r.data && r.data.vote === 'up') stats.feedbackUp++;
            else stats.feedbackDown++;
          } else if (t === 'response') {
            stats.totalResponses++;
            var rt = (r.data && r.data.type) || 'no_response';
            if (rt === 'enter_room') stats.enterRoom++;
            else if (rt === 'follow_back') stats.followBack++;
            else if (rt === 'dm') stats.dm++;
            else if (rt === 'like') stats.like++;
            else stats.noResponse++;
          } else if (t === 'revenue') {
            stats.totalRevenue++;
            var rv = (r.data && r.data.range) || '0';
            if (rv === '1-50K') stats.rev1_50++;
            else if (rv === '50-200K') stats.rev50_200++;
            else if (rv === '200K+') stats.rev200++;
            else stats.rev0++;
          }
        });
      }
    }

    res.json({
      totalLogins: stats.totalLogins, totalViews: stats.totalViews, totalCopies: stats.totalCopies,
      totalCommented: stats.totalCommented, totalFeedback: stats.totalFeedback,
      feedbackUp: stats.feedbackUp, feedbackDown: stats.feedbackDown,
      totalResponses: stats.totalResponses,
      responsesByType: {
        enter_room: stats.enterRoom, follow_back: stats.followBack, dm: stats.dm,
        like: stats.like, no_response: stats.noResponse
      },
      totalRevenueReports: stats.totalRevenue,
      revenueByRange: { '0': stats.rev0, '1-50K': stats.rev1_50, '50-200K': stats.rev50_200, '200K+': stats.rev200 }
    });
  } catch(e) {
    res.json({ totalLogins: analytics.login.length, totalViews: 0, totalCopies: 0, totalCommented: 0, totalFeedback: 0, feedbackUp: 0, feedbackDown: 0, totalResponses: 0, responsesByType: {}, totalRevenueReports: 0, revenueByRange: {} });
  }
});

module.exports = router;
