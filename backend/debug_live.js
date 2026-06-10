
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
  
  // Listen for all API responses
  const apiCalls = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('api') || url.includes('live') || url.includes('webcast')) {
      apiCalls.push({ url: url.slice(0, 150), status: resp.status() });
    }
  });
  
  // Listen for console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE:', msg.text().slice(0, 200));
    }
  });
  
  try {
    await page.goto('https://www.tiktok.com/live', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
  } catch(e) {
    console.log('Nav error:', e.message.slice(0, 100));
  }
  
  // Wait 5 more seconds
  await new Promise(r => setTimeout(r, 5000));
  
  // Get page title
  const title = await page.title();
  console.log('Title:', title);
  
  // Get body text snippet
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body:', bodyText);
  
  // Check URL after load (redirect?)
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  // Print API calls
  console.log('\nAPI calls:', apiCalls.length);
  apiCalls.forEach(c => console.log('  ', c.status, c.url));
  
  await browser.close();
})();
