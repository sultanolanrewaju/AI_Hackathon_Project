const http = require('http');
const WebSocket = require('ws');

// --- MASTER DUAL-USER CREDENTIALS ---
const ADMIN_EMAIL = "admin@controlelite.com";
const ADMIN_PASSWORD = "SecretPassword123";

const DRIVER_EMAIL = "driver@controlelite.com";
const DRIVER_PASSWORD = "DriverPassword123";

console.log(`📡 Dual-User Security Engine Active.`);
console.log(`🔑 Admin Login ID: ${ADMIN_EMAIL}`);
console.log(`🔑 Driver Login ID: ${DRIVER_EMAIL}`);

// 1. HTTP SERVER & API ENDPOINT ROUTER
const server = http.createServer(async (req, res) => {
  // CORS Security Handshake Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- SIGNUP ENDPOINT (DISABLED FOR HARDCODED MODE) ---
  if (req.method === 'POST' && req.url === '/api/signup') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Signup is disabled in single-user mode." }));
    return;
  }

  // --- MULTI-USER LOGIN ENDPOINT ---
  if (req.method === 'POST' && req.url === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);

        // Check if Admin
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          console.log(`🔒 ACCESS GRANTED: Dispatcher -> ${email}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, role: 'admin' }));
        } 
        // Check if Driver
        else if (email === DRIVER_EMAIL && password === DRIVER_PASSWORD) {
          console.log(`🔒 ACCESS GRANTED: Field Driver -> ${email}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, role: 'driver' }));
        } 
        // Rejection Fallback
        else {
          console.warn(`⚠️ ACCESS DENIED: Invalid credentials for -> ${email}`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Identity credentials validation rejected." }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal memory verification error." }));
      }
    });
  } 
  
  else {
    res.writeHead(404);
    res.end();
  }
});

// 2. REAL-TIME WEBSOCKET STREAMING ENGINE
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 SUBSYSTEM LINK ACTIVE: Live tracking WebSocket stream connected.');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'EMERGENCY_BROADCAST') {
        console.log(`🚨 SIGNAL CAPTURED: Routing payload deployment to -> ${data.destination}`);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'EMERGENCY_ALERT',
              destination: data.destination,
              originLat: data.originLat,
              originLng: data.originLng
            }));
          }
        });
      }

      if (data.type === 'GPS_UPDATE') {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'DASHBOARD_UPDATE', lat: data.lat, lng: data.lng }));
          }
        });
      }
    } catch (err) {
      console.error('❌ Data pipeline processing failure: ', err.message);
    }
  });
});

// 3. START SERVER
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CONTROL ELITE RUNNING ON PORT: ${PORT}`);
});