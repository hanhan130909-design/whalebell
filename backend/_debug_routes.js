
const fs = require('fs');
const routes = require('./src/routes');
let out = 'Type: ' + typeof routes + '\n';
if (routes && routes.stack) {
  out += 'Routes:\n';
  for (const l of routes.stack) {
    if (l.route) {
      out += '  ' + Object.keys(l.route.methods).join(',') + ' ' + l.route.path + '\n';
    }
  }
} else {
  out += 'No stack\n';
}
fs.writeFileSync('_routes_debug.txt', out);
