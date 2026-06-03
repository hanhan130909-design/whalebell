
const { TikTokLiveConnection, ControlEvent } = require('tiktok-live-connector');

async function test() {
  const roomId = 'nitaanita_067';
  console.log(`Connecting to ${roomId}...`);
  
  const conn = new TikTokLiveConnection(roomId);
  
  conn.on(ControlEvent.CONNECTED, (state) => {
    console.log(`CONNECTED! Room: ${state.roomId}`);
    process.exit(0);
  });
  
  conn.on(ControlEvent.ERROR, (err) => {
    console.log('ERROR:', err.message || err.code || JSON.stringify(err));
    process.exit(1);
  });
  
  conn.on(ControlEvent.DISCONNECTED, () => {
    console.log('DISCONNECTED');
  });
  
  try {
    const state = await conn.connect();
    console.log(`Connect returned: ${JSON.stringify({roomId: state.roomId})}`);
  } catch (err) {
    console.log(`CONNECT FAILED: ${err.message || err.code || JSON.stringify(err)}`);
    process.exit(1);
  }
  
  setTimeout(() => {
    console.log('TIMEOUT - no connection after 20s');
    process.exit(1);
  }, 20000);
}

test();
