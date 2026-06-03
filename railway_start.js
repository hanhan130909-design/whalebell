/**
 * WhaleBell Railway Launcher v3
 */
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3101;

app.use(cors());
app.use(express.json());

// API Routes
try { app.use('/api', require('./backend/src/routes')); } catch(e) { console.error('routes fail:', e.message); }
try { app.use('/api/sniper', require('./backend/src/sniper')); } catch(e) { console.error('sniper fail:', e.message); }
try { app.use('/api/dist', require('./backend/src/distribution')); } catch(e) { console.error('dist fail:', e.message); }

// Static frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Root -> sniper
app.get('/', (req, res) => res.redirect('/sniper.html'));

const server = http.createServer(app);

// WebSocket
try {
  const { initWebSocket } = require('./backend/src/websocket');
  initWebSocket(server);
  console.log('🔌 WebSocket ready');
} catch(e) { console.error('ws fail:', e.message); }

process.on('uncaughtException', (e) => console.error('FATAL:', e.message));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🐋 WhaleBell on 0.0.0.0:${PORT}`);
  console.log(`📊 http://localhost:${PORT}/dashboard.html`);
});

setInterval(() => {}, 30000); // keep alive
