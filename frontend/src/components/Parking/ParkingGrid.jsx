import React, { useState, useEffect } from 'react';
import { Car, CheckCircle } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';
import { getParkingSlots } from '../../services/api';

const ParkingGrid = ({ location, onSlotSelect }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location) {
      loadParkingSlots();
    }
  }, [location]);

  const loadParkingSlots = async () => {
    setLoading(true);
    try {
      const data = await getParkingSlots(location._id);
      setSlots(data);
    } catch (error) {
      console.error('Error loading parking slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      onSlotSelect(slot);
    }
  };

  const getSlotColor = (slot) => {
    if (selectedSlot?._id === slot._id) {
      return 'bg-silver border-silver-light';
    }
    switch (slot.status) {
      case 'available':
        return 'bg-dark-bg border-green-700 hover:border-green-500 cursor-pointer';
      case 'occupied':
        return 'bg-red-900/20 border-red-700 cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-900/20 border-yellow-700 cursor-not-allowed';
      default:
        return 'bg-dark-bg border-dark-border';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-silver">Loading parking slots...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-silver-light">Select Parking Slot</h2>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-dark-bg border-2 border-green-700 rounded"></div>
            <span className="text-silver">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-900/20 border-2 border-red-700 rounded"></div>
            <span className="text-silver">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-900/20 border-2 border-yellow-700 rounded"></div>
            <span className="text-silver">Reserved</span>
          </div>
        </div>
      </div>

      <AnimatedBorder className="bg-dark-card rounded-xl p-8">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {slots.map((slot) => (
            <div
              key={slot._id}
              onClick={() => handleSlotClick(slot)}
              className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${getSlotColor(
                slot
              )}`}
            >
              {selectedSlot?._id === slot._id ? (
                <CheckCircle className="w-6 h-6 text-dark-bg" />
              ) : (
                <Car
                  className={`w-6 h-6 ${
                    slot.status === 'available' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
              )}
              <span
                className={`text-xs mt-1 font-medium ${
                  selectedSlot?._id === slot._id ? 'text-dark-bg' : 'text-silver'
                }`}
              >
                {slot.slotNumber}
              </span>
            </div>
          ))}
        </div>
      </AnimatedBorder>

      {selectedSlot && (
        <AnimatedBorder className="bg-dark-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-silver-light mb-1">
                Selected Slot: {selectedSlot.slotNumber}
              </h3>
              <p className="text-silver-dark text-sm">
                Floor: {selectedSlot.floor} | Type: {selectedSlot.type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-silver">₹{selectedSlot.pricePerHour}</p>
              <p className="text-sm text-silver-dark">per hour</p>
            </div>
          </div>
        </AnimatedBorder>
      )}
    </div>
  );
};

export default ParkingGrid;