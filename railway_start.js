/**
 * WhaleBell Railway Launcher
 * Minimal entry point — no chdir, absolute paths
 */
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3101;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
try { app.use('/api', require('./backend/src/routes')); } catch(e) { console.error('routes:', e.message); }
try { app.use('/api/sniper', require('./backend/src/sniper')); } catch(e) { console.error('sniper:', e.message); }
try { app.use('/api/dist', require('./backend/src/distribution')); } catch(e) { console.error('dist:', e.message); }

// Static frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Health check (Railway uses TCP by default, this is extra)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Root → sniper
app.get('/', (req, res) => {
  res.redirect('/sniper.html');
});

// Create server
const server = http.createServer(app);

// WebSocket
try {
  const { initWebSocket } = require('./backend/src/websocket');
  initWebSocket(server);
  console.log('🔌 WebSocket ready');
} catch(e) { console.error('ws:', e.message); }

// Error handling
process.on('uncaughtException', (err) => console.error('CRASH:', err.message, err.stack));
process.on('unhandledRejection', (r) => console.error('REJECT:', r));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🐋 WhaleBell http://0.0.0.0:${PORT}`);
  console.log(`📊 ${PORT}/dashboard.html`);
});

// Keep alive signal every 30s
setInterval(() => {
  console.log(`💓 alive ${new Date().toISOString()}`);
}, 30000);
