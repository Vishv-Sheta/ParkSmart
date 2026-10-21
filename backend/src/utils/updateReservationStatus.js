const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const Location = require('../models/Location');

const updateExpiredReservations = async () => {
  try {
    const now = new Date();

    // Find all active reservations that have ended
    const expiredReservations = await Reservation.find({
      status: 'active',
      endTime: { $lt: now },
    });

    if (expiredReservations.length === 0) {
      return;
    }

    console.log(`Found ${expiredReservations.length} expired reservations to update`);

    for (const reservation of expiredReservations) {
      // Update reservation status to completed
      reservation.status = 'completed';
      await reservation.save();

      // Update parking slot status back to available
      const slot = await ParkingSlot.findById(reservation.slot);
      if (slot && slot.status === 'reserved') {
        slot.status = 'available';
        slot.currentReservation = null;
        await slot.save();

        // Update location available slots
        await Location.findByIdAndUpdate(reservation.location, {
          $inc: { availableSlots: 1 },
        });
      }

      console.log(`Updated reservation ${reservation.reservationId} to completed`);
    }
  } catch (error) {
    console.error('Error updating expired reservations:', error);
  }
};

module.exports = { updateExpiredReservations };