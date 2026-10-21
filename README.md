# ParkSmart - Distributed Smart Parking & Reservation System

An enterprise-grade, event-driven polyglot microservices system for intelligent parking reservation, IoT bay sensing, license plate AI computer vision, and dynamic demand pricing.

---

## Architecture and Technology Stack

ParkSmart is engineered using a **Polyglot Distributed Microservices Architecture** adhering strictly to the **Database-per-Service** design pattern:

| Component | Service Name | Language / Runtime | Database | Port | Core Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Service 1** | **Auth & User Management** | **Node.js** (Express) | `parksmart_auth_db` (MongoDB) | `5001` | User registration, login, JWT issuance, BCrypt hashing, role-based access. |
| **Service 2** | **AI ANPR Vision** | **Python** (Flask + OpenCV) | `parksmart_ai_db` (MongoDB) | `5002` | Automated Number Plate Recognition (ANPR), barrier gate whitelist. |
| **Service 3** | **Slot Engine & Telemetry** | **C++17** (Native Binary) | `parksmart_slots_db` (In-Memory Grid) | `5003` | Real-time ultrasonic sensor stream ingestion, Euclidean nearest-bay allocation algorithm (<0.05ms). |
| **Service 4** | **Reservation Lifecycle** | **Node.js** (Express) | `parksmart_booking_db` (MongoDB) | `5004` | 26 Ahmedabad parking locations, booking creation, race-condition defense, PDF ticketing, RabbitMQ event emitter. |
| **Service 5** | **Pricing & Analytics** | **Python** (Flask + NumPy) | `parksmart_analytics_db` (MongoDB) | `5005` | Dynamic surge pricing algorithm based on demand elasticity & peak-hour multipliers. |
| **Gateway** | **API Gateway** | **Node.js** (Reverse Proxy) | None | `5000` | Single entry point, CORS handling, traffic routing, aggregated `/api/health`. |
| **Broker** | **RabbitMQ** | **Erlang** (AMQP) | In-Memory / Disk Queues | `5672` / `15672` | Asynchronous decoupled publish/subscribe event bus. |
| **Viewer** | **Mongo Express** | **Node.js** (Web GUI) | Connected to MongoDB | `8081` | Web-based visual viewer for all isolated MongoDB collections. |
| **Frontend** | **ParkSmart Web Client** | **React 18** (SPA) | LocalStorage (JWT) | `3000` | Dark-themed dashboard, 4-step wizard, interactive slot matrix, light-mode PDF tickets. |

---

## Quick Start Guide

### Option A: Run via Docker Compose (Recommended)

Ensure Docker Desktop is running, then execute from the project root:

```bash
# Build and launch all 10 containers in detached mode
docker compose up --build -d
```

To monitor container logs:
```bash
docker compose logs -f
```

To stop all containers:
```bash
docker compose down
```

#### Live Access URLs:
* **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
* **API Gateway Aggregated Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Database Visual Viewer (Mongo Express)**: [http://localhost:8081](http://localhost:8081)
* **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) (Username: `guest` / Password: `guest`)

#### Default Test Credentials:
* **Email**: `tester@gmail.com`
* **Password**: `tester123`
* **Vehicle Plate**: `GJ-01-AB-1234`

---

### Option B: Run Natively on Host (Manual / Development Mode)

If running without Docker, follow these steps to install and start the services locally:

#### 1. Start Infrastructure (MongoDB & RabbitMQ)
```bash
# Start MongoDB on port 27017 and RabbitMQ on ports 5672 & 15672
docker run -d --name parksmart-mongodb -p 27017:27017 mongo:6.0
docker run -d --name parksmart-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

#### 2. Compile Service 3 (C++ Slot Engine)
Navigate to `services/service-3-slot-engine`:
```bash
# On Windows (MinGW / GCC):
g++ -O2 -std=c++17 main.cpp -o slot_engine.exe -lws2_32
./slot_engine.exe 5003

# On Linux / macOS:
g++ -O2 -std=c++17 main.cpp -pthread -o slot_engine
./slot_engine 5003
```

#### 3. Install and Launch Node.js Services

**Service 1: Authentication & User Management (Port 5001)**
```bash
cd services/service-1-auth
npm install
npm start
```

**Service 4: Reservation & Booking Engine (Port 5004)**
```bash
cd services/service-4-reservation
npm install
npm start
```

**API Gateway: Reverse Proxy (Port 5000)**
```bash
cd gateway
npm install
npm start
```

**Frontend: React Application (Port 3000)**
```bash
cd frontend
npm install
npm start
```

#### 4. Install and Launch Python Services

**Service 2: AI ANPR & License OCR (Port 5002)**
```bash
cd services/service-2-ai-vision
pip install -r requirements.txt
python app.py
```

**Service 5: Dynamic Pricing & Predictive Analytics (Port 5005)**
```bash
cd services/service-5-pricing-analytics
pip install -r requirements.txt
python app.py
```

---

## API Gateway Route Mapping

All client requests from the React frontend target `http://localhost:5000/api`:

* `/api/auth/*` -> Reverse-proxied to **Service 1 (Node.js - Port 5001)**
* `/api/ai/*` -> Reverse-proxied to **Service 2 (Python - Port 5002)**
* `/api/parking/allocate` -> Reverse-proxied to **Service 3 (C++ - Port 5003)**
* `/api/parking/slots/*` -> Reverse-proxied to **Service 4 (Node.js - Port 5004)**
* `/api/locations/*` -> Reverse-proxied to **Service 4 (Node.js - Port 5004)**
* `/api/reservations/*` -> Reverse-proxied to **Service 4 (Node.js - Port 5004)**
* `/api/analytics/*` -> Reverse-proxied to **Service 5 (Python - Port 5005)**
* `/api/health` -> **Aggregated Topology & Microservices Status**

---

## RabbitMQ Event-Driven Flow

When a user completes a parking slot reservation:
1. **Service 4 (Reservation)** commits the booking to `parksmart_booking_db` and publishes `reservation.created` to topic exchange `parksmart_events`.
2. **Service 2 (Python AI)** consumes from `ai_plate_whitelist_queue` and adds the license plate to the barrier gate whitelist for O(1) touchless entry.
3. **Service 5 (Python Analytics)** consumes from `analytics_booking_queue` to update real-time facility revenue, occupancy rate, and the dynamic surge pricing curve.

---

## Concurrency & Race Condition Defense

To prevent duplicate bookings when multiple drivers attempt to claim the same parking slot at the same second:
1. **Pre-Booking Slot Overlay**: `GET /api/parking/slots/:locationId` overlays active reservations onto the C++ slot grid. Booked slots receive `status: 'reserved'` and are rendered unclickable (`cursor: not-allowed`).
2. **Atomic Conflict Detection**: `POST /api/reservations` validates time-window overlap against active bookings in MongoDB before committing. Conflicting requests are immediately rejected with HTTP `409 Conflict`.