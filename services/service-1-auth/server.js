const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { initRabbitMQ, publishEvent } = require('./rabbitmq');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parksmart_auth_db';
const JWT_SECRET = process.env.JWT_SECRET || 'parksmart_distributed_secret_key_2026';

app.use(cors());
app.use(express.json());

// Token generator helper
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Middleware: verify token
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({
    service: 'Service 1: Authentication & User Management',
    status: 'UP',
    database: 'MongoDB (parksmart_auth_db)',
    port: PORT,
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, defaultVehiclePlate, licensePlate } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const vehiclePlate = (defaultVehiclePlate || licensePlate || '').trim().toUpperCase();

    user = await User.create({
      name,
      email,
      password,
      phone,
      defaultVehiclePlate: vehiclePlate,
    });

    // Publish event to RabbitMQ
    publishEvent('user.registered', {
      userId: user._id,
      name: user.name,
      email: user.email,
      plate: user.defaultVehiclePlate,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      defaultVehiclePlate: user.defaultVehiclePlate,
      licensePlate: user.defaultVehiclePlate,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      defaultVehiclePlate: user.defaultVehiclePlate || '',
      licensePlate: user.defaultVehiclePlate || '',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Current User Profile
app.get('/api/auth/me', protect, async (req, res) => {
  const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
  userObj.licensePlate = userObj.defaultVehiclePlate || '';
  res.json(userObj);
});

// Start Server & Connect DB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  })
  .then(() => {
    console.log(`[Service 1 - Auth] Connected to MongoDB at ${MONGODB_URI}`);
    initRabbitMQ();
    app.listen(PORT, () => {
      console.log(`[Service 1 - Auth] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn(`[Service 1 - Auth] MongoDB warning (${err.message}). Starting server in standalone mode...`);
    initRabbitMQ();
    app.listen(PORT, () => {
      console.log(`[Service 1 - Auth] Running on port ${PORT} (Standalone fallback)`);
    });
  });
