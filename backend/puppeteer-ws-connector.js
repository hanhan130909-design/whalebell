/**
 * Puppeteer CDP Connector for TikTok Live — v2.1
 * 
 * 用 Chrome DevTools Protocol 拦截 TikTok 直播间 WebSocket 数据帧，
 * 绕过 TikTok 的设备指纹/签名反爬。浏览器处理一切握手/加密，
 * 我们只截获 Protobuf 帧 → 解码 → 推送事件。
 * 
 * 【去肉留骨优化】
 * - 阻断所有 image/media/font/stylesheet 请求
 * - 只保留 document/script/xhr/websocket
 * - 原本 1 台服务器 3 个房间 → 优化后 15-20 个
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

/**
 * 创建直播间监听器
 * @param {string} roomName — TikTok 主播 username（不带 @）
 * @param {object} callbacks — { onEvent, onConnected, onDisconnected, onError, onLiveCheck }
 * @returns {object} — { connect, disconnect, isConnected, isLive, frameCount, roomTitle }
 */
function createRoomWatcher(roomName, callbacks = {}) {
  let browser = null;
  let page = null;
  let cdp = null;
  let connected = false;
  let heartbeatTimer = null;
  let frameCount = 0;
  let lastDataTime = 0;
  let webcastWsUrl = '';       // webcast.tiktok.com WS URL
  let roomIsLive = false;      // 直播间真正在播
  let roomTitle = '';          // 直播间标题
  let liveCheckDone = false;   // 已完成直播状态检测

  /** 心跳检测 — 超过 90 秒无数据则重连 */
  function startHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      const idle = Date.now() - lastDataTime;
      if (connected && idle > 90000) {
        console.log(`[${roomName}] ⚠️ No data for ${(idle/1000).toFixed(0)}s, reconnecting...`);
        reconnect();
      }
    }, 30000);
  }

  async function reconnect() {
    try { await disconnect(); } catch (_) {}
    // 等 3 秒再连
    await sleep(3000);
    await connect();
  }

  async function connect() {
    if (connected) {
      console.log(`[${roomName}] Already connected`);
      return;
    }

    // 重置状态
    frameCount = 0;
    lastDataTime = Date.now();
    webcastWsUrl = '';
    roomIsLive = false;
    roomTitle = '';
    liveCheckDone = false;

    try {
      console.log(`[${roomName}] 🚀 Launching headless Chrome...`);
      browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=400,600',
          '--disable-accelerated-2d-canvas',
          '--disable-webgl',
          '--mute-audio',
        ],
      });

      page = await browser.newPage();
      await page.setViewport({ width: 400, height: 600 });

      // ====== 去肉留骨：拦截所有非必要请求 ======
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const type = req.resourceType();
        const url = req.url();

        // 阻断媒体/字体/图片/样式
        const blockTypes = ['image', 'media', 'font', 'imageset', 'texttrack', 'manifest', 'ping', 'csp_report', 'stylesheet'];
        if (blockTypes.includes(type)) {
          req.abort();
          return;
        }

        // 额外阻断：CDN 资源
        if (/\.(mp4|webm|m3u8|ts|png|jpg|jpeg|webp|gif|svg|woff2|ttf|otf|mp3|ogg|aac)($|\?)/i.test(url)) {
          req.abort();
          return;
        }

        // 阻断广告/分析/追踪
        if (/doubleclick|google-analytics|facebook\.com\/tr|byteoversea\.com\/monitor|tiktok\.com\/api\/v\d\/ad/i.test(url)) {
          req.abort();
          return;
        }

        req.continue();
      });

      // ====== CDP 会话：拦截 WebSocket 帧 ======
      cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');

      // 监听 WS 创建 → 识别 webcast 连接
      cdp.on('Network.webSocketCreated', ({ url: wsUrl, requestId }) => {
        const shortUrl = wsUrl.slice(0, 120);
        console.log(`[${roomName}] 🔌 WS: ${shortUrl}...`);

        if (wsUrl.includes('webcast.tiktok.com') || wsUrl.includes('webcast-ws.tiktok.com') || wsUrl.includes('webcast-')) {
          webcastWsUrl = wsUrl;
          console.log(`[${roomName}] 🎯 LIVE WEBCAST detected!`);
          if (callbacks.onLiveCheck) callbacks.onLiveCheck(roomName, true);
        }
      });

      // 监听 WS 关闭
      cdp.on('Network.webSocketClosed', ({ requestId }) => {
        if (connected) {
          console.log(`[${roomName}] ❌ WS closed`);
          connected = false;
          if (callbacks.onDisconnected) callbacks.onDisconnected(roomName);
        }
      });

      // 帧到达事件 → 核心数据入口
      cdp.on('Network.webSocketFrameReceived', async ({ requestId, timestamp, response }) => {
        if (!response || !response.payloadData) return;

        frameCount++;
        lastDataTime = Date.now();

        try {
          // CDP 给的 payloadData 是 base64 编码的二进制
          const binaryBuffer = Buffer.from(response.payloadData, 'base64');

          // 用 tiktok-live-connector 的 Protobuf schema 解码
          const { deserializeWebSocketMessage } = require('tiktok-live-connector/dist/lib/utilities');
          const decoded = await deserializeWebSocketMessage(binaryBuffer);

          if (!decoded || !decoded.protoMessageFetchResult) return;

          const result = decoded.protoMessageFetchResult;

          // 遍历消息列表
          if (result.messages && Array.isArray(result.messages)) {
            for (const msg of result.messages) {
              if (!msg || !msg.decodedData) continue;

              const eventData = msg.decodedData.data;
              const eventType = msg.decodedData.type;

              // 直播状态确认
              if (eventType === 'WebcastControlMessage' && !liveCheckDone) {
                const action = eventData?.action || 0;
                if (action === 3) {
                  // action=3 通常表示直播中
                  roomIsLive = true;
                  liveCheckDone = true;
                }
              }

              // 映射事件类型
              const typeMap = {
                'WebcastGiftMessage': 'gift',
                'WebcastMemberMessage': 'member',
                'WebcastChatMessage': 'chat',
                'WebcastLikeMessage': 'like',
                'WebcastSocialMessage': 'social',
                'WebcastFollowMessage': 'follow',
                'WebcastShareMessage': 'share',
                'WebcastRoomUserSeqMessage': 'room_user_seq',
                'WebcastControlMessage': 'control',
                'WebcastRoomMessage': 'room',
              };

              const stdType = typeMap[eventType] || eventType;

              // 提取直播间标题
              if (eventType === 'WebcastRoomMessage' && eventData?.room?.title) {
                roomTitle = eventData.room.title;
              }

              if (callbacks.onEvent && stdType) {
                callbacks.onEvent(roomName, stdType, eventData);
              }
            }
          }

        } catch (e) {
          // 解码失败常见（心跳/协议帧），静默忽略
          if (callbacks.onError && 
              !e.message.includes('InvalidSchemaName') && 
              !e.message.includes('SchemaDecodeError') &&
              !e.message.includes('Unexpected end')) {
            callbacks.onError(roomName, e);
          }
        }
      });

      // 页面 JS 错误处理（TikTok 页面经常有 harmless JS 错误，只记录不转发）
      page.on('pageerror', (err) => {
        const msg = err?.message || '';
        // Skip known harmless TikTok errors
        if (msg.includes('reading') && msg.includes('null')) return;
        if (callbacks.onError && !msg.includes('default')) callbacks.onError(roomName, err);
      });

      page.on('close', () => {
        if (connected) {
          connected = false;
          if (callbacks.onDisconnected) callbacks.onDisconnected(roomName);
        }
      });

      // ====== Cookie 预热：先访问 tiktok.com/live 建立会话 ======
      console.log(`[${roomName}] 🍪 Warming up cookies...`);
      try {
        await page.goto('https://www.tiktok.com/live', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        await sleep(2000);
      } catch (e) {
        console.log(`[${roomName}] Warmup: ${e.message.slice(0, 60)}`);
      }

      // ====== 导航到目标直播间 ======
      const liveUrl = `https://www.tiktok.com/@${roomName}/live`;
      console.log(`[${roomName}] 📡 Navigating to ${liveUrl}...`);

      let pageLoaded = false;
      try {
        await page.goto(liveUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });
        pageLoaded = true;
      } catch (navErr) {
        console.log(`[${roomName}] ⚠️ Navigation timeout: ${navErr.message.slice(0, 80)}`);
      }

      if (!pageLoaded) {
        console.log(`[${roomName}] ⚠️ Page not fully loaded`);
        roomIsLive = false;
        liveCheckDone = true;
        connected = true; // "connected" means browser is running, even if room offline
        if (callbacks.onConnected) callbacks.onConnected(roomName);
        return;
      }

      // ====== 等待 Webcast 连接（最多 20 秒） ======
      let waited = 0;
      const waitInterval = 500;
      const maxWait = 20000;

      while (waited < maxWait) {
        if (webcastWsUrl) break;  // webcast 连上了
        if (frameCount > 5) break;  // 已经收到数据
        
        await sleep(waitInterval);
        waited += waitInterval;
      }

      // ====== 再等 5 秒收数据确认直播状态 ======
      if (webcastWsUrl && frameCount < 3) {
        console.log(`[${roomName}] ⏳ Waiting for live data...`);
        let dataWait = 0;
        while (dataWait < 10000 && frameCount < 3) {
          await sleep(500);
          dataWait += 500;
        }
      }

      // 判断直播状态
      if (webcastWsUrl && frameCount >= 3) {
        roomIsLive = true;
        liveCheckDone = true;
      } else if (waited >= maxWait && !webcastWsUrl) {
        roomIsLive = false;
        liveCheckDone = true;
      }

      connected = true;
      lastDataTime = Date.now();
      startHeartbeat();

      const status = roomIsLive 
        ? `LIVE (${frameCount} frames)` 
        : `OFFLINE (no webcast, ${frameCount} frames)`;
      
      console.log(`[${roomName}] ✅ ${status}${roomTitle ? ' — ' + roomTitle : ''}`);

      if (callbacks.onConnected) callbacks.onConnected(roomName);

    } catch (e) {
      console.error(`[${roomName}] ❌ Connect error:`, e.message);
      if (callbacks.onError) callbacks.onError(roomName, e);
      await disconnectSilent();
    }
  }

  async function disconnectSilent() {
    try {
      clearInterval(heartbeatTimer);
      if (cdp) { try { await cdp.detach(); } catch(_) {} }
      if (page && !page.isClosed()) { try { await page.close(); } catch(_) {} }
      if (browser) { try { await browser.close(); } catch(_) {} }
    } catch(_) {}
    cdp = null;
    page = null;
    browser = null;
  }

  async function disconnect() {
    connected = false;
    roomIsLive = false;
    console.log(`[${roomName}] 🛑 Disconnecting...`);
    await disconnectSilent();
    if (callbacks.onDisconnected) callbacks.onDisconnected(roomName);
  }

  return {
    connect,
    disconnect,
    get isConnected() { return connected; },
    get isLive() { return roomIsLive; },
    get name() { return roomName; },
    get frameCount() { return frameCount; },
    get roomTitle() { return roomTitle; },
    get webcastUrl() { return webcastWsUrl; },
  };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { createRoomWatcher };
