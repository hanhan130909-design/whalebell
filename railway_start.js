// Railway healthcheck test - minimal server
const http = require('http');
const PORT = process.env.PORT || 3101;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status:'ok'}));
    return;
  }
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>WhaleBell</h1><a href="/sniper.html">Sniper</a>');
});

server.on('error', (e) => console.error('SERVER ERROR:', e.message));
server.on('listening', () => {
  const addr = server.address();
  console.log(`READY on ${addr.address}:${addr.port}`);
});

server.listen(PORT, '0.0.0.0');

// Heartbeat
setInterval(() => console.log('💓'), 15000);
