/**
 * WhaleBell Live Room Monitor v3 — 共享浏览器 CDP 方案
 * 
 * 单 Chrome 实例 + 多 tab = 共享 cookies/session
 * 发现 + 监控用同一个浏览器，绕过 TikTok 反爬
 */

const { saveWhaleAlert } = require('./database');
const { sendAlert } = require('./websocket');

let cdpPool = null;
function getPool() {
  if (!cdpPool) {
    try {
      cdpPool = require('./cdp_pool').getPool();
    } catch(e) {
      console.warn('[Monitor] CDP Pool not available (no Chrome on this machine)');
      throw e;
    }
  }
  return cdpPool;
}

const THRESHOLD = 0;
const COOLDOWN = 120;

const alertedUsers = new Map(); // roomId -> { username -> timestamp }

/**
 * 发现并开始监控（一键操作）
 */
async function discoverAndMonitor(userId, options = {}) {
  const maxRooms = options.maxRooms || 3;
  const pool = getPool();

  console.log(`[Monitor] 🔍 Discovering rooms for user ${userId}...`);
  const rooms = await pool.discoverRooms({ maxRooms: 10, checkWebcast: true });
  const liveRooms = rooms.filter(r => r.hasWebcast);

  if (liveRooms.length === 0) {
    return { success: false, error: 'No live rooms with webcast', rooms: rooms.slice(0, 5) };
  }

  console.log(`[Monitor] ${liveRooms.length} live rooms. Monitoring top ${maxRooms}...`);

  const results = [];
  for (const room of liveRooms.slice(0, maxRooms)) {
    const result = await startMonitoring(userId, room.username);
    results.push({ ...room, ...result });
  }

  return {
    success: results.some(r => r.success),
    monitored: results.filter(r => r.success).length,
    rooms: results
  };
}

/**
 * 开始监控一个直播间（使用共享浏览器）
 */
async function startMonitoring(userId, roomName) {
  const pool = getPool();
  const status = pool.getStatus();
  if (status.find(s => s.roomName === roomName)) {
    return { success: false, error: 'Already monitoring' };
  }

  const watcherRef = { frameCount: 0, isLive: false };

  const result = await pool.startWatching(roomName, {
    onConnected: (name) => {
      const info = pool.getStatus().find(s => s.roomName === name);
      watcherRef.isLive = info?.live || false;
      watcherRef.frameCount = info?.frames || 0;
      console.log(`✅ [Monitor] @${name}: ${watcherRef.isLive ? 'LIVE' : 'offline'}`);
    },

    onEvent: async (name, eventType, data) => {
      try {
        const user = data.user || data.sender || {};
        const username = (user.uniqueId || user.userId?.toString() || '').replace(/^@/, '');
        if (!username) return;

        const nickname = user.nickname || username;
        // Level extraction (multiple possible Protobuf paths)
        let level = 0;
        // Path 1: topVipNo (most reliable)
        if (user.topVipNo) level = parseInt(user.topVipNo) || 0;
        // Path 2: userBadges array (converted format)
        if (!level && user.userBadges?.[0]) {
          level = parseInt(user.userBadges[0].level || user.userBadges[0].badgeLevel) || 0;
        }
        // Path 3: badgeImageList (raw protobuf)
        if (!level && user.badgeImageList?.[0]) {
          level = parseInt(user.badgeImageList[0].level || user.badgeImageList[0].badgeLevel) || 0;
        }
        // Path 4: direct level field
        if (!level && user.level) level = parseInt(user.level) || 0;
        // Path 5: data-level fields
        if (!level && data.topVipNo) level = parseInt(data.topVipNo) || 0;
        if (!level && data.level) level = parseInt(data.level) || 0;
        // Path 6: extract from badge image URL (e.g. ...lv_30...)
        if (!level && user.badgeImageList?.[0]?.image?.urlList?.[0]) {
          const match = user.badgeImageList[0].image.urlList[0].match(/lv[_\-]?(\d+)/i);
          if (match) level = parseInt(match[1]) || 0;
        }

        if (level < THRESHOLD) return;

        const cooldownKey = `${name}:${username}`;
        const now = Date.now();
        if (alertedUsers.has(cooldownKey)) {
          if (now - alertedUsers.get(cooldownKey) < COOLDOWN * 1000) return;
        }
        alertedUsers.set(cooldownKey, now);

        let totalGifts = 0;
        if (eventType === 'WebcastGiftMessage') {
          const diamonds = parseInt(data.diamondCount) || 0;
          const repeats = parseInt(data.repeatCount) || 1;
          totalGifts = diamonds * repeats;
        }

        const alert = {
          user_id: userId,
          username,
          nickname,
          level,
          room_id: name,
          total_gifts: totalGifts,
          profile_url: user.profilePicture?.urls?.[0] || '',
          event_type: eventType,
          source: 'cdp-pool-v3',
          timestamp: new Date().toISOString()
        };

        await saveWhaleAlert(alert).catch(e => {});
        sendAlert(userId, alert);

        // Map raw protobuf type to short name for logging
        const shortType = eventType.replace('Webcast', '').replace('Message', '').toLowerCase();
        if (level >= 20 || shortType === 'gift' || shortType === 'member') {
          console.log(`🐋 ${shortType}: ${username} LV${level} in @${name}`);
        }
      } catch (err) {
        // silent
      }
    },

    onError: (name, err) => {
      const msg = err?.message || '';
      if (!msg.includes('null') && !msg.includes('default')) {
        console.error(`❌ [Monitor] @${name}:`, msg.slice(0, 100));
      }
    },

    onLiveCheck: (name, isLive) => {
      if (isLive) console.log(`📡 @${name} webcast LIVE`);
    }
  });

  return { success: result.success, live: result.live };
}

function stopMonitoring(roomName) {
  const pool = getPool();
  for (const key of alertedUsers.keys()) {
    if (key.includes(roomName)) alertedUsers.delete(key);
  }
  return pool.stopWatching(roomName);
}

function getMonitorStatus() {
  return getPool().getStatus();
}

module.exports = { startMonitoring, stopMonitoring, getMonitorStatus, discoverAndMonitor };
