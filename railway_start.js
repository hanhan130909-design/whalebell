// Step 5: require() route files directly
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3101;

app.use(cors());
app.use(express.json());

// API Routes — require directly (root has all deps)
app.use('/api', require('./backend/src/routes'));
app.use('/api/sniper', require('./backend/src/sniper'));
app.use('/api/dist', require('./backend/src/distribution'));

// Static frontend
app.get('/sniper.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(__dirname, 'frontend', 'sniper.html'), 'utf-8'));
});
app.get('/dashboard.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(__dirname, 'frontend', 'dashboard.html'), 'utf-8'));
});
app.get('/index.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(path.join(__dirname, 'frontend', 'index.html'), 'utf-8'));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/sniper.html'));

process.on('uncaughtException', (e) => console.error('FATAL:', e.message, e.stack));

app.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 Step5 on 0.0.0.0:' + PORT);
  console.log('Routes: /api, /api/sniper, /api/dist');
});
