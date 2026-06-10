
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
  await page.setViewport({ width: 1280, height: 900 });
  
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'media', 'font', 'imageset'].includes(req.resourceType()))
      return req.abort();
    req.continue();
  });
  
  // Track navigation
  const rooms = ['edi4ria', 'real_iskan', 'nurulmuuuuu'];
  
  for (const room of rooms) {
    console.log(`\n=== @${room} ===`);
    
    // Listen for WS connections
    const wsUrls = [];
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    cdp.on('Network.webSocketCreated', ({url}) => {
      wsUrls.push(url.slice(0, 100));
      console.log(`  WS: ${url.slice(0, 100)}...`);
    });
    
    try {
      await page.goto(`https://www.tiktok.com/@${room}/live`, { 
        waitUntil: 'domcontentloaded', timeout: 15000 
      });
    } catch(e) {
      console.log(`  Nav: ${e.message.slice(0, 80)}`);
    }
    
    await new Promise(r => setTimeout(r, 5000));
    
    const url = page.url();
    const title = await page.title();
    console.log(`  URL: ${url.slice(0, 100)}`);
    console.log(`  Title: ${title.slice(0, 80)}`);
    console.log(`  WS count: ${wsUrls.length}`);
    
    await cdp.detach();
  }
  
  await browser.close();
})();
