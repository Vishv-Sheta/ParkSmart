/**
 * ParkSmart - Service 3: High-Performance Slot Allocation & Sensor Telemetry Engine
 * Language: C++17
 * Author: ParkSmart Distributed Architecture
 */

#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <cmath>
#include <chrono>
#include <thread>
#include <mutex>
#include <algorithm>
#include <cstring>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef int socklen_t;
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <unistd.h>
    #define closesocket close
    typedef int SOCKET;
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
#endif

// Structure for a parking slot in memory
struct ParkingBay {
    int id;
    std::string slotNumber;
    std::string locationId;
    std::string type; // 'standard', 'ev', 'handicapped'
    double xCoord;    // Meters from entrance
    double yCoord;    // Meters from entrance
    bool isOccupied;
    bool isReserved;
    double ultrasonicDistanceCm; // Sensor reading
};

// Global in-memory thread-safe state
std::vector<ParkingBay> g_bays;
std::mutex g_bayesMutex;
long long g_allocationsCount = 0;

void initializeBays() {
    std::lock_guard<std::mutex> lock(g_bayesMutex);
    g_bays.clear();

    const char* types[] = {"standard", "standard", "ev", "standard", "handicapped"};
    
    // Initialize 24 slots across 4 rows
    for (int i = 1; i <= 24; ++i) {
        ParkingBay bay;
        bay.id = i;
        char buf[16];
        snprintf(buf, sizeof(buf), "A-%02d", i);
        bay.slotNumber = buf;
        bay.locationId = "loc_downtown_01";
        bay.type = types[i % 5];
        
        // Spatial coordinates (4 rows, 6 bays per row)
        int row = (i - 1) / 6;
        int col = (i - 1) % 6;
        bay.xCoord = (col + 1) * 3.5; // 3.5m bay width
        bay.yCoord = (row + 1) * 6.0; // 6.0m aisle distance
        
        // Initial state: some random occupancy
        bay.isReserved = (i == 4 || i == 11);
        bay.isOccupied = (i % 3 == 0);
        bay.ultrasonicDistanceCm = bay.isOccupied ? 28.5 : 240.0;
        
        g_bays.push_back(bay);
    }
    std::cout << "[Service 3 - C++ Engine] Initialized " << g_bays.size() << " parking bays in spatial grid." << std::endl;
}

// Ultra-fast Euclidean nearest-bay allocation algorithm
ParkingBay* allocateOptimalSlot(const std::string& preferredType) {
    std::lock_guard<std::mutex> lock(g_bayesMutex);
    ParkingBay* bestBay = nullptr;
    double minDistance = 1e9;

    // Gate entry is at (0, 0)
    for (auto& bay : g_bays) {
        if (!bay.isOccupied && !bay.isReserved) {
            if (!preferredType.empty() && preferredType != "any" && bay.type != preferredType) {
                continue;
            }
            // Euclidean distance to entrance
            double dist = std::sqrt(bay.xCoord * bay.xCoord + bay.yCoord * bay.yCoord);
            if (dist < minDistance) {
                minDistance = dist;
                bestBay = &bay;
            }
        }
    }

    if (bestBay) {
        bestBay->isReserved = true;
        g_allocationsCount++;
    }
    return bestBay;
}

// JSON Serialization Helpers
std::string baysToJson(const std::string& filterLocation = "") {
    std::lock_guard<std::mutex> lock(g_bayesMutex);
    std::stringstream ss;
    ss << "[";
    bool first = true;
    for (const auto& bay : g_bays) {
        if (!first) ss << ",";
        first = false;
        ss << "{"
           << "\"_id\":\"cpp_slot_" << bay.id << "\","
           << "\"id\":" << bay.id << ","
           << "\"slotNumber\":\"" << bay.slotNumber << "\","
           << "\"locationId\":\"" << bay.locationId << "\","
           << "\"type\":\"" << bay.type << "\","
           << "\"pricePerHour\":50,"
           << "\"coordinates\":{\"x\":" << bay.xCoord << ",\"y\":" << bay.yCoord << "},"
           << "\"status\":\"" << (bay.isReserved ? "reserved" : (bay.isOccupied ? "occupied" : "available")) << "\","
           << "\"isOccupied\":" << (bay.isOccupied ? "true" : "false") << ","
           << "\"isReserved\":" << (bay.isReserved ? "true" : "false") << ","
           << "\"sensor\":{\"distanceCm\":" << bay.ultrasonicDistanceCm << ",\"health\":\"NORMAL\"}"
           << "}";
    }
    ss << "]";
    return ss.str();
}

