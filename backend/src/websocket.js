/**
 * WhaleBell WebSocket Module
 * 实时推送高等级观众进场提醒给前端
 */
const WebSocket = require('ws');

let wss = null;
const clients = new Map(); // userId -> Set<WebSocket>

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });
  console.log('🔌 WebSocket server ready');

  wss.on('connection', (ws, req) => {
    console.log('🔗 WebSocket client connected');

    // Client sends auth: { type: 'auth', userId: 'xxx' }
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'auth' && msg.userId) {
          if (!clients.has(msg.userId)) {
            clients.set(msg.userId, new Set());
          }
          clients.get(msg.userId).add(ws);
          ws.userId = msg.userId;
          console.log(`👤 User ${msg.userId} authenticated on WebSocket`);
          ws.send(JSON.stringify({ type: 'auth_ok' }));
        }
      } catch (e) {
        console.error('WS message error:', e.message);
      }
    });

    ws.on('close', () => {
      if (ws.userId && clients.has(ws.userId)) {
        clients.get(ws.userId).delete(ws);
        if (clients.get(ws.userId).size === 0) {
          clients.delete(ws.userId);
        }
      }
      console.log('🔌 WebSocket client disconnected');
    });
  });
}

/**
 * 向指定用户推送高等级观众进场提醒
 */
function sendAlert(userId, alert) {
  if (!clients.has(userId)) return false;
  let sent = 0;
  const msg = JSON.stringify({ type: 'whale_alert', data: alert });
  for (const ws of clients.get(userId)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      sent++;
    }
  }
  return sent > 0;
}

/**
 * 广播给所有连接的客户端
 */
function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

module.exports = { initWebSocket, sendAlert, broadcast };
