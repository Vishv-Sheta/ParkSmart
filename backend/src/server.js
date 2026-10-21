const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDatabase = require('./config/database');
const { updateExpiredReservations } = require('./utils/updateReservationStatus'); // ADD THIS LINE

// Load environment variables
dotenv.config();

// Connect to database
connectDatabase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/reservations', require('./routes/reservations'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartPark API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // ADD THESE LINES: Run status updater every 5 minutes
  updateExpiredReservations(); // Run immediately on startup
  setInterval(updateExpiredReservations, 5 * 60 * 1000); // Run every 5 minutes
  console.log('Automatic reservation status updater started');
});