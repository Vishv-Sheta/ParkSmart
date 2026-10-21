const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    slotId: {
      type: String,
      required: true,
    },
    slotNumber: {
      type: String,
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

// Auto-generate human-readable ticket ID (e.g. PK-8491)
reservationSchema.pre('save', function (next) {
  if (!this.reservationId) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.reservationId = `PK-${Date.now().toString().slice(-4)}${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
