import os
import re
import json
import threading
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv("PORT", 5002))
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/parksmart_ai_db")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://localhost:5672")

# In-memory whitelist and logs fallback (ensures operation even before DB/Broker start)
whitelist = set(["KA-01-AB-1234", "MH-02-CD-5678", "DL-08-EF-9012"])
gate_logs = []

# Try connecting to MongoDB
mongo_client = None
db = None
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    db = mongo_client.get_database()
    print(f"[Service 2 - AI] Connected to MongoDB: {MONGODB_URI}")
except Exception as e:
    print(f"[Service 2 - AI] MongoDB connection warning: {e}. Using in-memory store.")

def sanitize_plate(text):
    if not text:
        return ""
    cleaned = re.sub(r'[^A-Za-z0-9]', '', text).upper()
    # Format as XX-00-XX-0000 if matches standard pattern
    if len(cleaned) == 10:
        return f"{cleaned[:2]}-{cleaned[2:4]}-{cleaned[4:6]}-{cleaned[6:]}"
    return cleaned

def simulate_opencv_anpr(image_bytes=None, raw_text=None):
    """
    Computer Vision ANPR Pipeline:
    1. Grayscale conversion
    2. Bilateral filtering for noise removal
    3. Canny Edge Detection
    4. Contour identification (aspect ratio ~ 2.0 to 5.5 for license plates)
    """
    if raw_text:
        plate = sanitize_plate(raw_text)
        return {
            "licensePlate": plate,
            "confidence": 0.965,
            "boundingBox": {"x": 120, "y": 240, "width": 380, "height": 95},
            "processingTimeMs": 18.4,
            "method": "OpenCV-Contour-OCR"
        }
    
    # Default simulated detection if an image file was uploaded
    plates = ["KA-05-MJ-4321", "DL-03-CC-8899", "MH-12-PQ-7722", "GJ-01-AZ-9900"]
    picked = plates[np.random.randint(0, len(plates))]
    return {
        "licensePlate": picked,
        "confidence": float(np.round(np.random.uniform(0.92, 0.99), 3)),
        "boundingBox": {"x": 140, "y": 210, "width": 350, "height": 90},
        "processingTimeMs": float(np.round(np.random.uniform(15.0, 25.0), 1)),
        "method": "OpenCV-Contour-OCR"
    }

# RabbitMQ Event Listener (Background Thread)
def rabbitmq_consumer():
    try:
        import pika
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        channel.exchange_declare(exchange='parksmart_events', exchange_type='topic', durable=True)
        
        result = channel.queue_declare(queue='ai_plate_whitelist_queue', exclusive=True)
        queue_name = result.method.queue
        
        channel.queue_bind(exchange='parksmart_events', queue=queue_name, routing_key='reservation.*')
        
        def callback(ch, method, properties, body):
            try:
                data = json.loads(body.decode('utf-8'))
                plate = data.get('licensePlate') or data.get('plate')
                if plate:
                    formatted = sanitize_plate(plate)
                    whitelist.add(formatted)
                    if db is not None:
                        db.whitelist.update_one({"plate": formatted}, {"$set": {"plate": formatted, "updatedAt": datetime.datetime.utcnow()}}, upsert=True)
                    print(f"[Service 2 - AI] RabbitMQ received event! Whitelisted license plate: {formatted}")
            except Exception as ex:
                print(f"[Service 2 - AI] Error parsing message: {ex}")

        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
        print(f"[Service 2 - AI] RabbitMQ Consumer listening for reservation events...")
        channel.start_consuming()
    except Exception as e:
        print(f"[Service 2 - AI] RabbitMQ background consumer inactive ({e}). Running in standalone mode.")

consumer_thread = threading.Thread(target=rabbitmq_consumer, daemon=True)
consumer_thread.start()

# --- HTTP Endpoints ---

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "service": "Service 2: AI Computer Vision & ANPR",
        "status": "UP",
        "database": "MongoDB (parksmart_ai_db)",
        "whitelistedPlatesCount": len(whitelist),
        "port": PORT
    })

@app.route('/api/ai/scan-plate', methods=['POST'])
def scan_plate():
    """
    Accepts uploaded vehicle image OR JSON with plate hint for ANPR OCR.
    """
    try:
        data = request.get_json(silent=True) or {}
        plate_hint = data.get('plateText') or data.get('plate') or request.form.get('plateText') or request.form.get('plate')
        result = simulate_opencv_anpr(raw_text=plate_hint)
        
        # Log detection
        log_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "detectedPlate": result["licensePlate"],
            "confidence": result["confidence"],
            "isWhitelisted": result["licensePlate"] in whitelist
        }
        gate_logs.append(log_entry)
        if db is not None:
            try:
                db.plate_logs.insert_one(log_entry.copy())
            except Exception:
                pass

        return jsonify({
            "success": True,
            "data": result,
            "accessGranted": log_entry["isWhitelisted"]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ai/verify-gate-access', methods=['POST'])
def verify_gate():
    """
    Simulates automated barrier gate check.
    """
    data = request.get_json(silent=True) or request.form or {}
    raw_plate = data.get('licensePlate') or data.get('plate') or data.get('vehicleNumber') or ''
    plate = sanitize_plate(raw_plate)
    
    is_allowed = plate in whitelist
    status_msg = "GATE_OPENED: Welcome to ParkSmart" if is_allowed else "ACCESS_DENIED: No active reservation found for this vehicle"
    
    return jsonify({
        "licensePlate": plate,
        "barrierStatus": "OPEN" if is_allowed else "CLOSED",
        "accessGranted": is_allowed,
        "message": status_msg,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/ai/whitelist', methods=['GET', 'POST'])
def handle_whitelist():
    if request.method == 'POST':
        data = request.get_json(silent=True) or request.form or {}
        raw_plate = data.get('licensePlate') or data.get('plate') or ''
        plate = sanitize_plate(raw_plate)
        if plate:
            whitelist.add(plate)
            if db is not None:
                try:
                    db.whitelist.update_one({"plate": plate}, {"$set": {"plate": plate, "updatedAt": datetime.datetime.utcnow()}}, upsert=True)
                except Exception:
                    pass
            return jsonify({"success": True, "message": f"Added {plate} to gate whitelist"})
        return jsonify({"success": False, "message": "Invalid plate"}), 400
    
    return jsonify({
        "count": len(whitelist),
        "plates": sorted(list(whitelist))
    })

@app.route('/api/ai/logs', methods=['GET'])
def get_logs():
    return jsonify({
        "total": len(gate_logs),
        "logs": gate_logs[-20:]  # last 20 detections
    })

if __name__ == '__main__':
    print(f"[Service 2 - AI] Starting Flask server on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False)
