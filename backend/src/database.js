/**
 * WhaleBell Database Module
 * Supabase (PostgreSQL) 数据库操作
 */
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// Admin client (service key) - for creating users, DB operations
let supabase = null;
// Anon client - for user auth (login)
let supabaseAnon = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: ws } });
  console.log('✅ Supabase connected:', supabaseUrl.split('/').pop());
} else {
  console.warn('⚠️  Supabase not configured — using in-memory fallback');
}

if (supabaseUrl && anonKey) {
  supabaseAnon = createClient(supabaseUrl, anonKey, { realtime: { transport: ws } });
}

// ============================================================
// 用户管理
// ============================================================

async function createUser(email, password, displayName) {
  // Use admin API to bypass rate limits
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName }
  });
  if (error) throw error;
  // Auto-login after creation
  const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) throw loginError;
  return { user: sessionData.user, session: sessionData.session };
}

async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;
  return data;
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// ============================================================
// 房间监控
// ============================================================

async function saveWhaleAlert(alert) {
  const { data, error } = await supabase
    .from('whale_alerts')
    .insert([{
      user_id: alert.user_id,
      username: alert.username,
      nickname: alert.nickname || '',
      level: alert.level,
      room_id: alert.room_id,
      room_title: alert.room_title || '',
      total_gifts: alert.total_gifts || 0,
      profile_url: alert.profile_url || '',
      region: alert.region || '',
      source: alert.source || 'connector'
    }]);
  if (error) console.error('saveWhaleAlert error:', error);
  return { data, error };
}

async function getWhaleAlerts(userId, limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('whale_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return { data, error };
}

async function getWhaleStats(userId) {
  const { data, error } = await supabase
    .from('whale_alerts')
    .select('level, username, total_gifts, created_at')
    .eq('user_id', userId);
  if (error) return { error };

  const stats = {
    total_whales: data.length,
    max_level: 0,
    avg_level: 0,
    today_new: 0,
    high_level_count: 0,
    top_whales: []
  };

  if (data.length > 0) {
    const levels = data.map(w => w.level || 0);
    stats.max_level = Math.max(...levels);
    stats.avg_level = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    stats.high_level_count = levels.filter(l => l >= 30).length;

    // Today
    const today = new Date().toISOString().split('T')[0];
    stats.today_new = data.filter(w =>
      w.created_at && w.created_at.startsWith(today)
    ).length;

    // Top whales
    const grouped = {};
    data.forEach(w => {
      if (!grouped[w.username]) {
        grouped[w.username] = { username: w.username, level: w.level, total_gifts: 0, count: 0 };
      }
      grouped[w.username].total_gifts += w.total_gifts || 0;
      grouped[w.username].count += 1;
      grouped[w.username].level = Math.max(grouped[w.username].level, w.level || 0);
    });

    stats.top_whales = Object.values(grouped)
      .sort((a, b) => b.total_gifts - a.total_gifts)
      .slice(0, 20);
  }

  return { data: stats };
}

module.exports = {
  supabase,
  createUser, loginUser, getUserProfile,
  saveWhaleAlert, getWhaleAlerts, getWhaleStats
};
