
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');

async function test() {
  const conn = new TikTokLiveConnection('nitaanita_067');
  
  // Listen for ROOM_USER event (periodic top gifters/rankings)
  conn.on(WebcastEvent.ROOM_USER, (data) => {
    console.log('=== ROOM_USER (simplified) ===');
    console.log('viewerCount:', data.viewerCount);
    console.log('topGifters:', data.topGifters ? data.topGifters.length : 0);
    if (data.topGifters && data.topGifters.length > 0) {
      console.log('topGifter[0]:', JSON.stringify(data.topGifters[0]).slice(0, 800));
    }
    console.log('Keys:', Object.keys(data));
  });
  
  // Also check DECODED_DATA for WebcastRoomUserSeqMessage
  conn.on(ControlEvent.DECODED_DATA, (event, data) => {
    if (event === 'WebcastRoomUserSeqMessage') {
      console.log('\n=== DECODED: WebcastRoomUserSeqMessage ===');
      console.log('Top keys:', Object.keys(data));
      const msgData = data?.data || data;
      console.log('Data keys:', Object.keys(msgData));
      if (msgData.topUsers) {
        console.log('topUsers count:', msgData.topUsers.length);
        if (msgData.topUsers.length > 0) {
          console.log('topUsers[0]:', JSON.stringify(msgData.topUsers[0]).slice(0, 500));
        }
      }
      if (msgData.topGifters) {
        console.log('topGifters count:', msgData.topGifters.length);
        if (msgData.topGifters.length > 0) {
          console.log('topGifter[0]:', JSON.stringify(msgData.topGifters[0]).slice(0, 500));
        }
      }
      // Show all keys with sample values
      for (const k of Object.keys(msgData)) {
        const v = msgData[k];
        const sample = typeof v === 'object' ? 
          (Array.isArray(v) ? `Array(${v.length})` : 'Object') : 
          String(v).slice(0, 100);
        console.log(`  ${k}: ${sample}`);
      }
    }
  });
  
  conn.on(ControlEvent.CONNECTED, () => console.log('Connected!'));
  conn.on(ControlEvent.ERROR, (err) => console.log('Error:', err.message || err.info));
  
  try {
    await conn.connect();
    console.log('Waiting for data...');
  } catch(e) { console.log('Failed:', e.message); process.exit(1); }
  
  setTimeout(() => process.exit(0), 20000);
}
test();