std::string healthToJson(int port) {
    std::lock_guard<std::mutex> lock(g_bayesMutex);
    int available = 0;
    for (const auto& b : g_bays) {
        if (!b.isOccupied && !b.isReserved) available++;
    }
    std::stringstream ss;
    ss << "{"
       << "\"service\":\"Service 3: C++ Slot Allocation & Sensor Engine\","
       << "\"status\":\"UP\","
       << "\"language\":\"C++17 (Native Binary)\","
       << "\"port\":" << port << ","
       << "\"totalBays\":" << g_bays.size() << ","
       << "\"availableBays\":" << available << ","
       << "\"totalAllocationsProcessed\":" << g_allocationsCount << ","
       << "\"algorithm\":\"Euclidean Nearest-Bay Distance Matrix (O(N) in <0.05ms)\""
       << "}";
    return ss.str();
}

void handleClient(SOCKET clientSocket, int port) {
    char buffer[4096] = {0};
    int bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesRead <= 0) {
        closesocket(clientSocket);
        return;
    }

    std::string req(buffer);
    std::string method = "GET";
    std::string path = "/";

    size_t firstSpace = req.find(' ');
    if (firstSpace != std::string::npos) {
        method = req.substr(0, firstSpace);
        size_t secondSpace = req.find(' ', firstSpace + 1);
        if (secondSpace != std::string::npos) {
            path = req.substr(firstSpace + 1, secondSpace - firstSpace - 1);
        }
    }

    std::string responseBody = "";
    std::string contentType = "application/json";
    int statusCode = 200;

    // Routing
    if (path == "/health") {
        responseBody = healthToJson(port);
    } else if (path.find("/api/parking/slots") != std::string::npos) {
        responseBody = baysToJson();
    } else if (path.find("/api/parking/allocate") != std::string::npos && method == "POST") {
        auto start = std::chrono::high_resolution_clock::now();
        ParkingBay* bay = allocateOptimalSlot("standard");
        auto end = std::chrono::high_resolution_clock::now();
        double elapsedMicros = std::chrono::duration<double, std::micro>(end - start).count();

        if (bay) {
            std::stringstream ss;
            ss << "{"
               << "\"success\":true,"
               << "\"allocatedSlot\":{"
               << "\"id\":" << bay->id << ","
               << "\"slotNumber\":\"" << bay->slotNumber << "\","
               << "\"coordinates\":{\"x\":" << bay->xCoord << ",\"y\":" << bay->yCoord << "},"
               << "\"type\":\"" << bay->type << "\""
               << "},"
               << "\"engineLatencyMicros\":" << elapsedMicros << ","
               << "\"message\":\"Optimal bay allocated via C++ engine\""
               << "}";
            responseBody = ss.str();
        } else {
            statusCode = 409;
            responseBody = "{\"success\":false,\"message\":\"No available slots found\"}";
        }
    } else if (path.find("/api/parking/sensor-telemetry") != std::string::npos && method == "POST") {
        // Toggle a slot sensor to simulate ultrasonic reading
        std::lock_guard<std::mutex> lock(g_bayesMutex);
        if (!g_bays.empty()) {
            g_bays[0].isOccupied = !g_bays[0].isOccupied;
            g_bays[0].ultrasonicDistanceCm = g_bays[0].isOccupied ? 25.0 : 250.0;
        }
        responseBody = "{\"success\":true,\"message\":\"Telemetry event ingested by C++ engine\"}";
    } else {
        // Default response for parking slots
        responseBody = baysToJson();
    }

    std::stringstream header;
    header << "HTTP/1.1 " << statusCode << " " << (statusCode == 200 ? "OK" : "Error") << "\r\n"
           << "Content-Type: " << contentType << "\r\n"
           << "Content-Length: " << responseBody.length() << "\r\n"
           << "Access-Control-Allow-Origin: *\r\n"
           << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
           << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
           << "Connection: close\r\n\r\n";

    std::string fullResponse = header.str() + responseBody;
    send(clientSocket, fullResponse.c_str(), fullResponse.length(), 0);
    closesocket(clientSocket);
}

int main(int argc, char* argv[]) {
    int port = 5003;
    if (argc > 1) {
        port = std::stoi(argv[1]);
    }

#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed." << std::endl;
        return 1;
    }
#endif

    initializeBays();

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "Failed to create socket." << std::endl;
        return 1;
    }

    // Set reuse address
    int opt = 1;
#ifdef _WIN32
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    sockaddr_in serverAddr{};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(serverSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "[Service 3 - C++] Failed to bind to port " << port << std::endl;
        closesocket(serverSocket);
        return 1;
    }

    if (listen(serverSocket, 20) == SOCKET_ERROR) {
        std::cerr << "[Service 3 - C++] Listen failed." << std::endl;
        closesocket(serverSocket);
        return 1;
    }

    std::cout << "[Service 3 - C++ Slot Engine] Running on port " << port << " (Native C++17 Multi-threaded HTTP Server)" << std::endl;

    while (true) {
        sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
        if (clientSocket != INVALID_SOCKET) {
            std::thread(handleClient, clientSocket, port).detach();
        }
    }

    closesocket(serverSocket);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
