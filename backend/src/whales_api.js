/**
 * /api/whales — direct Supabase query (bypasses sniper.js issues)
 */
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.json({ error: 'Supabase not configured', source: 'mock' });
  }
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const params = new URLSearchParams({ select: '*', order: 'level.desc', limit: String(limit) });
    const url = SUPABASE_URL + '/rest/v1/whale_profiles?' + params.toString();
    const response = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { return res.json({ error: 'JSON parse: ' + text.substring(0,200), source: 'supabase' }); }
    
    if (!Array.isArray(data)) {
      return res.json({ error: 'Invalid response', source: 'supabase' });
    }
    
    res.json({ success: true, source: 'supabase', version: 10, total: data.length, whales: data });
  } catch(e) {
    res.json({ error: e.message, source: 'error' });
  }
});

module.exports = router;
