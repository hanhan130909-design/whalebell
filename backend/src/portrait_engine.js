/**
 * WhaleBell Portrait Engine v1.0
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const LOOKBACK_DAYS = 7;
const CONFIDENCE_THRESHOLD = 0.3;
const SESSION_MIN = 2;

const ROOM_KEYWORDS = {
  dance: ['dance','tari','nari','goyang','flex','joget'],
  beauty: ['cantik','beauty','pretty','wajah','face','ayang'],
  sing: ['sing','music','song','lagu','karaoke','nyanyi','gitar'],
  talk: ['talk','ngobrol','bincang','curhat','sharing','story'],
  game: ['game','ml','mobilelegends','pubg','valorant','freefire','ff'],
  comedy: ['lucu','funny','comedy','humor','lawak','joke','kocak'],
};

const CATEGORY_DISPLAY = {
  dance:'热舞', beauty:'颜值', sing:'唱歌', talk:'脱口秀', game:'竞技', comedy:'搞笑', unknown:'未知'
};

function classifyRoomCategory(roomName) {
  if (!roomName) return 'unknown';
  const lower = roomName.toLowerCase();
  for (const [cat, kws] of Object.entries(ROOM_KEYWORDS))
    for (const kw of kws)
      if (lower.includes(kw)) return cat;
  return 'unknown';
}

function classifyPersona(w) {
  if (w.total_gifts > 1000000 || w.level >= 40) return 'recognizer';
  if (w.level >= 30 && w.total_gifts < 500000) return 'curious';
  if (w.total_gifts > 500000 && w.total_sessions > 10) return 'challenger';
  if (w.level >= 25 && w.total_sessions >= 5) return 'recognizer';
  if (w.level >= 30) return 'recognizer';
  if (w.level >= 20) return 'curious';
  return 'recognizer';
}

function classifyInteraction(w) {
  if (w.total_sessions === 0) return 'silent';
  const avg = w.total_sessions > 0 ? w.total_gifts / w.total_sessions : 0;
  if (avg > 100000) return 'gift_sender';
  if (w.total_sessions > 5) return 'chatter';
  return 'silent';
}

function computeConfidence(w) {
  let s = 0;
  if (w.level > 0) s += 0.2;
  if (w.total_sessions >= 3) s += 0.15;
  if (w.total_sessions >= 10) s += 0.2;
  if (w.total_gifts > 0) s += 0.15;
  if (w.total_gifts > 100000) s += 0.1;
  if (w.region) s += 0.1;
  if (w.top_rooms.length > 1) s += 0.1;
  return Math.min(1, s);
}

function matchScriptLang(w) {
  const r = w.region || '';
  if (r === 'CN' || r === 'TW' || r === '台湾') return 'zh';
  if (r === 'US' || r === 'GB' || r === 'United Kingdom' || r === 'United States') return 'en';
  return 'id';
}

async function checkProfile(url) {
  if (!url) return 'unknown';
  try {
    const https = require('https');
    return new Promise(res => {
      const req = https.get(url, {
        timeout: 5000,
        headers: {'User-Agent': 'Mozilla/5.0','Accept-Language': 'en,id;q=0.9'}
      }, (resp) => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) res('public');
        else if (resp.statusCode === 302 || resp.statusCode === 301) res('private');
        else res('error');
      });
      req.on('error', () => res('error'));
      req.on('timeout', () => { req.destroy(); res('error'); });
      req.end();
    });
  } catch { return 'error'; }
}

async function buildProfiles() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('[PE] No Supabase'); return; }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('[PE] Starting portrait build...');

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();

  try {
    const { data: whales, error } = await supabase
      .from('whales').select('*').gte('last_seen', since).order('last_seen', { ascending: false });
    if (error) throw error;
    if (!whales || !whales.length) { console.log('[PE] No data'); return; }

    console.log(`[PE] ${whales.length} raw records`);

    // Aggregate
    const groups = {};
    for (const w of whales) {
      const u = w.username;
      if (!u) continue;
      if (!groups[u]) groups[u] = { records:[], username:u, nickname:w.nickname||u, maxLevel:0,
        totalGifts:0, regions:new Set(), hours:[], days:[], rooms:{},
        profileUrl:w.profile_url||`https://www.tiktok.com/@${u}`,
        firstSeen:w.first_seen||w.last_seen, lastSeen:w.last_seen };
      const g = groups[u];
      g.records.push(w);
      if (w.level > g.maxLevel) g.maxLevel = w.level;
      if (w.total_gifts) g.totalGifts += w.total_gifts;
      if (w.region) g.regions.add(w.region);
      if (w.last_seen) { g.hours.push(new Date(w.last_seen).getHours()); g.days.push(new Date(w.last_seen).getDay()); }
      const rm = w.source_room || w.current_room || 'unknown';
      g.rooms[rm] = (g.rooms[rm]||0) + 1;
      if (w.last_seen && (!g.lastSeen || w.last_seen > g.lastSeen)) g.lastSeen = w.last_seen;
    }

    console.log(`[PE] ${Object.keys(groups).length} unique users`);

    let built = 0;
    for (const [uname, g] of Object.entries(groups)) {
      const sessions = g.records.length;
      if (sessions < SESSION_MIN) continue;

      const topRooms = Object.entries(g.rooms).sort((a,b)=>b[1]-a[1]).slice(0,5).map(r=>({room:r[0],count:r[1]}));
      const cats = topRooms.map(r=>classifyRoomCategory(r.room));
      const catCount = {};
      cats.forEach(c=>{catCount[c]=(catCount[c]||0)+1});
      const topCat = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'unknown';

      const hourFreq = {};
      g.hours.forEach(h=>{hourFreq[h]=(hourFreq[h]||0)+1});
      const activeHours = Object.entries(hourFreq).sort((a,b)=>b[1]-a[1]).slice(0,4).map(e=>parseInt(e[0])).sort();

      const dayFreq = {};
      g.days.forEach(d=>{dayFreq[d]=(dayFreq[d]||0)+1});
      const activeDays = Object.entries(dayFreq).filter(e=>e[1]>=Math.max(1,sessions*0.1)).map(e=>parseInt(e[0])).sort();

      const region = g.regions.size > 0 ? [...g.regions][g.regions.size-1] : null;

      const profile = {
        username: uname, nickname: g.nickname, level: g.maxLevel, region,
        profile_url: g.profileUrl, preference: CATEGORY_DISPLAY[topCat]||'未知',
        persona: 'recognizer', active_hours: activeHours, active_days: activeDays,
        interaction_style: 'silent', profile_status: 'unknown',
        total_gifts: g.totalGifts, total_sessions: sessions,
        avg_gifts_per_session: sessions>0?Math.round(g.totalGifts/sessions):0,
        top_rooms: topRooms, script_template: null, script_lang: 'id',
        confidence: 0, first_seen: g.firstSeen, last_seen: g.lastSeen,
      };

      profile.interaction_style = classifyInteraction(profile);
      profile.persona = classifyPersona(profile);
      profile.confidence = computeConfidence(profile);
      profile.script_lang = matchScriptLang(profile);

      if (profile.confidence < CONFIDENCE_THRESHOLD) continue;

      try { profile.profile_status = await checkProfile(g.profileUrl); } catch { profile.profile_status = 'error'; }

      const { error: ue } = await supabase.from('whale_profiles').upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'username' }
      );
      if (ue) console.error(`[PE] Upsert fail ${uname}: ${ue.message}`);
      else built++;
    }

    console.log(`[PE] Built/updated ${built} profiles`);

    // Cleanup stale low-confidence
    const stale = new Date(Date.now()-14*86400000).toISOString();
    await supabase.from('whale_profiles').delete().lt('last_seen',stale).lt('confidence',0.5);
    console.log('[PE] Cleanup done');

  } catch(e) { console.error('[PE] Fatal:', e.message); }
}

if (require.main === module) {
  buildProfiles().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
}
module.exports = { buildProfiles };
