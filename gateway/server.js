const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Upstream service URLs (configured for local dev or docker-compose)
const SERVICE_1_AUTH = process.env.SERVICE_AUTH_URL || 'http://127.0.0.1:5001';
const SERVICE_2_AI = process.env.SERVICE_AI_URL || 'http://127.0.0.1:5002';
const SERVICE_3_SLOT = process.env.SERVICE_SLOT_URL || 'http://127.0.0.1:5003';
const SERVICE_4_RESERVATION = process.env.SERVICE_RESERVATION_URL || 'http://127.0.0.1:5004';
const SERVICE_5_ANALYTICS = process.env.SERVICE_ANALYTICS_URL || 'http://127.0.0.1:5005';

app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url} -> Routing...`);
  next();
});

// Aggregated Distributed Health Check
app.get(['/api/health', '/health'], async (req, res) => {
  const services = [
    { name: 'Service 1: Auth & User Mgmt', language: 'Node.js', url: `${SERVICE_1_AUTH}/health`, db: 'parksmart_auth_db (MongoDB)' },
    { name: 'Service 2: AI ANPR & License OCR', language: 'Python', url: `${SERVICE_2_AI}/health`, db: 'parksmart_ai_db (MongoDB)' },
    { name: 'Service 3: Slot Engine & Sensors', language: 'C++17', url: `${SERVICE_3_SLOT}/health`, db: 'parksmart_slots_db (In-Memory/C++)' },
    { name: 'Service 4: Reservation & Bookings', language: 'Node.js', url: `${SERVICE_4_RESERVATION}/health`, db: 'parksmart_booking_db (MongoDB)' },
    { name: 'Service 5: Dynamic Pricing & Analytics', language: 'Python', url: `${SERVICE_5_ANALYTICS}/health`, db: 'parksmart_analytics_db (MongoDB)' },
  ];

  const results = await Promise.all(
    services.map(async (s) => {
      try {
        const resp = await axios.get(s.url, { timeout: 1500 });
        return { ...s, status: 'ONLINE', details: resp.data };
      } catch (err) {
        return { ...s, status: 'OFFLINE_OR_STANDBY', error: err.message };
      }
    })
  );

  res.json({
    gateway: 'ParkSmart Distributed API Gateway',
    timestamp: new Date().toISOString(),
    architecture: 'Polyglot Microservices (Node.js, Python, C++)',
    databasePattern: 'Database-Per-Service (MongoDB)',
    messageBroker: 'RabbitMQ (Event Bus)',
    services: results,
  });
});

// --- Reverse Proxy Route Mapping ---

// Route 1: Auth Service (Node.js - Port 5001)
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: SERVICE_1_AUTH,
    changeOrigin: true,
  })
);

// Route 2: AI & License Plate Vision Service (Python - Port 5002)
app.use(
  ['/api/ai', '/api/ocr'],
  createProxyMiddleware({
    target: SERVICE_2_AI,
    changeOrigin: true,
  })
);

// Route 3A: Slot Availability with Real-Time Reservation State (Service 4 - Port 5004)
app.use(
  ['/api/parking/slots', '/api/slots'],
  createProxyMiddleware({
    target: SERVICE_4_RESERVATION,
    changeOrigin: true,
  })
);

// Route 3B: High-Performance C++ Allocation & Telemetry Engine (C++ - Port 5003)
app.use(
  ['/api/parking', '/api/engine'],
  createProxyMiddleware({
    target: SERVICE_3_SLOT,
    changeOrigin: true,
  })
);

// Route 4: Reservation & Location Lifecycle Service (Node.js - Port 5004)
app.use(
  ['/api/reservations', '/api/locations'],
  createProxyMiddleware({
    target: SERVICE_4_RESERVATION,
    changeOrigin: true,
  })
);

// Route 5: Dynamic Pricing & Analytics Service (Python - Port 5005)
app.use(
  ['/api/analytics', '/api/pricing'],
  createProxyMiddleware({
    target: SERVICE_5_ANALYTICS,
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  PARKSMART DISTRIBUTED API GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(`=================================================================`);
  console.log(`  [Route 1] /api/auth          -> Service 1 (Node.js) @ ${SERVICE_1_AUTH}`);
  console.log(`  [Route 2] /api/ai            -> Service 2 (Python)  @ ${SERVICE_2_AI}`);
  console.log(`  [Route 3] /api/parking       -> Service 3 (C++)     @ ${SERVICE_3_SLOT}`);
  console.log(`  [Route 4] /api/reservations  -> Service 4 (Node.js) @ ${SERVICE_4_RESERVATION}`);
  console.log(`  [Route 5] /api/analytics     -> Service 5 (Python)  @ ${SERVICE_5_ANALYTICS}`);
  console.log(`  [Health]  /api/health        -> Aggregated Status Dashboard`);
  console.log(`=================================================================`);
});
