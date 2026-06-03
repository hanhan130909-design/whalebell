// Step 1: Express + Static only
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3101;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/', (req, res) => res.redirect('/sniper.html'));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🐋 Step1 on 0.0.0.0:' + PORT);
});
