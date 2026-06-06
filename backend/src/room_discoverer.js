/**
 * Room Discoverer — 从 tiktok.com/live 发现当前在播印尼/马来西亚房间
 * 返回已验证有 webcast 连接的房间列表
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

/**
 * 发现当前在播的 TikTok LIVE 房间
 * @param {object} options - { maxRooms: 20, checkWebcast: true, region: '' }
 * @returns {Array<{username, viewers, nickname, hasWebcast}>}
 */
async function discoverLiveRooms(options = {}) {
  const { maxRooms = 20, checkWebcast = true } = options;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 900 });

  // Block all media, keep document/script/stylesheet/xhr
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['image', 'media', 'font', 'imageset'].includes(type)) return req.abort();
    if (/\.(mp4|webm|png|jpg|jpeg|webp|gif|svg|woff2|ttf|otf|mp3)/i.test(req.url())) return req.abort();
    req.continue();
  });

  // Load LIVE feed
  try {
    await page.goto('https://www.tiktok.com/live', {
      waitUntil: 'networkidle2', timeout: 25000
    });
  } catch (e) {
    console.log(`[Discover] Load warning: ${e.message.slice(0, 60)}`);
  }

  await new Promise(r => setTimeout(r, 5000));

  // Extract rooms from DOM
  const rooms = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];
    
    for (let i = 0; i < lines.length - 3; i++) {
      if (lines[i] !== 'LIVE') continue;
      
      const username = lines[i + 1];
      
      // Validate username: alphanumeric + _ . -
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,23}$/.test(username)) continue;
      
      const nickname = lines[i + 2];
      const viewers = parseInt(lines[i + 3]) || 0;
      
      results.push({ username, nickname: nickname || username, viewers });
    }
    return results;
  });

  // Deduplicate and sort by viewers
  const seen = new Set();
  const unique = rooms
    .filter(r => { if (seen.has(r.username)) return false; seen.add(r.username); return true; })
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, maxRooms);

  console.log(`[Discover] Found ${unique.length} candidate rooms`);
  unique.slice(0, 5).forEach(r => console.log(`  @${r.username} - ${r.viewers} 👁`));

  // Optionally check webcast for top N rooms
  if (checkWebcast && unique.length > 0) {
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    
    const topN = unique.slice(0, Math.min(10, unique.length));
    let checked = 0;
    
    for (const room of topN) {
      let hasWebcast = false;
      
      const handler = ({ url }) => {
        if (url.includes('webcast')) hasWebcast = true;
      };
      
      cdp.on('Network.webSocketCreated', handler);
      
      try {
        await page.goto(`https://www.tiktok.com/@${room.username}/live`, {
          waitUntil: 'domcontentloaded', timeout: 10000
        });
      } catch (e) {}
      
      await new Promise(r => setTimeout(r, 5000));
      
      cdp.off('Network.webSocketCreated', handler);
      room.hasWebcast = hasWebcast;
      checked++;
      
      if (hasWebcast) {
        console.log(`  ✅ @${room.username}: WEBCAST CONFIRMED`);
      }
    }
    
    await cdp.detach();
  }

  await browser.close();
  return unique;
}

module.exports = { discoverLiveRooms };
