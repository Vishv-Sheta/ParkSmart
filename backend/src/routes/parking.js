const express = require('express');
const router = express.Router();
const ParkingSlot = require('../models/ParkingSlot');
const Location = require('../models/Location');
const { protect } = require('../middleware/auth');

// Helper function to randomize slot statuses
const randomizeSlotStatuses = (slots, availableCount) => {
  const totalSlots = slots.length;
  const occupiedCount = totalSlots - availableCount;
  
  // Reset all to available first
  slots.forEach(slot => {
    if (slot.status !== 'reserved' || !slot.currentReservation) {
      slot.status = 'available';
    }
  });

  // Randomly mark slots as occupied
  let marked = 0;
  while (marked < occupiedCount) {
    const randomIndex = Math.floor(Math.random() * totalSlots);
    if (slots[randomIndex].status === 'available') {
      slots[randomIndex].status = Math.random() > 0.3 ? 'occupied' : 'reserved';
      marked++;
    }
  }

  return slots;
};

// @route   GET /api/parking/slots/:locationId
// @desc    Get all parking slots for a location (with randomization)
// @access  Private
router.get('/slots/:locationId', protect, async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    let slots = await ParkingSlot.find({
      location: req.params.locationId,
    }).sort({ slotNumber: 1 });

    // Convert to plain objects
    slots = slots.map(slot => slot.toObject());

    // Randomize statuses while maintaining available count
    slots = randomizeSlotStatuses(slots, location.availableSlots);

    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/parking/slots/:locationId/available
// @desc    Get available parking slots for a location
// @access  Private
router.get('/slots/:locationId/available', protect, async (req, res) => {
  try {
    const slots = await ParkingSlot.find({
      location: req.params.locationId,
      status: 'available',
    }).sort({ slotNumber: 1 });

    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;