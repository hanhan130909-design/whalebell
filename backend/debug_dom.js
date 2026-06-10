
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
  
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'media', 'font', 'stylesheet', 'imageset'].includes(req.resourceType()))
      return req.abort();
    req.continue();
  });

  try {
    await page.goto('https://www.tiktok.com/live', { 
      waitUntil: 'domcontentloaded', timeout: 15000 
    });
  } catch(e) {}
  
  // Wait for rendering
  await new Promise(r => setTimeout(r, 10000));
  
  // Check what the page looks like
  const title = await page.title();
  console.log('Title:', title);
  
  // Get body HTML structure
  const html = await page.evaluate(() => {
    // Check for common TikTok LIVE selectors
    const selectors = [
      'div[class*="live"]', 'div[class*="room"]', 'div[class*="card"]',
      'a[href*="/@"]', 'div[class*="feed"]', 'div[class*="creator"]',
      'div[class*="Discover"]', 'div[class*="list"]'
    ];
    const results = {};
    for (const sel of selectors) {
      results[sel] = document.querySelectorAll(sel).length;
    }
    return results;
  });
  console.log('\nDOM selectors:', JSON.stringify(html, null, 2));
  
  // Get all links containing @
  const links = await page.evaluate(() => {
    const as = document.querySelectorAll('a[href*="/@"]');
    return Array.from(as).slice(0, 20).map(a => ({
      href: a.getAttribute('href')?.slice(0, 60),
      text: a.textContent?.trim()?.slice(0, 30)
    }));
  });
  console.log('\nLinks with @:', JSON.stringify(links, null, 2));
  
  // Check if we're on the right page
  const url = page.url();
  console.log('\nCurrent URL:', url);
  
  await browser.close();
})();
