/**
 * WhaleBell WebSocket Client
 */
class WhaleBellWS {
  constructor(url, userId, callbacks) {
    this.url = url;
    this.userId = userId;
    this.callbacks = callbacks || {};
    this.ws = null;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('🔌 WhaleBell WS connected');
        this.authenticate();
        if (this.callbacks.onOpen) this.callbacks.onOpen();
      };

      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'whale_alert' && this.callbacks.onWhaleAlert) {
            this.callbacks.onWhaleAlert(msg.data);
          } else if (msg.type === 'auth_ok') {
            console.log('🔐 WS authenticated');
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WS disconnected, reconnecting in 3s...');
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        if (this.callbacks.onClose) this.callbacks.onClose();
      };

      this.ws.onerror = (err) => {
        console.error('WS error:', err);
      };
    } catch (err) {
      console.error('WS connection failed:', err);
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    }
  }

  authenticate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'auth', userId: this.userId }));
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}

// Auto-export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WhaleBellWS };
}
