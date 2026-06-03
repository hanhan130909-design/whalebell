// Step 2: Debug file listing
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3101;

app.use(cors());
app.use(express.json());

// Debug: list files
app.get('/debug', (req, res) => {
  const dirs = ['.', 'frontend', 'backend', 'backend/src'];
  const result = {};
  for (const d of dirs) {
    const full = path.join(__dirname, d);
    try {
      result[d] = fs.existsSync(full) ? fs.readdirSync(full).slice(0, 20) : 'NOT_FOUND';
    } catch(e) { result[d] = e.message; }
  }
  res.json({ __dirname, cwd: process.cwd(), dirs: result });
});

// Static files
const frontendPath = path.join(__dirname, 'frontend');
console.log('Frontend path:', frontendPath);
console.log('Exists:', fs.existsSync(frontendPath));
if (fs.existsSync(frontendPath)) {
  console.log('Files:', fs.readdirSync(frontendPath).join(', '));
}

app.use(express.static(frontendPath));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/sniper.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 Step2 on 0.0.0.0:' + PORT);
});
