// Step 3: Raw HTML serving, no static middleware
const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3101;
const FRONTEND = path.join(__dirname, 'frontend');

// Serve sniper.html directly
app.get('/sniper.html', (req, res) => {
  const html = fs.readFileSync(path.join(FRONTEND, 'sniper.html'), 'utf-8');
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/debug', (req, res) => {
  res.json({ dir: FRONTEND, exists: fs.existsSync(FRONTEND) });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/sniper.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 Step3 on 0.0.0.0:' + PORT);
});
