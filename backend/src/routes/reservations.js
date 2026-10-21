const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const Location = require('../models/Location');
const { protect } = require('../middleware/auth');

// @route   POST /api/reservations
// @desc    Create a new reservation
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      locationId,
      slotId,
      startTime,
      endTime,
      duration,
      totalPrice,
      userName,
      userPhone,
      licensePlate,
    } = req.body;

    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({ message: 'Parking slot is not available' });
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      location: locationId,
      slot: slotId,
      startTime,
      endTime,
      duration,
      totalPrice,
      userName,
      userPhone,
      licensePlate,
    });

    slot.status = 'reserved';
    slot.currentReservation = reservation._id;
    await slot.save();

    await Location.findByIdAndUpdate(locationId, {
      $inc: { availableSlots: -1 },
    });

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('location')
      .populate('slot');

    res.status(201).json({
      ...populatedReservation.toObject(),
      user: {
        name: userName,
        phone: userPhone,
        licensePlate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reservations/user
// @desc    Get all reservations for current user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('location')
      .populate('slot')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reservations/:id
// @desc    Get single reservation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('location')
      .populate('slot')
      .populate('user', '-password');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if reservation belongs to user
    if (reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this reservation' });
    }

    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reservations/:id/extend
// @desc    Extend reservation duration
// @access  Private
router.put('/:id/extend', protect, async (req, res) => {
  try {
    const { additionalHours } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to extend this reservation' });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Can only extend active reservations' });
    }

    if (reservation.duration + additionalHours > 6) {
      return res.status(400).json({ message: 'Total duration cannot exceed 6 hours' });
    }

    const slot = await ParkingSlot.findById(reservation.slot);
    const additionalPrice = additionalHours * slot.pricePerHour;

    const newEndTime = new Date(reservation.endTime.getTime() + additionalHours * 60 * 60 * 1000);
    reservation.endTime = newEndTime;
    reservation.duration += additionalHours;
    reservation.totalPrice += additionalPrice;
    await reservation.save();

    const updatedReservation = await Reservation.findById(reservation._id)
      .populate('location')
      .populate('slot');

    res.json(updatedReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reservations/:id/cancel
// @desc    Cancel reservation
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Can only cancel active reservations' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    const slot = await ParkingSlot.findById(reservation.slot);
    slot.status = 'available';
    slot.currentReservation = null;
    await slot.save();

    await Location.findByIdAndUpdate(reservation.location, {
      $inc: { availableSlots: 1 },
    });

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete reservation (admin only or after completion)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if reservation belongs to user
    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reservation' });
    }

    // Check if reservation has ended (based on time)
    const now = new Date();
    const endTime = new Date(reservation.endTime);
    const hasEnded = endTime < now;

    // Allow deletion if:
    // 1. Status is cancelled, completed, or expired
    // 2. OR reservation is active but time has passed
    if (
      reservation.status === 'cancelled' ||
      reservation.status === 'completed' ||
      reservation.status === 'expired' ||
      (reservation.status === 'active' && hasEnded)
    ) {
      await Reservation.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Reservation deleted successfully' });
    }

    // If reservation is still active and not ended, prevent deletion
    return res.status(400).json({ 
      message: 'Cannot delete active reservation. Please cancel it first.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;