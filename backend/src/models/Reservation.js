const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    userName: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      uppercase: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique reservation ID before validation
reservationSchema.pre('validate', function (next) {
  if (!this.reservationId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reservationId = `SP-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);