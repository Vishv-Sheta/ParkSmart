# ParkSmart: Distributed Smart Parking & Reservation System
## System Architecture Document

---

### 1. Summary
**ParkSmart** is an event-driven, polyglot distributed microservices architecture designed to solve real-world urban parking congestion. The platform replaces traditional monolithic designs with five decentralized services written across **Node.js, Python, and C++**, adhering to the **Database-per-Service** pattern, communicating asynchronously via **RabbitMQ**, containerized with **Docker**, and exposed via a unified **API Gateway**.

---

### 2. Architecture Overview & Topology

```
                              [ Client Layer: React 18 SPA (Port 3000) ]
                                                   |
                                                   v
                              [ Edge / Ingress Layer: API Gateway (Port 5000) ]
                                                   |
        +-----------------------+------------------+------------------+-----------------------+
        |                       |                                     |                       |
        v                       v                                     v                       v
+---------------+       +---------------+                     +---------------+       +---------------+
|   Service 1   |       |   Service 3   |                     |   Service 4   |       |   Service 5   |
|   (Node.js)   |       |    (C++17)    |                     |   (Node.js)   |       |   (Python)    |
|  Auth & User  |       | Slot Engine & |                     | Reservation & |       |   Analytics   |
|     Mgmt      |       |  Telemetry    |                     |   Bookings    |       |   & Pricing   |
+-------+-------+       +-------+-------+                     +-------+-------+       +-------+-------+
        |                       |                                     |                       |
        v                       |                                     v                       v
[parksmart_auth_db]             |                            [parksmart_booking_db]  [parksmart_analytics_db]
                                |                                     |
                                +------------------+------------------+
                                                   |
                                                   v
                                   [ Message Broker: RabbitMQ (AMQP 5672) ]
                                         (Topic: parksmart_events)
                                                   |
                                                   +-------------------------+
                                                   |                         |
                                                   v                         v
                                        +---------------------+   +---------------------+
                                        |      Service 2      |   |      Service 5      |
                                        |      (Python)       |   |      (Python)       |
                                        |    AI Vision &      |   |   Dynamic Pricing   |
                                        |     ANPR Gate       |   |   Demand Consumer   |
                                        +----------+----------+   +---------------------+
                                                   |
                                                   v
                                          [parksmart_ai_db]
```

---

### 3. Service Breakdown

| Service | Technology Stack | Port | Database (Isolated) | Engineering & Academic Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Service 1: Auth & User Management** | Node.js, Express, JWT, Bcrypt | `5001` | MongoDB: `parksmart_auth_db` | Handles high-frequency authentication tokens, login, and registration. Event loop non-blocking I/O allows thousands of concurrent token verifications with minimal memory overhead. |
| **Service 2: AI ANPR & License OCR** | Python 3, OpenCV, EasyOCR, NumPy, Flask | `5002` | MongoDB: `parksmart_ai_db` | Automated Number Plate Recognition at parking lot gate cameras. Python provides the industry-standard Computer Vision ecosystem (Canny edge detection, contour localization, and image thresholding). |
| **Service 3: Slot Engine & Sensor Telemetry** | C++17 Native Binary, Winsock / POSIX Sockets | `5003` | In-Memory Spatial Grid Matrix | Emulates IoT ultrasonic bay sensors ($< 50\text{cm}$ detection threshold) and executes nearest-bay Euclidean shortest-path optimization in $<0.05\text{ms}$. C++ provides deterministic execution without garbage collection pauses. |
| **Service 4: Reservation Lifecycle** | Node.js, Express, Mongoose, AMQP | `5004` | MongoDB: `parksmart_booking_db` | Manages the reservation lifecycle (creation, QR ticketing, check-in, check-out, and cancellation). Publishes lifecycle events to RabbitMQ. |
| **Service 5: Dynamic Pricing & Demand Analytics** | Python 3, Pandas, NumPy, Flask | `5005` | MongoDB: `parksmart_analytics_db` | Computes dynamic surge pricing based on real-time occupancy ratios and time-of-day multipliers. Generates 24-hour predictive utilization profiles. |

---

### 4. Key Distributed System Patterns Implemented

#### A. Database-per-Service Pattern
- **Problem**: Monolithic databases suffer from tight coupling, schema lock contention, and shared point-of-failure vulnerabilities.
- **Solution**: Each service owns its dedicated MongoDB database (`parksmart_auth_db`, `parksmart_ai_db`, `parksmart_booking_db`, `parksmart_analytics_db`). Services interact strictly via defined REST contracts or asynchronous events, never by cross-querying databases.

#### B. Asynchronous Event-Driven Messaging (RabbitMQ)
- **Exchange**: `parksmart_events` (Type: `topic`).
- **Flow Example**:
  1. User confirms a booking $\rightarrow$ **Service 4 (Node.js)** writes to `parksmart_booking_db` and publishes `reservation.created`.
  2. **Service 3 (C++)** receives event $\rightarrow$ marks bay coordinate as reserved and updates the spatial sensor state.
  3. **Service 2 (Python AI)** receives event $\rightarrow$ whitelists license plate for automated gate camera access.
  4. **Service 5 (Python Analytics)** receives event $\rightarrow$ increments occupancy and updates the dynamic price curve.
- **Advantage**: Prevents cascading HTTP timeouts (SLA protection).

#### C. Reverse Proxy API Gateway
- Single public entrance at `http://localhost:5000`.
- Routes:
  - `/api/auth/*` $\rightarrow$ Service 1
  - `/api/ai/*` $\rightarrow$ Service 2
  - `/api/parking/*` $\rightarrow$ Service 3
  - `/api/reservations/*` $\rightarrow$ Service 4
  - `/api/analytics/*` $\rightarrow$ Service 5
  - `/api/health` $\rightarrow$ Distributed Health Aggregator

#### D. Containerization (Docker & Compose)
- All 5 polyglot services, RabbitMQ with management dashboard, MongoDB, API Gateway, and React frontend are encapsulated into isolated Docker containers with bridging network `parksmart-net`.

---