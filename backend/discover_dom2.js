
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 900 });
  
  // Block media
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['image', 'media', 'font', 'stylesheet', 'imageset'].includes(type))
      return req.abort();
    req.continue();
  });

  try {
    await page.goto('https://www.tiktok.com/live', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
  } catch(e) {
    console.log('Nav warning (expected):', e.message.slice(0, 80));
  }
  
  // Wait for JS to render room list
  await new Promise(r => setTimeout(r, 8000));
  
  // Scroll to load more
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 3000));
  
  // Extract live rooms
  const rooms = await page.evaluate(() => {
    const results = [];
    const allText = document.body.innerText;
    const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
    
    for (let i = 0; i < lines.length - 2; i++) {
      if (lines[i] === 'LIVE' && i + 2 < lines.length) {
        const username = lines[i+1];
        const nickname = lines[i+2];
        if (username === 'Suggested LIVE creators' || username === 'See all' || 
            username === 'Discover LIVE' || username === 'Go LIVE' ||
            username.length > 30 || username === 'For You') continue;
        
        let viewers = 0;
        if (i + 3 < lines.length) viewers = parseInt(lines[i+3]) || 0;
        
        results.push({ username, nickname, viewers });
      }
    }
    return results;
  });
  
  // Deduplicate
  const seen = new Set();
  const unique = rooms.filter(r => {
    if (seen.has(r.username)) return false;
    seen.add(r.username);
    return true;
  });
  
  console.log(`Found ${unique.length} live rooms:\n`);
  unique.forEach(r => {
    console.log(`  @${r.username} | "${r.nickname}" | ${r.viewers} 👁`);
  });
  
  await browser.close();
})();
