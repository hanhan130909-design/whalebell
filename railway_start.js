/**
 * WhaleBell — 化妆间狙击雷达 (精简版)
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3101;
const { buildProfiles } = require('./backend/src/portrait_engine');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status:'ok', service:'whalebell-portrait-engine', version:'1.0.0',
    uptime:process.uptime(), lastRun:global.lastPortraitRun||null });
});

app.post('/api/portrait/run', async (req, res) => {
  try {
    await buildProfiles();
    global.lastPortraitRun = new Date().toISOString();
    res.json({ success:true, time:global.lastPortraitRun });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/portrait/stats', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_ANON_KEY);
    const { count } = await supabase.from('whale_profiles').select('*',{count:'exact',head:true});
    res.json({ total_profiles:count, lastRun:global.lastPortraitRun, intervalMinutes:15 });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('WhaleBell Portrait Engine :'+PORT);
  buildProfiles().then(()=>{global.lastPortraitRun=new Date().toISOString();console.log('[OK] Initial build');})
    .catch(e=>console.error('[FAIL]',e.message));
  setInterval(async ()=>{
    try { await buildProfiles(); global.lastPortraitRun=new Date().toISOString(); }
    catch(e){ console.error('[FAIL]',e.message); }
  }, 900000);
});

process.on('uncaughtException', e => console.error('[FATAL]', e.message));
