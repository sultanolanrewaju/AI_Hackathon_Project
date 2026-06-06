const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const axios = require('axios');
require('dotenv').config();

const app = express();

// CRITICAL FIX: This stops the browser from blocking your local file from talking to the backend
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Spin up WebSocket server explicitly tied to Port 8080
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ STARTUP ERROR: GOOGLE_MAPS_API_KEY is missing from your .env file!");
} else {
    console.log("✅ Google Maps API Key successfully detected in server environment.");
}

wss.on('connection', (ws) => {
    console.log('🔌 SUCCESS: Frontend Dashboard has established a handshake connection!');

    ws.on('message', async (message) => {
        try {
            console.log("📥 Telemetry Packet Ingested:", message.toString());
            const data = JSON.parse(message);
            
            if (data.type === 'GPS_UPDATE') {
                let optimizedRoute = null;
                
                if (data.destination) {
                    console.log(`🗺️ Forwarding route request to Google Directions Engine for: ${data.destination}`);
                    optimizedRoute = await getGoogleTrafficRoute(data.lat, data.lng, data.destination);
                }

                const responsePayload = JSON.stringify({
                    type: 'DASHBOARD_UPDATE',
                    vehicleId: data.vehicleId,
                    lat: data.lat,
                    lng: data.lng,
                    route: optimizedRoute
                });

                // Broadcast out to all connected browser displays
                wss.clients.forEach((client) => {
                    if (client.readyState === 1) {
                        client.send(responsePayload);
                    }
                });
            }
        } catch (err) {
            console.error("❌ Error parsing client packet:", err.message);
        }
    });
});

async function getGoogleTrafficRoute(originLat, originLng, destination) {
    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${encodeURIComponent(destination)}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);
        
        console.log(`📡 Google Directions Status API Response: ${response.data.status}`);
        return response.data; 
    } catch (error) {
        console.error("❌ Axio Google API Connection Fault:", error.message);
        return null;
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Real-time Emergency Node Core Active on http://127.0.0.1:${PORT}`);
});