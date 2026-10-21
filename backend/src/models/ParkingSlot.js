const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    slotNumber: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    type: {
      type: String,
      enum: ['regular', 'compact', 'large', 'handicap', 'electric'],
      default: 'regular',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    pricePerHour: {
      type: Number,
      required: true,
      default: 50,
    },
    currentReservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

parkingSlotSchema.index({ location: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);