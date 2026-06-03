
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');

async function test() {
  const conn = new TikTokLiveConnection('nitaanita_067');
  
  // Listen for DECODED_DATA (raw protobuf)
  conn.on(ControlEvent.DECODED_DATA, (event, data) => {
    // Only log interesting events
    if (['WebcastChatMessage', 'WebcastMemberMessage', 'WebcastGiftMessage', 'WebcastRoomUserSeqMessage'].includes(event)) {
      console.log('\n=== ' + event + ' ===');
      // Just show user info and badges related fields
      const output = {};
      
      function findKeys(obj, targetKeys, prefix) {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (targetKeys.includes(k)) {
            output[prefix + '.' + k] = typeof v === 'object' ? JSON.stringify(v).slice(0, 300) : v;
          }
          if (typeof v === 'object' && !Array.isArray(v)) {
            findKeys(v, targetKeys, prefix + '.' + k);
          } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
            findKeys(v[0], targetKeys, prefix + '.' + k + '[0]');
          }
        }
      }
      
      findKeys(data, ['level', 'badge', 'badges', 'privilege', 'honor', 'grade', 'rank', 'role', 'user', 'uniqueId', 'nickname', 'userId'], '');
      console.log(JSON.stringify(output, null, 2));
    }
  });
  
  // Also log standard chat events
  conn.on(WebcastEvent.CHAT, (data) => {
    console.log('\n=== CHAT (simplified) ===');
    console.log('uniqueId:', data.uniqueId);
    console.log('nickname:', data.nickname);
    console.log('userId:', data.userId);
    console.log('badges count:', data.badges?.length || 0);
    if (data.badges && data.badges.length > 0) {
      console.log('badge[0]:', JSON.stringify(data.badges[0]).slice(0, 500));
    }
  });
  
  conn.on(ControlEvent.CONNECTED, (state) => {
    console.log('CONNECTED!');
  });
  
  conn.on(ControlEvent.ERROR, (err) => {
    console.log('Error:', err.message || err.info || err);
  });
  
  try {
    await conn.connect();
    console.log('Connected, waiting for events...');
  } catch (err) {
    console.log('Failed:', err.message);
    process.exit(1);
  }
  
  setTimeout(() => {
    console.log('\nDone (15s timeout)');
    process.exit(0);
  }, 15000);
}

test();
