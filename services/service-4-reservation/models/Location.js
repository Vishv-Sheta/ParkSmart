const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    totalSlots: {
      type: Number,
      required: true,
      default: 24,
    },
    availableSlots: {
      type: Number,
      required: true,
      default: 18,
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 50,
    },
    operatingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '23:00' },
    },
    amenities: [String],
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Location', locationSchema);
