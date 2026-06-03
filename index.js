/**
 * WhaleBell Root Entry Point (for Railway)
 */
const path = require('path');

// Ensure we start from backend directory context
process.chdir(path.join(__dirname, 'backend'));

// Start the server
require('./src/index.js');
