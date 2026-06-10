
const { CDPPool } = require('./src/cdp_pool');
const fs = require('fs');

(async () => {
  const pool = new CDPPool();
  await pool.init();
  
  const rooms = await pool.discoverRooms({ maxRooms: 3, checkWebcast: true });
  const live = rooms.filter(r => r.hasWebcast);
  if (live.length === 0) { console.log('No live rooms'); await pool.shutdown(); return; }
  
  const target = live[0];
  console.log(`Inspecting @${target.username}...`);
  
  let samples = [];
  
  await pool.startWatching(target.username, {
    onEvent(name, type, data) {
      if (samples.length >= 8) return;
      
      // Dump full data structure for each event type we haven't seen yet
      const seen = samples.map(s => s.type);
      if (!seen.includes(type)) {
        // Deep inspect user object
        const user = data?.user || data?.sender || {};
        const badgeInfo = data?.user?.badgeList || data?.sender?.badgeList || user?.badgeList || [];
        const rawBadges = JSON.stringify(badgeInfo).slice(0, 200);
        const userKeys = Object.keys(user).slice(0, 20);
        
        samples.push({
          type,
          userKeys,
          hasBadgeList: !!data?.user?.badgeList,
          hasLevel: !!user?.level,
          badgeSample: rawBadges,
          idSample: user?.userId || user?.id || user?.uniqueId || 'N/A',
        });
        
        console.log(`\n=== ${type} ===`);
        console.log(`  userKeys: ${userKeys.join(', ')}`);
        console.log(`  hasBadgeList: ${!!data?.user?.badgeList}`);
        console.log(`  hasLevel: ${!!user?.level}`);
        console.log(`  id: ${user?.userId || user?.id || user?.uniqueId || 'N/A'}`);
        console.log(`  badgeSample: ${rawBadges}`);
        
        // Also check if data has top-level badgeList
        if (data?.badgeList) console.log(`  data.badgeList: ${JSON.stringify(data.badgeList).slice(0, 100)}`);
        if (data?.level) console.log(`  data.level: ${data.level}`);
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 15000));
  
  // Save samples for analysis
  fs.writeFileSync('_data_samples.json', JSON.stringify(samples, null, 2));
  console.log(`\nSaved ${samples.length} samples`);
  
  await pool.shutdown();
})();
