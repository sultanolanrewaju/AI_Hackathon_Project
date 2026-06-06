import React, { useState, useEffect, useRef } from 'react';

const GOOGLE_MAPS_KEY = "AIzaSyA-A6CBlEDCkUymDkyOHfRKyR_PwpRrDSg";
const WEBSOCKET_URL = "ws://127.0.0.1:8080"; 

export default function App() {
  const [role, setRole] = useState('login'); 
  const [logs, setLogs] = useState([]);
  const [incomingEmergency, setIncomingEmergency] = useState(null); 
  
  const [drivers, setDrivers] = useState([
    { id: "DRV-001", name: "Ambulance Crew Alpha", vehicle: "Econoline-V8", status: "Active", shift: "08:00 - 17:00" },
    { id: "DRV-002", name: "Paramedic Unit Bravo", vehicle: "Sprinter-4x4", status: "Standby", shift: "17:00 - 02:00" }
  ]);

  const [analyticsData, setAnalyticsData] = useState([
    { label: "Mon / Jan", count: 5 },
    { label: "Tue / Feb", count: 8 },
    { label: "Wed / Mar", count: 12 },
    { label: "Thu / Apr", count: 7 },
    { label: "Fri / May", count: 15 },
    { label: "Sat / Jun", count: 9 }
  ]);
  
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const trafficLayerRef = useRef(null);

  const logTerminal = (text) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  useEffect(() => {
    if (role === 'login') return;

    socketRef.current = new WebSocket(WEBSOCKET_URL);

    socketRef.current.onopen = () => {
      logTerminal(`✅ GLASS HANDSHAKE: Secure operational socket connection established.`);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'EMERGENCY_ALERT') {
        logTerminal(`🚨 INCOMING TRAFFIC DISPATCH: ${data.destination}`);
        if (role === 'driver') {
          setIncomingEmergency({
            destination: data.destination,
            originLat: data.originLat,
            originLng: data.originLng
          });
        }
      }

      if (data.type === 'DASHBOARD_UPDATE') {
        const trackingPosition = { lat: data.lat, lng: data.lng };
        if (markerRef.current) markerRef.current.setPosition(trackingPosition);
        if (mapRef.current && role === 'admin') mapRef.current.panTo(trackingPosition);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [role]);

  const loadGoogleMaps = (callbackInit) => {
    if (window.google) {
      callbackInit();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = callbackInit;
    document.head.appendChild(script);
  };

  if (role === 'login') {
    return <AuthGateway setRole={setRole} />;
  }

  return (
    <div className="glass-canvas-bg">
      <div className="main-wrapper">
        <header className="dashboard-header glass-card">
          <div>
            <h1 className="header-title">🚑 Control Elite Hub <span className="role-tag">{role} panel</span></h1>
            <p className="header-subtitle">Real-Time Emergency Navigation System Management Console</p>
          </div>
          <button onClick={() => setRole('login')} className="signout-btn">Exit Security Grid</button>
        </header>

        {role === 'admin' ? (
          <AdminDashboard 
            logs={logs} 
            logTerminal={logTerminal} 
            socketRef={socketRef} 
            loadGoogleMaps={loadGoogleMaps}
            mapRef={mapRef}
            markerRef={markerRef}
            directionsRendererRef={directionsRendererRef}
            directionsServiceRef={directionsServiceRef}
            trafficLayerRef={trafficLayerRef}
            drivers={drivers}
            setDrivers={setDrivers}
            analyticsData={analyticsData}
            setAnalyticsData={setAnalyticsData}
          />
        ) : (
          <DriverDashboard 
            incomingEmergency={incomingEmergency}
            setIncomingEmergency={setIncomingEmergency}
            loadGoogleMaps={loadGoogleMaps}
            mapRef={mapRef}
            markerRef={markerRef}
            directionsRendererRef={directionsRendererRef}
            directionsServiceRef={directionsServiceRef}
            trafficLayerRef={trafficLayerRef}
          />
        )}
      </div>
    </div>
  );
}

function AuthGateway({ setRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const baseHost = WEBSOCKET_URL.replace('ws', 'http');
    const endpoint = `${baseHost}/api/login`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Identity credentials validation rejected.');
        return;
      }
      setRole(data.role); 
    } catch (err) {
      setErrorMessage('Local server handshake failed. Ensure server.js is running.');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card glass-card">
        <div className="login-header">
          <h1 className="login-title">🚑 CONTROL ELITE</h1>
          <p className="login-subtitle">Master Security Authorization Gateway (Testing Mode)</p>
        </div>

        {errorMessage && <div className="auth-error-banner">{errorMessage}</div>}

        <form onSubmit={handleAuthSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Authorized Email Core ID</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@controlelite.com or driver@controlelite.com" 
              className="form-input" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Encrypted Terminal Token</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="form-input" 
            />
          </div>
          
          <button type="submit" className="submit-btn">
            Establish Fleet Uplink
          </button>
        </form>

        <div className="auth-toggle-footer" style={{color: '#475569', fontSize: '13px', fontWeights: '600', display:'flex', flexDirection:'column', gap:'4px'}}>
          <span>Admin: admin@controlelite.com / SecretPassword123</span>
          <span>Driver: driver@controlelite.com / DriverPassword123</span>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ 
  logs, logTerminal, socketRef, loadGoogleMaps, mapRef, markerRef, 
  directionsRendererRef, directionsServiceRef, trafficLayerRef, 
  drivers, setDrivers, analyticsData, setAnalyticsData 
}) {
  const [destination, setDestination] = useState('Ikeja, Lagos, Nigeria');
  const [trafficActive, setTrafficActive] = useState(false);
  const [stats, setStats] = useState({ activeUnits: 1, avgResponse: "11.4 min", networkLoad: "Optimal" });
  
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');
  const [newDriverShift, setNewDriverShift] = useState('08:00 - 17:00');
  
  const baseLagosPosition = { lat: 6.5244, lng: 3.3792 };

  useEffect(() => {
    loadGoogleMaps(() => {
      directionsServiceRef.current = new google.maps.DirectionsService();
      mapRef.current = new google.maps.Map(document.getElementById("adminMapCanvas"), {
        zoom: 12,
        center: baseLagosPosition,
        styles: [
          { featureType: "all", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#93c5fd" }] }
        ]
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer({ 
        map: mapRef.current,
        polylineOptions: { strokeColor: "#2563eb", strokeWeight: 7 }
      });

      trafficLayerRef.current = new google.maps.TrafficLayer();

      markerRef.current = new google.maps.Marker({
        position: baseLagosPosition,
        map: mapRef.current,
        title: "Active Ambulance Unit"
      });
    });
  }, []);

  const toggleTrafficLayer = () => {
    if (trafficActive) {
      trafficLayerRef.current.setMap(null);
    } else {
      trafficLayerRef.current.setMap(mapRef.current);
    }
    setTrafficActive(!trafficActive);
    logTerminal(`🚦 Congestion Grid Overlay: ${!trafficActive ? "ONLINE" : "OFFLINE"}`);
  };

  const executeEmergencyBroadcast = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      logTerminal("❌ SOCKET ERROR: Could not dispatch signal. Server downstream is disconnected.");
      return;
    }

    directionsServiceRef.current.route({
      origin: baseLagosPosition,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        logTerminal(`🎯 Routing Optimization Sequence Implemented: ${destination}`);
        
        setStats(prev => ({ ...prev, activeUnits: prev.activeUnits + 1, networkLoad: "ALERT BROADCASTING" }));

        setAnalyticsData(prev => {
          const updated = [...prev];
          updated[updated.length - 1].count += 1;
          return updated;
        });

        socketRef.current.send(JSON.stringify({
          type: 'EMERGENCY_BROADCAST',
          destination: destination,
          originLat: baseLagosPosition.lat,
          originLng: baseLagosPosition.lng
        }));
      } else {
        logTerminal(`❌ Google Mapping Framework Failure: ${status}`);
      }
    });
  };

  const handleCreateDriver = (e) => {
    e.preventDefault();
    if (!newDriverName || !newDriverVehicle) return;

    const newDriverObj = {
      id: `DRV-00${drivers.length + 1}`,
      name: newDriverName,
      vehicle: newDriverVehicle,
      status: "Standby",
      shift: newDriverShift
    };

    setDrivers([...drivers, newDriverObj]);
    logTerminal(`👥 RESOUCE RECORD INSERTED: Local memory map updated for ${newDriverName}.`);
    setNewDriverName('');
    setNewDriverVehicle('');
  };

  const maxIncidentCount = Math.max(...analyticsData.map(d => d.count), 1);

  return (
    <div className="grid-layout">
      <div className="control-sidebar">
        
        <div className="stats-container">
          <div className="stat-card glass-card">
            <span className="stat-label">Deployments</span>
            <span className="stat-value text-blue">{stats.activeUnits} Units</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-label">Response Lag</span>
            <span className="stat-value text-green">{stats.avgResponse}</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-label">Grid Mode</span>
            <span className="stat-value text-dark">{stats.networkLoad}</span>
          </div>
        </div>

        <div className="sidebar-group glass-card">
          <h2 className="section-title">📍 Fleet Dispatch Router</h2>
          <div className="form-group">
            <label className="form-label">Target Incident Geo-Location</label>
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="form-input" />
          </div>
          <button onClick={executeEmergencyBroadcast} className="action-btn">Launch Local Routing Broadcast</button>
          <button onClick={toggleTrafficLayer} className={`traffic-toggle-btn ${trafficActive ? 'active' : ''}`}>
            {trafficActive ? '⚠️ Remove Infrastructure Traffic Data' : '🚦 Overlay Traffic Grid Data'}
          </button>
        </div>

        <div className="sidebar-group glass-card">
          <h2 className="section-title">📊 Operations Metrics Log</h2>
          <div className="chart-bar-container">
            {analyticsData.map((data, idx) => (
              <div key={idx} className="chart-column-wrapper">
                <div className="chart-bar-tooltip">{data.count}</div>
                <div className="chart-bar-fill" style={{ height: `${(data.count / maxIncidentCount) * 100}%` }}></div>
                <span className="chart-axis-label">{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="terminal-section glass-card">
          <h3 className="section-title-small">📟 Base Command Activity Stream</h3>
          <div className="terminal-box">
            {logs.map((log, index) => <div key={index} className="terminal-line">{log}</div>)}
          </div>
        </div>
      </div>

      <div className="map-view-panel">
        <div id="adminMapCanvas" className="glass-card"></div>

        <div className="drivers-management-section glass-card">
          <div className="section-split-header">
            <h2 className="section-title">👥 Central Field Personnel Registry</h2>
            <p className="section-subtitle-dark">Monitor shifts, vehicles, and active response parameters across the city perimeter.</p>
          </div>

          <div className="management-grid-split">
            <form onSubmit={handleCreateDriver} className="add-driver-form glass-card">
              <h3 className="form-section-header">Onboard Field Responder Unit</h3>
              <div className="form-group">
                <label className="form-label">Crew / Responder Callsign</label>
                <input type="text" required value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="e.g. Trauma Team Delta" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Transponder Framework</label>
                <input type="text" required value={newDriverVehicle} onChange={(e) => setNewDriverVehicle(e.target.value)} placeholder="e.g. Heavy Medical Van F-450" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Operating Shift Group</label>
                <select value={newDriverShift} onChange={(e) => setNewDriverShift(e.target.value)} className="form-select">
                  <option value="08:00 - 17:00">Day Operations (08:00 - 17:00)</option>
                  <option value="17:00 - 02:00">Night Operations (17:00 - 02:00)</option>
                  <option value="02:00 - 08:00">Graveyard Emergency (02:00 - 08:00)</option>
                </select>
              </div>
              <button type="submit" className="add-driver-submit-btn">Inject Crew Node Entry</button>
            </form>

            <div className="table-responsive-wrapper">
              <table className="drivers-data-table">
                <thead>
                  <tr>
                    <th>Unit Code</th>
                    <th>Responder Unit Callsign</th>
                    <th>Vehicle Model Allocation</th>
                    <th>Scheduled Shift</th>
                    <th>Operational State</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((drv) => (
                    <tr key={drv.id}>
                      <td><strong>{drv.id}</strong></td>
                      <td>{drv.name}</td>
                      <td>{drv.vehicle}</td>
                      <td><span className="shift-time-badge">{drv.shift}</span></td>
                      <td><span className={`status-pill ${drv.status.toLowerCase()}`}>{drv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverDashboard({ incomingEmergency, setIncomingEmergency, loadGoogleMaps, mapRef, markerRef, directionsRendererRef, directionsServiceRef, trafficLayerRef }) {
  const driverCurrentPos = { lat: 6.5244, lng: 3.3792 };
  const [navigationMetrics, setNavigationMetrics] = useState(null);

  const [resumeTime, setResumeTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [shiftRegistered, setShiftRegistered] = useState(false);
  const [dutyStatus, setDutyStatus] = useState('OFF DUTY');

  useEffect(() => {
    loadGoogleMaps(() => {
      directionsServiceRef.current = new google.maps.DirectionsService();
      mapRef.current = new google.maps.Map(document.getElementById("driverMapCanvas"), {
        zoom: 14,
        center: driverCurrentPos,
        disableDefaultUI: true,
        styles: [
          { featureType: "all", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#93c5fd" }] }
        ]
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer({ 
        map: mapRef.current,
        polylineOptions: { strokeColor: "#2563eb", strokeWeight: 8 }
      });

      const driverTraffic = new google.maps.TrafficLayer();
      driverTraffic.setMap(mapRef.current);

      markerRef.current = new google.maps.Marker({
        position: driverCurrentPos,
        map: mapRef.current,
        title: "Active Field Unit Location"
      });
    });
  }, []);

  const handleShowEmergencyRoute = () => {
    if (!incomingEmergency) return;

    directionsServiceRef.current.route({
      origin: { lat: incomingEmergency.originLat, lng: incomingEmergency.originLng },
      destination: incomingEmergency.destination,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        
        const leg = result.routes[0].legs[0];
        setNavigationMetrics({
          distance: leg.distance.text,
          duration: leg.duration.text,
          nextInstruction: leg.steps[0].instructions.replace(/<\/?[^>]+(>|$)/g, "")
        });

        setIncomingEmergency(null); 
      } else {
        alert("Route processing failed: " + status);
      }
    });
  };

  const handleRejectRoute = () => {
    setIncomingEmergency(null);
    setNavigationMetrics(null);
  };

  const handleRegisterShift = (e) => {
    e.preventDefault();
    setShiftRegistered(true);
    setDutyStatus('ACTIVE ON DUTY');
  };

  const handleEndShift = () => {
    setShiftRegistered(false);
    setDutyStatus('SHIFT CLOSED');
    handleRejectRoute();
  };

  return (
    <div className="driver-mobile-view">
      
      <div className="driver-shift-manager glass-card">
        <div className="shift-manager-header">
          <h2 className="section-title">⏱️ Responder Shift Manager</h2>
          <span className={`duty-badge ${dutyStatus.replace(/\s+/g, '-').toLowerCase()}`}>{dutyStatus}</span>
        </div>

        {!shiftRegistered ? (
          <form onSubmit={handleRegisterShift} className="shift-time-inputs">
            <div className="time-field-box">
              <label className="form-label">Resumption Time</label>
              <input type="time" value={resumeTime} onChange={(e) => setResumeTime(e.target.value)} className="form-input time-picker" />
            </div>
            <div className="time-field-box">
              <label className="form-label">Closing Time</label>
              <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="form-input time-picker" />
            </div>
            <button type="submit" className="shift-submit-btn">Clock-In to Grid</button>
          </form>
        ) : (
          <div className="shift-active-hud">
            <p className="shift-hud-text">Logged Operational Block: <strong>{resumeTime}</strong> hrs to <strong>{closeTime}</strong> hrs</p>
            <button type="button" onClick={handleEndShift} className="shift-logout-btn">Clock-Out (End Shift)</button>
          </div>
        )}
      </div>

      {navigationMetrics && (
        <div className="navigation-hud-card glass-card">
          <div className="hud-metric-row">
            <div>
              <span className="hud-label">REMAINING DISTANCE</span>
              <span className="hud-value">{navigationMetrics.distance}</span>
            </div>
            <div className="text-right">
              <span className="hud-label">ESTIMATED ETA</span>
              <span className="hud-value-highlight">{navigationMetrics.duration}</span>
            </div>
          </div>
          <div className="hud-instruction-box">
            <span className="instruction-tag">NEXT ROUTE INSTRUCTION</span>
            <p className="instruction-text">{navigationMetrics.nextInstruction}</p>
          </div>
          <button onClick={handleRejectRoute} className="abort-mission-btn">Cancel Deployment Track</button>
        </div>
      )}

      {incomingEmergency && dutyStatus === 'ACTIVE ON DUTY' && (
        <div className="emergency-fullscreen-overlay">
          <div className="flash-alert-box glass-card">
            <h1 className="flash-hazard-title">🚨 CRITICAL DESK ALERT SIGNAL</h1>
            <p className="flash-hazard-subtitle">Automated Real-Time Traffic Routing Sequence Ready.</p>
            <div className="target-dispatch-card">
              <span>TARGET DISPATCH ZONE:</span>
              <strong>{incomingEmergency.destination}</strong>
            </div>
            <div className="driver-choice-actions">
              <button onClick={handleShowEmergencyRoute} className="flash-accept-btn">
                ACCEPT RESPONSE
              </button>
              <button onClick={handleRejectRoute} className="flash-reject-btn">
                DECLINE ALERT
              </button>
            </div>
          </div>
        </div>
      )}

      {!incomingEmergency && !navigationMetrics && (
        <div className="notification-banner standby-banner glass-card">
          <h2 className="banner-title">Current Navigation Matrix</h2>
          <p className="banner-text">
            {dutyStatus === 'ACTIVE ON DUTY' ? '🛰️ Standby: Scanning Grid for Emergency Targets...' : '❌ Station Offline: Clock-In to access emergency tasks.'}
          </p>
        </div>
      )}

      <div className="mobile-map-panel glass-card">
        <div id="driverMapCanvas"></div>
      </div>
    </div>
  );
}