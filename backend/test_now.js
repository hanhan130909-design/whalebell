
const { TikTokLiveConnection, ControlEvent } = require('tiktok-live-connector');
async function test() {
  const conn = new TikTokLiveConnection('nitaanita_067');
  
  conn.on(ControlEvent.ERROR, (err) => {
    console.log('ERROR:', JSON.stringify(err));
    console.log('ERROR.message:', err?.message);
    console.log('ERROR.info:', err?.info);
  });
  
  try {
    const state = await conn.connect();
    console.log('SUCCESS:', JSON.stringify({roomId: state.roomId}));
  } catch (err) {
    console.log('FAILED:', err?.message || err);
  }
  setTimeout(() => process.exit(0), 5000);
}
test();
