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

module.exports = router;
