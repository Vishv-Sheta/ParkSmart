import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import LocationSelector from '../components/Parking/LocationSelector';
import ParkingGrid from '../components/Parking/ParkingGrid';
import TimeSelector from '../components/Parking/TimeSelector';
import UserDetails from '../components/Parking/UserDetails';
import TicketConfirmation from '../components/Parking/TicketConfirmation';
import { createReservation } from '../services/api';

const ReservationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timeDetails, setTimeDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const steps = [
    { number: 1, title: 'Location' },
    { number: 2, title: 'Parking Slot' },
    { number: 3, title: 'Duration' },
    { number: 4, title: 'Details' },
    { number: 5, title: 'Confirmation' },
  ];

  const handleNext = async () => {
    if (currentStep === 4) {
      await handleCreateReservation();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateReservation = async () => {
    setLoading(true);
    try {
      const reservationData = {
        locationId: selectedLocation?._id,
        slotId: selectedSlot?._id || 'cpp_slot_1',
        slotNumber: selectedSlot?.slotNumber || 'A-01',
        startTime: timeDetails?.startTime || new Date(),
        endTime: timeDetails?.endTime || new Date(Date.now() + 2 * 3600000),
        duration: timeDetails?.duration || 2,
        totalPrice: timeDetails?.totalPrice || 100,
        userName: userDetails?.name || 'Tester User',
        userPhone: userDetails?.phone || '9876543210',
        licensePlate: (userDetails?.licensePlate || 'GJ-01-AB-1234').toUpperCase(),
      };

      const result = await createReservation(reservationData);
      setReservation(result);
      setCurrentStep(5);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(error.response?.data?.message || 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedLocation !== null;
      case 2:
        return selectedSlot !== null;
      case 3:
        return timeDetails !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <LocationSelector onLocationSelect={setSelectedLocation} />;
      case 2:
        return <ParkingGrid location={selectedLocation} onSlotSelect={setSelectedSlot} />;
      case 3:
        return (
          <TimeSelector
            onTimeSelect={setTimeDetails}
            pricePerHour={selectedSlot?.pricePerHour || 0}
          />
        );
      case 4:
        return <UserDetails onDetailsConfirm={setUserDetails} />;
      case 5:
        return <TicketConfirmation reservation={reservation} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-semibold transition-all ${
                      currentStep >= step.number
                        ? 'bg-silver border-silver-light text-dark-bg'
                        : 'bg-dark-bg border-dark-border text-silver'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-silver-light' : 'text-silver-dark'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all ${
                      currentStep > step.number ? 'bg-silver' : 'bg-dark-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 bg-dark-card border border-dark-border rounded-lg hover:border-silver transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center space-x-2 px-6 py-3 bg-silver text-dark-bg font-semibold rounded-lg hover:bg-silver-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {currentStep === 4 ? (loading ? 'Creating...' : 'Confirm Reservation') : 'Next'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-dark-card border border-silver text-silver font-semibold rounded-lg hover:bg-dark-border transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationPage;