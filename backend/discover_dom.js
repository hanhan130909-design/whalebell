
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

  // Capture API URLs that contain room info
  const feedUrls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('webcast.tiktok.com/webcast/feed/')) {
      feedUrls.push(url);
    }
  });

  await page.goto('https://www.tiktok.com/live', { 
    waitUntil: 'networkidle0', 
    timeout: 30000 
  });
  
  // Wait for content to render
  await new Promise(r => setTimeout(r, 3000));
  
  // Extract live rooms from DOM
  const rooms = await page.evaluate(() => {
    const results = [];
    const allText = document.body.innerText;
    
    // Find all LIVE indicators followed by usernames
    const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
    
    // The LIVE page structure is: "LIVE" followed by username, then nickname, then viewer count
    for (let i = 0; i < lines.length - 2; i++) {
      if (lines[i] === 'LIVE' && i + 2 < lines.length) {
        const username = lines[i+1];
        const nickname = lines[i+2];
        // Skip obvious non-usernames
        if (username === 'Suggested LIVE creators' || username === 'See all' || 
            username === 'Discover LIVE' || username === 'Go LIVE' ||
            username.length > 30) continue;
        
        // Viewer count is typically numeric
        const viewers = parseInt(lines[i+3]) || 0;
        
        results.push({ username, nickname, viewers });
      }
    }
    return results;
  });
  
  // Print results
  console.log(`Found ${rooms.length} live rooms from DOM:\n`);
  rooms.forEach(r => {
    console.log(`  @${r.username} | "${r.nickname}" | ${r.viewers} viewers`);
  });
  
  // Also print any feed API URLs captured
  console.log(`\nFeed API URLs: ${feedUrls.length}`);
  feedUrls.slice(0, 5).forEach(u => console.log('  ', u.slice(0, 150)));
  
  await browser.close();
})();
