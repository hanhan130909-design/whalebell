
const { WebcastPushConnection } = require('tiktok-live-connector');

async function test() {
  const roomId = 'nitaanita_067';
  console.log(`🔌 Connecting to ${roomId}...`);
  
  const conn = new WebcastPushConnection(roomId);
  
  conn.on('connected', () => {
    console.log('✅ Connected!');
    setTimeout(() => process.exit(0), 2000);
  });
  
  conn.on('disconnected', () => {
    console.log('❌ Disconnected');
    process.exit(1);
  });
  
  conn.on('error', (err) => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });
  
  conn.on('streamEnd', () => {
    console.log('📴 Stream ended');
    process.exit(0);
  });
  
  try {
    await conn.connect();
    console.log('Connection initiated');
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  }
  
  // Timeout after 15 seconds
  setTimeout(() => {
    console.log('⏱️ Timeout - no connection established');
    process.exit(1);
  }, 15000);
}

test();
