/**
 * CDP Pool — 共享浏览器实例，多 tab 监控 TikTok 直播间
 * 
 * 核心设计：
 * - 一个 Chrome 实例（共享 cookies/session）
 * - 先访问 tiktok.com/live 拿 cookies
 * - 然后用同一个浏览器发现房间 + 连接 webcast
 * - 每个房间一个 page（tab）+ CDP session
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { deserializeWebSocketMessage } = require('tiktok-live-connector/dist/lib/utilities');

const CHROME_PATH = 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

class CDPPool {
  constructor() {
    this.browser = null;
    this.pages = new Map();      // roomName -> { page, cdp, callbacks, frameCount, connected }
    this.initialized = false;
  }

  /** 启动共享浏览器 + cookie 预热 */
  async init() {
    if (this.initialized) return;
    
    console.log('[CDPPool] 🚀 Launching shared Chrome...');
    this.browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--mute-audio', '--window-size=400,600',
      ],
    });

    // Warm up cookies
    const warmPage = await this.browser.newPage();
    await warmPage.setViewport({ width: 800, height: 900 });
    await setupResourceBlocking(warmPage);
    
    console.log('[CDPPool] 🍪 Warming cookies...');
    try {
      await warmPage.goto('https://www.tiktok.com/live', {
        waitUntil: 'networkidle2', timeout: 25000
      });
    } catch (e) {
      console.log('[CDPPool] Warmup:', e.message.slice(0, 60));
    }
    await sleep(3000);
    await warmPage.close();
    
    this.initialized = true;
    console.log('[CDPPool] ✅ Ready');
  }

  /** 发现直播房间 */
  async discoverRooms(options = {}) {
    await this.init();
    const { maxRooms = 20, checkWebcast = true } = options;
    
    const page = await this.browser.newPage();
    await page.setViewport({ width: 800, height: 900 });
    await setupResourceBlocking(page);
    
    try {
      await page.goto('https://www.tiktok.com/live', {
        waitUntil: 'networkidle2', timeout: 25000
      });
    } catch (e) {}
    
    await sleep(5000);
    
    // Extract rooms from DOM
    const rooms = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const results = [];
      for (let i = 0; i < lines.length - 3; i++) {
        if (lines[i] !== 'LIVE') continue;
        const username = lines[i + 1];
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,23}$/.test(username)) continue;
        results.push({
          username,
          nickname: lines[i + 2] || username,
          viewers: parseInt(lines[i + 3]) || 0,
        });
      }
      return results;
    });

    const seen = new Set();
    const unique = rooms
      .filter(r => { if (seen.has(r.username)) return false; seen.add(r.username); return true; })
      .sort((a, b) => b.viewers - a.viewers)
      .slice(0, maxRooms);

    console.log(`[CDPPool] Found ${unique.length} candidate rooms`);

    // Check webcast for top rooms
    if (checkWebcast && unique.length > 0) {
      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      
      const topN = unique.slice(0, Math.min(10, unique.length));
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
        await sleep(5000);
        
        cdp.off('Network.webSocketCreated', handler);
        room.hasWebcast = hasWebcast;
      }
      await cdp.detach();
      
      const liveCount = unique.filter(r => r.hasWebcast).length;
      console.log(`[CDPPool] ${liveCount} rooms confirmed with webcast`);
    }
    
    await page.close();
    return unique;
  }

  /** 监控一个房间（在同一浏览器中创建 tab） */
  async startWatching(roomName, callbacks = {}) {
    await this.init();
    
    if (this.pages.has(roomName)) {
      console.log(`[CDPPool] @${roomName} already watching`);
      return { success: false, error: 'Already watching' };
    }

    try {
      const page = await this.browser.newPage();
      await page.setViewport({ width: 400, height: 600 });
      await setupResourceBlocking(page);
      
      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      
      let frameCount = 0;
      let webcastUrl = '';
      let lastDataTime = Date.now();
      let connected = false;
      
      // Heartbeat check
      const heartbeat = setInterval(() => {
        if (connected && Date.now() - lastDataTime > 90000) {
          console.log(`[CDPPool] @${roomName} heartbeat timeout, reconnecting...`);
          page.reload().catch(() => {});
          lastDataTime = Date.now();
        }
      }, 30000);

      // WebSocket events
      cdp.on('Network.webSocketCreated', ({ url }) => {
        if (url.includes('webcast')) {
          webcastUrl = url;
          console.log(`[CDPPool] @${roomName} 🎯 WEBCAST!`);
          if (callbacks.onLiveCheck) callbacks.onLiveCheck(roomName, true);
        }
      });

      cdp.on('Network.webSocketClosed', () => {
        if (connected) {
          console.log(`[CDPPool] @${roomName} WS closed`);
        }
      });

      cdp.on('Network.webSocketFrameReceived', async ({ response }) => {
        if (!response || !response.payloadData) return;
        frameCount++;
        lastDataTime = Date.now();

        try {
          const buf = Buffer.from(response.payloadData, 'base64');
          const decoded = await deserializeWebSocketMessage(buf);
          
          if (!decoded?.protoMessageFetchResult?.messages) return;
          
          for (const msg of decoded.protoMessageFetchResult.messages) {
            if (!msg.decodedData) continue;
            
            const type = msg.decodedData.type;
            const data = msg.decodedData.data;
            
            if (callbacks.onEvent) {
              callbacks.onEvent(roomName, type, data);
            }
          }
        } catch (e) {
          // Skip decode errors (heartbeat/protocol frames)
        }
      });

      // Set referrer to trick TikTok into thinking we came from LIVE feed
      await page.setExtraHTTPHeaders({
        'Referer': 'https://www.tiktok.com/live',
      });

      // Navigate to room
      console.log(`[CDPPool] @${roomName} 📡 Connecting...`);
      try {
        await page.goto(`https://www.tiktok.com/@${roomName}/live`, {
          waitUntil: 'domcontentloaded', timeout: 15000
        });
      } catch (e) {
        console.log(`[CDPPool] @${roomName} nav: ${e.message.slice(0, 60)}`);
      }

      // Wait for webcast connection (up to 12 seconds)
      let waited = 0;
      while (waited < 12000 && !webcastUrl) {
        await sleep(1000);
        waited += 1000;
      }

      // Final short wait for any late frames
      await sleep(2000);

      connected = true;
      const isLive = !!webcastUrl;

      this.pages.set(roomName, {
        page, cdp, callbacks, frameCount, connected, isLive,
        webcastUrl, heartbeat, lastDataTime,
      });

      console.log(`[CDPPool] @${roomName} ${isLive ? 'LIVE ✅' : 'offline'} (${frameCount} frames)`);
      
      if (callbacks.onConnected) callbacks.onConnected(roomName);
      
      return { success: true, live: isLive, frames: frameCount };

    } catch (err) {
      console.error(`[CDPPool] @${roomName} error:`, err.message);
      if (callbacks.onError) callbacks.onError(roomName, err);
      return { success: false, error: err.message };
    }
  }

  /** 停止监控一个房间 */
  async stopWatching(roomName) {
    const entry = this.pages.get(roomName);
    if (!entry) return false;
    
    clearInterval(entry.heartbeat);
    try { await entry.cdp.detach(); } catch (e) {}
    try { await entry.page.close(); } catch (e) {}
    this.pages.delete(roomName);
    console.log(`[CDPPool] @${roomName} stopped`);
    return true;
  }

  /** 获取状态 */
  getStatus() {
    const rooms = [];
    for (const [name, entry] of this.pages) {
      rooms.push({
        roomName: name,
        connected: entry.connected,
        live: entry.isLive,
        webcast: !!entry.webcastUrl,
        frames: entry.frameCount,
      });
    }
    return rooms;
  }

  /** 关闭所有 */
  async shutdown() {
    for (const [name] of this.pages) {
      await this.stopWatching(name);
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.initialized = false;
  }
}

/** 设置页面资源拦截（去肉留骨） */
async function setupResourceBlocking(page) {
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['image', 'media', 'font', 'imageset'].includes(type))
      return req.abort();
    if (/\.(mp4|webm|png|jpg|jpeg|webp|gif|svg|woff2|ttf|otf|mp3)/i.test(req.url()))
      return req.abort();
    req.continue();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Singleton
let instance = null;

function getPool() {
  if (!instance) instance = new CDPPool();
  return instance;
}

module.exports = { CDPPool, getPool };
