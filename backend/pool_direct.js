
const { CDPPool } = require('./src/cdp_pool');

(async () => {
  const pool = new CDPPool();
  await pool.init();
  
  // Discover
  const rooms = await pool.discoverRooms({ maxRooms: 5, checkWebcast: true });
  const live = rooms.filter(r => r.hasWebcast);
  console.log(`\nLive rooms with webcast: ${live.length}`);
  live.slice(0, 3).forEach(r => console.log(`  @${r.username} - ${r.viewers} viewers`));
  
  if (live.length === 0) {
    console.log('No live rooms - exiting');
    await pool.shutdown();
    return;
  }
  
  // Pick the top one and watch
  const target = live[0];
  console.log(`\n🔍 Watching @${target.username} for 60s...`);
  
  let eventCount = 0;
  let rawFrameCount = 0;
  
  await pool.startWatching(target.username, {
    onConnected(name) {
      const s = pool.getStatus().find(r => r.roomName === name);
      console.log(`Connected: live=${s?.live} frames=${s?.frames}`);
    },
    onEvent(name, type, data) {
      eventCount++;
      const user = data?.user || data?.sender || {};
      const uname = (user.uniqueId || '').replace(/^@/, '');
      const level = user?.level || user?.badgeList?.[0]?.level || 0;
      console.log(`  🐋 #${eventCount} ${type}: @${uname} LV${level}`);
    },
    onLiveCheck(name) {
      console.log(`  📡 WEBCAST: @${name}`);
    }
  });
  
  // Wait 60 seconds
  await new Promise(r => setTimeout(r, 60000));
  
  const status = pool.getStatus();
  console.log(`\n📊 After 60s:`);
  status.forEach(s => {
    console.log(`  @${s.roomName}: live=${s.live} webcast=${s.webcast} frames=${s.frames}`);
  });
  console.log(`Events captured: ${eventCount}`);
  
  await pool.shutdown();
  console.log('Done.');
})();
