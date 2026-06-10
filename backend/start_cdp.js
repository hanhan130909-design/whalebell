
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Load .env
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch(e) {}
try { require('dotenv').config(); } catch(e) {}

const { initWebSocket } = require('./src/websocket');
const routes = require('./src/routes');
const sniperRoutes = require('./src/sniper');
const distRoutes = require('./src/distribution');

const app = express();
const PORT = 3102;

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.use('/api', routes);
app.use('/api/sniper', sniperRoutes);
app.use('/api/dist', distRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'WhaleBell-CDP', version: '2.0-cdp', uptime: process.uptime() });
});

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 WhaleBell CDP v2.0 on http://localhost:' + PORT);
  console.log('   Routes: /api/monitor/discover, /api/monitor/status, /api/monitor/start, /api/monitor/stop');
});
