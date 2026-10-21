const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect } = require('../middleware/auth');

// @route   GET /api/locations/areas
// @desc    Get all unique areas
// @access  Private
router.get('/areas', protect, async (req, res) => {
  try {
    const areas = await Location.distinct('area', { isActive: true });
    res.json(areas.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/locations/by-area/:area
// @desc    Get locations by area
// @access  Private
router.get('/by-area/:area', protect, async (req, res) => {
  try {
    const locations = await Location.find({
      area: req.params.area,
      isActive: true,
    }).sort({ name: 1 });

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/locations
// @desc    Get all locations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true });
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/locations/nearby
// @desc    Get locations within specified radius
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const locations = await Location.find({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radius * 1000,
        },
      },
    });

    const locationsWithDistance = locations.map((location) => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        location.coordinates.coordinates[1],
        location.coordinates.coordinates[0]
      );
      return {
        ...location.toObject(),
        distance,
      };
    });

    res.json(locationsWithDistance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;