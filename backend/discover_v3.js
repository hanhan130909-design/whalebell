
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--mute-audio', '--window-size=1280,900'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  
  // ALLOW stylesheets - block everything else
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    // Only block: image, media, font
    if (['image', 'media', 'font', 'imageset'].includes(type))
      return req.abort();
    // Also block known image/audio CDN URLs
    const url = req.url();
    if (/\.(mp4|webm|m3u8|ts|png|jpg|jpeg|webp|gif|svg|woff2|ttf|otf|mp3|ogg|aac)($|\?)/i.test(url))
      return req.abort();
    req.continue();
  });

  console.log('Loading...');
  try {
    await page.goto('https://www.tiktok.com/live', { 
      waitUntil: 'networkidle2', timeout: 25000 
    });
  } catch(e) {
    console.log('Nav timeout (expected):', e.message.slice(0, 60));
  }
  
  // Wait more for rendering
  await new Promise(r => setTimeout(r, 5000));
  
  // Extract usernames  
  const rooms = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    const results = [];
    for (let i = 0; i < lines.length - 2; i++) {
      if (lines[i] === 'LIVE') {
        const username = lines[i+1];
        const nickname = lines[i+2];
        const viewers = parseInt(lines[i+3]) || 0;
        
        if (!['Suggested LIVE creators', 'See all', 'Discover LIVE', 'Go LIVE', 'For You', 'Log in', 'Following'].includes(username) &&
            username.length <= 25 && username.length > 0) {
          results.push({ username, nickname, viewers });
        }
      }
    }
    return results;
  });
  
  const seen = new Set();
  const unique = rooms.filter(r => {
    if (seen.has(r.username)) return false;
    seen.add(r.username);
    return true;
  });
  
  console.log(`\nFound ${unique.length} live rooms:`);
  unique.forEach(r => console.log(`  @${r.username} | "${r.nickname}" | ${r.viewers} 👁`));
  
  await browser.close();
})();
