
const https = require('https');

function testUrl(url, label) {
  return new Promise((resolve) => {
    const req = https.get(url, {timeout: 5000}, (res) => {
      console.log(label + ' -> ' + res.statusCode);
      res.resume();
      res.on('end', () => resolve());
    });
    req.on('error', (e) => {
      console.log(label + ' -> ERROR: ' + e.message);
      resolve();
    });
    req.on('timeout', () => {
      console.log(label + ' -> TIMEOUT');
      req.destroy();
      resolve();
    });
  });
}

async function main() {
  await testUrl('https://www.tiktok.com', 'tiktok.com');
  await testUrl('https://www.tiktok.com/@yukii_619/live', '@yukii_619/live');
  await testUrl('https://webcast.tiktok.com', 'webcast');
}

main().then(() => setTimeout(() => process.exit(0), 1000));
