
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch(e) {}
try { require('dotenv').config(); } catch(e) {}
const { initWebSocket } = require('./src/websocket');
const routes = require('./src/routes');
const sniperRoutes = require('./src/sniper');
const distRoutes = require('./src/distribution');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api', routes);
app.use('/api/sniper', sniperRoutes);
app.use('/api/dist', distRoutes);
app.get('/health', (req, res) => res.json({status:'ok', name:'WhaleBell-CDP', version:'2.0', uptime:process.uptime()}));

const server = http.createServer(app);
initWebSocket(server);
server.listen(3103, '0.0.0.0', () => console.log('🐋 CDP on :3103'));
