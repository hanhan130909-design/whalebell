
const { TikTokLiveConnection, ControlEvent } = require('tiktok-live-connector');

async function test() {
  const conn = new TikTokLiveConnection('nitaanita_067');
  
  conn.on(ControlEvent.DECODED_DATA, (event, data) => {
    if (event === 'WebcastChatMessage') {
      console.log('=== Data structure check ===');
      // Check the actual path
      const path1 = data?.user?.uniqueId;
      const path2 = data?.data?.user?.uniqueId;
      const path3 = data?.data?.user?.badges?.[0]?.logExtra?.level;
      
      console.log('data.user.uniqueId:', path1);
      console.log('data.data.user.uniqueId:', path2);
      console.log('data.data.user.badges[0].logExtra.level:', path3);
      console.log('\nKeys at root:', Object.keys(data));
      console.log('Keys at data:', data.data ? Object.keys(data.data) : 'N/A');
      
      // After first chat message, exit
      conn.disconnect();
      setTimeout(() => process.exit(0), 500);
    }
  });
  
  conn.on(ControlEvent.CONNECTED, () => console.log('Connected, waiting for chat...'));
  
  try {
    await conn.connect();
  } catch(e) {
    console.log('Failed:', e.message);
    process.exit(1);
  }
  
  setTimeout(() => { console.log('Timeout'); process.exit(0); }, 20000);
}

test();
