let map;
let ambulanceMarker;
let directionsRenderer;
let socket;

// Initialize Google Map
function initMap() {
    // Default center point (e.g., Lagos, Nigeria coordinates)
    const defaultCenter = { lat: 6.5244, lng: 3.3792 }; 
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: defaultCenter,
        styles: [ { featureType: "all", elementType: "all", stylers: [{ invert_lightness: true }] } ] // Optional Dark Mode
    });

    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });
    
    // Setup Ambulance icon
    ambulanceMarker = new google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: "Ambulance A1",
        icon: "https://maps.google.com/mapfiles/kml/pal4/icon54.png" // Simple ambulance-like icon placeholder
    });
}

// Connect to Node.js backend via WebSockets
function connectWebSocket() {
    socket = new WebSocket("ws://localhost:5000");

    socket.onopen = () => {
        logMessage("Connected to Emergency Server Pipeline.");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'DASHBOARD_UPDATE') {
            const newPos = { lat: data.lat, lng: data.lng };
            
            // Move marker to updated location
            ambulanceMarker.setPosition(newPos);
            map.setCenter(newPos);
            logMessage(`Vehicle moved to: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);

            // If the server calculated a traffic-optimized route, render it
            if (data.route && data.route.status === "OK") {
                directionsRenderer.setDirections(data.route);
            }
        }
    };

    socket.onclose = () => {
        logMessage("Disconnected from server. Retrying...");
        setTimeout(connectWebSocket, 3000);
    };
}

// Helper tool to write text logs to the sidebar UI
function logMessage(text) {
    const logsDiv = document.getElementById("logs");
    logsDiv.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${text}</div>`;
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

// Simulate an Ambulance moving down a road grid [cite: 40, 55]
document.getElementById("startSimBtn").addEventListener("click", () => {
    // Simulated path increments starting from downtown Lagos center
    let currentLat = 6.5244;
    let currentLng = 3.3792;
    const targetDestination = "Ikeja, Lagos"; // Destination text

    logMessage("Starting emergency run simulation...");

    const interval = setInterval(() => {
        currentLat += 0.002; // simulate traveling north
        currentLng += 0.001; // simulate traveling east

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'GPS_UPDATE',
                vehicleId: 'AMB_01',
                lat: currentLat,
                lng: currentLng,
                destination: targetDestination
            }));
        }
    }, 3000); // Send coordinates every 3 seconds [cite: 47]

    // Stop simulator after 10 loops for testing safety
    setTimeout(() => { clearInterval(interval); logMessage("Simulation complete."); }, 30000);
});

// Run map loader
window.onload = () => {
    initMap();
    connectWebSocket();
};