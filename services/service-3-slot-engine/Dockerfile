FROM gcc:12-bookworm AS build
WORKDIR /app
COPY main.cpp .
RUN g++ -O3 -std=c++17 main.cpp -o slot_engine -pthread

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/slot_engine .
EXPOSE 5003
CMD ["./slot_engine", "5003"]
