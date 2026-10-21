import React from 'react';
import { CheckCircle, Download, MapPin, Clock, Car, Calendar } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';
import { generatePDF } from '../../utils/pdfGenerator';

const TicketConfirmation = ({ reservation }) => {
  const handleDownloadPDF = () => {
    generatePDF(reservation);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-900/20 border-2 border-green-500 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-silver-light mb-2">Reservation Confirmed!</h2>
        <p className="text-silver">Your parking spot has been successfully reserved</p>
      </div>

      <AnimatedBorder className="bg-dark-card rounded-xl p-6">
        <div className="space-y-4">
          <div className="pb-4 border-b border-dark-border">
            <p className="text-sm text-silver-dark mb-1">Reservation ID</p>
            <p className="text-xl font-mono text-silver-light">{reservation.reservationId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-silver-dark mb-1 flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </p>
              <p className="text-silver-light font-medium">{reservation.location.name}</p>
            </div>

            <div>
              <p className="text-sm text-silver-dark mb-1 flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>Slot Number</span>
              </p>
              <p className="text-silver-light font-medium">{reservation.slot.slotNumber}</p>
            </div>

            <div>
              <p className="text-sm text-silver-dark mb-1 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Start Time</span>
              </p>
              <p className="text-silver-light font-medium">{formatDate(reservation.startTime)}</p>
            </div>

            <div>
              <p className="text-sm text-silver-dark mb-1 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>End Time</span>
              </p>
              <p className="text-silver-light font-medium">{formatDate(reservation.endTime)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border">
            <div className="flex items-center justify-between">
              <span className="text-silver">Duration</span>
              <span className="text-silver-light font-medium">{reservation.duration} hours</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-silver">Total Amount</span>
              <span className="text-2xl font-bold text-silver-light">
                ₹{reservation.totalPrice}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border">
            <p className="text-sm text-silver-dark mb-2">User Details</p>
            <div className="space-y-1 text-silver">
              <p>Name: {reservation.useName}</p>
              <p>Phone: {reservation.usePhone}</p>
              <p>License Plate: {reservation.licensePlate}</p>
            </div>
          </div>
        </div>
      </AnimatedBorder>

      <button
        onClick={handleDownloadPDF}
        className="w-full flex items-center justify-center space-x-2 bg-silver text-dark-bg font-semibold py-3 rounded-lg hover:bg-silver-light transition-colors"
      >
        <Download className="w-5 h-5" />
        <span>Download Ticket (PDF)</span>
      </button>

      <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
        <p className="text-silver-dark text-sm">
          Please show this ticket at the parking entrance. You can extend your reservation up to 30
          minutes before it expires.
        </p>
      </div>
    </div>
  );
};

export default TicketConfirmation;