
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');

async function test() {
  const roomId = 'nitaanita_067';
  console.log('Connecting...');
  
  const conn = new TikTokLiveConnection(roomId);
  
  // Log ALL events with full data
  conn.on(ControlEvent.DECODED_DATA, (event, data, binary) => {
    if (event === 'WebcastMemberMessage') {
      console.log('\n=== MEMBER EVENT ===');
      console.log(JSON.stringify(data, null, 2).slice(0, 3000));
    }
  });
  
  conn.on(WebcastEvent.MEMBER, (data) => {
    console.log('\n=== MEMBER (simplified) ===');
    console.log(JSON.stringify(data, null, 2).slice(0, 2000));
  });
  
  conn.on(WebcastEvent.CHAT, (data) => {
    console.log('\n=== CHAT EVENT ===');
    // Show key fields
    const keyFields = {
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      userId: data.userId,
      level: data.level,
      badges: data.badges ? data.badges.length : 0,
      badges_detail: JSON.stringify(data.badges).slice(0, 500),
      followerInfo: data.followerInfo ? JSON.stringify(data.followerInfo).slice(0, 300) : null,
      userDetails: data.userDetails ? JSON.stringify(data.userDetails).slice(0, 500) : null,
    };
    console.log(JSON.stringify(keyFields, null, 2));
    
    // After one chat event, disconnect
    conn.disconnect();
    setTimeout(() => process.exit(0), 1000);
  });
  
  conn.on(ControlEvent.ERROR, (err) => {
    console.log('ERROR:', err.message || err);
  });
  
  try {
    const state = await conn.connect();
    console.log(`Connected! Room: ${state.roomId}`);
    console.log('Waiting for events...');
  } catch (err) {
    console.log('Failed:', err.message);
    process.exit(1);
  }
  
  setTimeout(() => {
    console.log('\nTimeout - no events received');
    process.exit(0);
  }, 30000);
}

test();
