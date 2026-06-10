
const fs = require('fs');
const log = (msg) => { console.log(msg); fs.appendFileSync('_worker_test.log', msg + '\n'); };

(async () => {
try {
  const { CDPPool } = require('./src/cdp_pool');
  const { saveWhaleAlert } = require('./src/database');
  
  const pool = new CDPPool();
  
  log('Discovering...');
  const rooms = await pool.discoverRooms({ maxRooms: 5, checkWebcast: true });
  const live = rooms.filter(r => r.hasWebcast);
  log('Live: ' + live.length);
  
  if (live.length === 0) { log('No live'); await pool.shutdown(); process.exit(0); }
  
  const target = live[0];
  log('Watching @' + target.username);
  
  let events = 0;
  
  await pool.startWatching(target.username, {
    onEvent(name, type, data) {
      events++;
      const user = data?.user || {};
      const username = (user.uniqueId || user.userId || '').replace(/^@/, '');
      let level = user.topVipNo || 0;
      if (events <= 10) log('  #' + events + ' ' + type + ': @' + username + ' LV' + (level||'?'));
    }
  });
  
  await new Promise(r => setTimeout(r, 30000));
  
  log('Events: ' + events);
  await pool.shutdown();
} catch(e) { log('FATAL: ' + e.message + '\n' + e.stack); }
})();
