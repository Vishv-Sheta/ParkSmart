# ParkSmart: Distributed Smart Parking & Reservation System
## System Architecture & Technical Defense Document (B.Tech Computer Science & Engineering)

---

### 1. Executive Summary
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

### 3. Service Breakdown & Polyglot Rationale

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

### 5. Algorithms & Mathematical Formulations

#### 1. Optimal Slot Allocation Algorithm (Service 3 - C++)
$$\text{Cost}(i) = \sqrt{(x_i - x_{\text{gate}})^2 + (y_i - y_{\text{gate}})^2} + \alpha \cdot \text{BayTypePenalty}$$
* Time Complexity: $\mathcal{O}(N)$ where $N$ is total bays, completed in $<50\mu\text{s}$ in native C++.

#### 2. Price Elasticity Dynamic Pricing Formula (Service 5 - Python)
$$P(t) = P_{\text{base}} \times \left(1 + 0.60 \times \frac{\text{Occupancy}(t)}{\text{Capacity}}\right) \times \gamma_{\text{hour}}$$
* $\gamma_{\text{hour}} = 1.25$ during peak rush hours (8-10 AM, 5-8 PM); $1.00$ otherwise.

---

### 6. Defense & Viva Guide (For College Examiners)

**Q1: Why did you choose polyglot microservices instead of doing everything in one language?**
* **Answer**: In real-world enterprise architectures, a single language is never optimal for every task. Node.js is superior for high-throughput, non-blocking asynchronous REST I/O. Python is the world standard for computer vision (OpenCV) and numerical analytics. C++ is essential for low-latency systems programming, edge hardware sensor simulation, and deterministic memory allocation.

**Q2: What happens if RabbitMQ goes down?**
* **Answer**: The microservices implement graceful degradation: each service has an in-memory event fallback buffer, allowing core booking and authentication to remain available while queued sync actions retry automatically.

**Q3: How is data consistency maintained without distributed ACID transactions?**
* **Answer**: We follow the **Eventual Consistency** paradigm. The Reservation Service acts as the transaction coordinator, emitting domain events over RabbitMQ. If a cancellation occurs, compensating events (`reservation.cancelled`) revert the state across the C++ slot engine and AI whitelist.
