
try {
    require('puppeteer-extra');
    console.log('puppeteer-extra: OK');
} catch(e) { console.log('puppeteer-extra: MISSING - ' + e.message); }

try {
    require('puppeteer-extra-plugin-stealth');
    console.log('stealth: OK');
} catch(e) { console.log('stealth: MISSING - ' + e.message); }

try {
    const { deserializeWebSocketMessage } = require('tiktok-live-connector/dist/lib/utilities');
    console.log('deserializeWebSocketMessage: OK');
} catch(e) { console.log('deserializeWebSocketMessage: MISSING - ' + e.message); }
