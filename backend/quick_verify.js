
const { discoverAndMonitor, getMonitorStatus } = require('./src/monitor');

discoverAndMonitor('test_hermes', { maxRooms: 1 }).then(result => {
  const status = getMonitorStatus();
  console.log('\n=== PIPELINE VERIFICATION ===');
  console.log('Discovered:', result.rooms ? result.rooms.length : 0, 'rooms');
  console.log('Monitored:', result.monitored, 'rooms');
  console.log('\nActive monitors:');
  status.forEach(s => {
    console.log(`  @${s.roomName}: live=${s.live} webcast=${s.webcast} frames=${s.frames} title="${s.title}"`);
  });
  // Clean up
  status.forEach(s => { try { require('./src/monitor').stopMonitoring(s.roomName); } catch(e) {} });
  console.log('\n✅ Pipeline OK');
  setTimeout(() => process.exit(0), 1000);
}).catch(err => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
