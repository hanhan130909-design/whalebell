/**
// Crash handler for Railway debugging
process.on('uncaughtException', (err) => {
  console.error('FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Keep-alive diagnostics
let exitReason = 'unknown';
process.on('exit', (code) => {
  console.error(`EXIT CODE: ${code} | REASON: ${exitReason}`);
});
process.on('SIGTERM', () => { exitReason = 'SIGTERM'; console.error('Received SIGTERM'); });
process.on('SIGINT', () => { exitReason = 'SIGINT'; console.error('Received SIGINT'); });
process.on('SIGHUP', () => { exitReason = 'SIGHUP'; console.error('Received SIGHUP'); });

 * WhaleBell Backend Server
 * TikTok主播实时高等级观众提醒系统
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
// Load .env from multiple locations (Railway sets env vars directly)
try { require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); } catch(e) {}
try { require('dotenv').config(); } catch(e) {}

const { initWebSocket } = require('./websocket');
const { supabase } = require('./database');
const routes = require('./routes');
const sniperRoutes = require('./sniper');
const distRoutes = require('./distribution');

const app = express();
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 3101;
console.log(`PORT from env: ${process.env.PORT}, using: ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api', routes);
app.use('/api/sniper', sniperRoutes);
app.use('/api/dist', distRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WhaleBell',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🐋 WhaleBell Server');
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log('');
  console.log(`  🕒 Started at ${new Date().toISOString()}`);
  console.log('');
});
