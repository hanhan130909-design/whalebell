/**
 * WhaleBell Live Room Monitor
 * 通过 TikTok-Live-Connector 监控直播间高等级观众
 */
const { TikTokLiveConnection, ControlEvent, WebcastEvent } = require('tiktok-live-connector');
const { saveWhaleAlert } = require('./database');
const { sendAlert } = require('./websocket');

const THRESHOLD = 0; // Show all users with badge data // 最低等级阈值
const COOLDOWN = 120; // 同一用户冷却时间(秒)

const activeConnections = new Map(); // roomId -> connection
const alertedUsers = new Map(); // roomId -> { username -> timestamp }

/**
 * 开始监控一个直播间
 */
async function startMonitoring(userId, roomId) {
  if (activeConnections.has(roomId)) {
    console.log(`⚠️  ${roomId} already being monitored`);
    return { success: false, error: 'Already monitoring' };
  }

  try {
    const connection = new TikTokLiveConnection(roomId);

    connection.on(WebcastEvent.CHAT, async (data) => {
      try {
        const username = data.uniqueId;
        const nickname = data.nickname;
        const level = data.badges?.[0]?.logExtra?.level || 0;
        const profileUrl = data.profilePictureUrl || '';
        const gifts = data.giftCount || 0;

        // Check threshold and cooldown
        if (level < THRESHOLD) return;

        const key = `${roomId}:${username}`;
        const now = Date.now();
        if (alertedUsers.has(key)) {
          const lastTime = alertedUsers.get(key);
          if (now - lastTime < COOLDOWN * 1000) return;
        }
        alertedUsers.set(key, now);

        const alert = {
          user_id: userId,
          username,
          nickname,
          level: parseInt(level),
          room_id: roomId,
          total_gifts: gifts,
          profile_url: profileUrl,
          source: 'tiktok-connector'
        };

        // Save to database
        await saveWhaleAlert(alert);

        // Push to frontend via WebSocket
        const sent = sendAlert(userId, { ...alert, room_title: data.roomInfo?.title || '' });
        console.log(`🐋 Alert: ${username} (LV${level}) in ${roomId} ${sent ? '✅' : '❌'}`);

      } catch (err) {
        console.error('chat handler error:', err.message);
      }
    });



    connection.on(ControlEvent.STREAM_END, () => {
      console.log(`📴 Stream ended: ${roomId}`);
      stopMonitoring(roomId);
    });

    connection.on(ControlEvent.DISCONNECTED, () => {
      console.log(`🔌 Disconnected: ${roomId}`);
    });

    connection.on(ControlEvent.ERROR, (err) => {
      console.error(`❌ Connection error (${roomId}):`, err.message);
    });

    const state = await connection.connect();
    activeConnections.set(roomId, connection);
    console.log(`✅ Monitoring: ${roomId} (room: ${state.roomId})`);
    return { success: true };

  } catch (err) {
    console.error(`❌ Failed to start monitoring ${roomId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 停止监控一个直播间
 */
function stopMonitoring(roomId) {
  const connection = activeConnections.get(roomId);
  if (connection) {
    try { connection.disconnect(); } catch (e) { /* ignore */ }
    activeConnections.delete(roomId);

    // Clean up cooldown cache
    for (const key of alertedUsers.keys()) {
      if (key.startsWith(roomId + ':')) {
        alertedUsers.delete(key);
      }
    }
    console.log(`⏹️  Stopped monitoring: ${roomId}`);
  }
}

/**
 * 获取监控状态
 */
function getMonitorStatus() {
  const rooms = [];
  for (const [roomId, conn] of activeConnections) {
    // Check various connection state properties
    const isConnected = conn.isConnected || 
      (conn.wsClient && conn.wsClient.connected) || false;
    rooms.push({ 
      roomId, 
      connected: isConnected,
      status: isConnected ? 'connected' : 'connecting'
    });
  }
  return rooms;
}

module.exports = { startMonitoring, stopMonitoring, getMonitorStatus };
