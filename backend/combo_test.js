
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { deserializeWebSocketMessage } = require('tiktok-live-connector/dist/lib/utilities');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  });

  // Phase 1: Discover live rooms
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 900 });
  
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['image', 'media', 'font', 'imageset'].includes(type)) return req.abort();
    if (/\.(mp4|webm|png|jpg|jpeg|webp|gif|svg)/i.test(req.url())) return req.abort();
    req.continue();
  });

  try {
    await page.goto('https://www.tiktok.com/live', { 
      waitUntil: 'networkidle2', timeout: 25000 
    });
  } catch(e) {}
  await new Promise(r => setTimeout(r, 5000));

  const rooms = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];
    for (let i = 0; i < lines.length - 2; i++) {
      if (lines[i] === 'LIVE') {
        const username = lines[i+1];
        const viewers = parseInt(lines[i+3]) || 0;
        // Basic validation
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) continue;
        if (username.length > 25 || username.length < 2) continue;
        if (['Suggested', 'See', 'Discover', 'Log', 'For', 'Following'].includes(username)) continue;
        results.push({ username, viewers });
      }
    }
    return results;
  });

  const seen = new Set();
  const unique = rooms.filter(r => { if (seen.has(r.username)) return false; seen.add(r.username); return true; });
  
  // Sort by viewers, pick top
  unique.sort((a, b) => b.viewers - a.viewers);
  const topRooms = unique.slice(0, 10);
  
  console.log(`Discovered ${unique.length} rooms. Top 10:`);
  topRooms.forEach(r => console.log(`  @${r.username} - ${r.viewers} viewers`));

  // Phase 2: Test each room for webcast connection
  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  
  const liveRooms = [];
  
  for (const room of topRooms.slice(0, 5)) {
    let webcastFound = false;
    let frameCount = 0;
    
    const wsHandler = ({url}) => {
      if (url.includes('webcast')) {
        webcastFound = true;
        console.log(`\n  🎯 @${room.username}: WEBCAST! ${url.slice(0, 80)}...`);
      }
    };
    
    const frameHandler = async ({response}) => {
      if (!response || !response.payloadData) return;
      frameCount++;
      try {
        const buf = Buffer.from(response.payloadData, 'base64');
        const decoded = await deserializeWebSocketMessage(buf);
        if (decoded?.protoMessageFetchResult?.messages?.length) {
          for (const msg of decoded.protoMessageFetchResult.messages) {
            if (msg.decodedData) {
              const type = msg.decodedData.type;
              const data = msg.decodedData.data;
              const user = data?.user || data?.sender || {};
              const uname = (user.uniqueId || '').replace(/^@/, '');
              console.log(`     📨 ${type}: @${uname}`);
            }
          }
        }
      } catch(e) {}
    };
    
    cdp.on('Network.webSocketCreated', wsHandler);
    cdp.on('Network.webSocketFrameReceived', frameHandler);
    
    try {
      await page.goto(`https://www.tiktok.com/@${room.username}/live`, {
        waitUntil: 'domcontentloaded', timeout: 12000
      });
    } catch(e) {}
    
    await new Promise(r => setTimeout(r, 8000));
    
    cdp.off('Network.webSocketCreated', wsHandler);
    cdp.off('Network.webSocketFrameReceived', frameHandler);
    
    if (webcastFound) {
      liveRooms.push({ username: room.username, viewers: room.viewers, frames: frameCount });
    }
    
    if (liveRooms.length >= 2) break;  // Found 2 live rooms, stop
  }

  console.log(`\n\n🎯 LIVE ROOMS (with webcast):`);
  if (liveRooms.length === 0) {
    console.log('  NONE - all rooms require login or are not streaming');
  } else {
    liveRooms.forEach(r => console.log(`  @${r.username} - ${r.viewers} viewers - ${r.frames} frames`));
  }
  
  await browser.close();
})();
