# Smart Parking Reservation System

A full-stack intelligent parking management solution with real-time slot availability, advanced license plate recognition, and seamless booking experience.

## Features

### Core Features

- User authentication with JWT security
- Location-based parking search (5km radius)
- Real-time parking slot availability tracking
- AI-powered license plate recognition (OCR)
- Responsive dark-themed UI with smooth animations
- PDF ticket generation and download
- Reservation management (create, view, cancel)

### Technology Stack

**Frontend**

- React 18 with Hooks
- React Router DOM v6
- Axios for API calls
- CSS3 with animations
- jsPDF & html2canvas for PDF generation

**Backend**

- Node.js 16+
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- CORS enabled

**AI/ML Service**

- Python 3.8+
- Flask Framework
- OpenCV for image processing
- Tesseract OCR
- NumPy for computations

**Database**

- MongoDB Atlas (cloud)
- Collections: Users, Locations, Slots, Reservations

## Project Structure

smart-parking-system/
├── frontend/ # React Application
│ ├── public/ # Static assets
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── services/ # API services
│ │ ├── utils/ # Helper functions
│ │ ├── App.jsx
│ │ └── index.jsx
│ ├── package.json
│ └── .env.example
│
├── backend/ # Node.js/Express API
│ ├── config/ # Configuration
│ ├── controllers/ # Business logic
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ ├── middleware/ # Custom middleware
│ ├── server.js
│ ├── package.json
│ └── .env.example
│
├── ai-module/ # Python OCR Service
│ ├── models/ # ML models
│ ├── src/ # Source code
│ ├── api/ # Flask endpoints
│ ├── requirements.txt
│ └── .env.example
│
└── README.md

## Prerequisites

- Node.js 16 or higher
- Python 3.8 or higher
- Git
- MongoDB Atlas account (free tier available)
- Tesseract OCR installed

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/smart-parking-system.git
cd smart-parking-system
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/parking-db
# JWT_SECRET=your_secret_key

npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env

# Backend API should be accessible
npm start
# Frontend runs on http://localhost:3000
```

### 4. AI Module Setup

```bash
cd ../ai-module

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
cp .env.example .env

# Start AI service
python api/app.py
# AI service runs on http://localhost:5001
```

## API Endpoints

### Authentication (`/api/auth`)

POST /register - Register new user
POST /login - Login user
GET /profile - Get user profile
PUT /profile - Update profile

### Parking (`/api/parking`)

GET /locations/nearby - Get nearby locations
GET /locations/:locationId - Get location details
GET /slots/status/:id - Get slot status
POST /sample-data - Create sample data

### Reservations (`/api/reservations`)

POST / - Create reservation
GET / - Get user reservations
GET /:reservationId - Get reservation details
PUT /:reservationId/cancel - Cancel reservation
PUT /:reservationId/complete - Mark as complete

### OCR Service (`/api/ocr`)

POST /recognize - Recognize plate from image
POST /confirm - Confirm recognized plate
POST /batch - Batch recognize multiple plates
GET /stats - Get service statistics

## Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/parking-db
JWT_SECRET=your_super_secret_key_minimum_32_characters
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:5001/api
```

### Frontend (.env)

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:5001/api
REACT_APP_ENV=development
```

### AI Module (.env)

```env
PORT=5001
DEBUG=False
CORS_ORIGIN=http://localhost:3000
CONFIDENCE_THRESHOLD=0.7
MAX_IMAGE_SIZE=5242880
```

## Development

### Run All Services (Recommended)

Open 3 terminal windows:

**Terminal 1 - Backend**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**

```bash
cd frontend
npm start
```

**Terminal 3 - AI Module**

```bash
cd ai-module
source venv/bin/activate
python api/app.py
```

### Create Sample Data

```bash
curl -X POST http://localhost:5000/api/parking/sample-data
```

### API Testing with cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+91 9876543210"
  }'

# Get nearby locations
curl -X GET "http://localhost:5000/api/parking/locations/nearby?latitude=12.9716&longitude=77.5946&radius=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI Module tests
cd ai-module
pytest
```

## Docker Deployment

### Build Docker Images

```bash
# Backend
docker build -t smart-parking-backend ./backend

# Frontend
docker build -t smart-parking-frontend ./frontend

# AI Module
docker build -t smart-parking-ai ./ai-module
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## Cloud Deployment

### Frontend

- **Vercel**: `vercel --prod`
- **Netlify**: Connect GitHub, auto-deploy
- **AWS S3 + CloudFront**: Static hosting

### Backend

- **Heroku**: `git push heroku main`
- **Railway.app**: Connect GitHub repo
- **AWS EC2**: Deploy with PM2
- **DigitalOcean App Platform**: One-click deploy

### AI Module

- **Heroku**: Deploy Python Flask app
- **AWS Lambda**: Serverless option
- **Railway.app**: Python environment support

### Database

- **MongoDB Atlas**: Cloud MongoDB (free tier)
- **AWS RDS**: Managed database service

## Key Features Explained

### 1. Location-Based Search

- Uses Haversine formula to calculate distances
- Finds parking within 5km radius
- Returns sorted by distance

### 2. License Plate Recognition

- Image preprocessing with OpenCV
- OCR using Tesseract
- Format validation (Indian format: KA01AB1234)
- User confirmation workflow

### 3. Slot Management

- Real-time availability tracking
- Color-coded status (Available/Occupied/Reserved)
- Visual grid representation
- Auto-release after reservation duration

### 4. Reservation Flow

1. Select Location → Find nearby parking
2. Select Slot → Pick available slot
3. Choose Duration → 1-6 hours
4. Upload Plate → Camera or file
5. Review & Confirm → Generate ticket
6. Download PDF → Save for reference

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation
- Error handling middleware
- Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test before submitting PR
- Write descriptive commit messages

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment gateway (Razorpay/Stripe)
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Recurring reservations
- [ ] Loyalty program

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Team

- **Lead Developer**: Megha Prasad
  Harshith Velkumar
  Mihika Bardhan
  Gouri Naik
- **Contributors**: Open to community contributions

## Support

- Email: support@smartparking.com
- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Documentation: Wiki

## Acknowledgments

- OpenCV community for image processing
- Tesseract OCR project
- Flask and Express frameworks
- MongoDB team
- React community

---

**Happy Parking!**

Last Updated: 2024
