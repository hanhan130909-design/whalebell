
const { CDPPool } = require('./src/cdp_pool');
const fs = require('fs');

(async () => {
  const pool = new CDPPool();
  await pool.init();
  
  const rooms = await pool.discoverRooms({ maxRooms: 3, checkWebcast: true });
  const live = rooms.filter(r => r.hasWebcast);
  if (live.length === 0) { console.log('No live'); await pool.shutdown(); return; }
  
  let inspected = false;
  
  await pool.startWatching(live[0].username, {
    onEvent(name, type, data) {
      if (inspected) return;
      const user = data?.user || data?.sender || {};
      if (!user.userId) return;
      
      inspected = true;
      
      // Check badgeImageList
      if (user.badgeImageList && user.badgeImageList.length > 0) {
        console.log('\n=== badgeImageList ===');
        user.badgeImageList.forEach((b, i) => {
          console.log(`  [${i}] keys: ${Object.keys(b).join(', ')}`);
          console.log(`      sample: ${JSON.stringify(b).slice(0, 200)}`);
        });
      }
      
      // Check userHonor  
      if (user.userHonor) {
        console.log('\n=== userHonor ===');
        console.log(JSON.stringify(user.userHonor, null, 2).slice(0, 500));
      }
      
      // Check medal
      if (user.medal) {
        console.log('\n=== medal ===');
        console.log(JSON.stringify(user.medal, null, 2).slice(0, 300));
      }
      
      // Check fansClub
      if (user.fansClub) {
        console.log('\n=== fansClub ===');
        console.log(JSON.stringify(user.fansClub, null, 2).slice(0, 300));
      }
      
      // Check for any level-like field
      for (const key of Object.keys(user)) {
        const val = user[key];
        if (typeof val === 'number' && val > 0 && val < 100) {
          console.log(`\n  🔢 ${key}: ${val} (possible level!)`);
        }
      }
      
      // Search data for level anywhere
      const dataStr = JSON.stringify(data);
      const levelMatch = dataStr.match(/"level":\s*(\d+)/g);
      if (levelMatch) {
        console.log('\n=== Level matches in data ===');
        levelMatch.forEach(m => console.log(`  ${m}`));
      }
      
      // Also check badgeList on data directly (not user)
      if (data.badgeList) {
        console.log('\n=== data.badgeList ===');
        console.log(JSON.stringify(data.badgeList).slice(0, 500));
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 10000));
  
  fs.writeFileSync('_level_inspect_done.txt', 'ok');
  await pool.shutdown();
})();
