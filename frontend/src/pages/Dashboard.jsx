import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Clock, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import AnimatedBorder from '../components/Layout/AnimatedBorder';
import Navbar from '../components/Layout/Navbar';
import ReservationCountdown from '../components/Dashboard/ReservationCountdown';
import { getUserReservations } from '../services/api';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await getUserReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this reservation? This action cannot be undone.'
    );

    if (!confirmed) return;

    setCancellingId(reservationId);
    try {
      await api.put(`/reservations/${reservationId}/cancel`);
      await loadReservations();
      alert('Reservation cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert(error.response?.data?.message || 'Failed to cancel reservation. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this reservation? This action cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingId(reservationId);
    try {
      await api.delete(`/reservations/${reservationId}`);
      await loadReservations();
      alert('Reservation deleted successfully!');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert(error.response?.data?.message || 'Failed to delete reservation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/20 border-green-700 text-green-400';
      case 'completed':
        return 'bg-gray-900/20 border-gray-700 text-gray-400';
      case 'cancelled':
        return 'bg-red-900/20 border-red-700 text-red-400';
      case 'expired':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-400';
      default:
        return 'bg-dark-border border-dark-border text-silver';
    }
  };

  const isReservationPast = (reservation) => {
    const now = new Date();
    const endTime = new Date(reservation.endTime);
    return endTime < now;
  };

  const canCancelReservation = (reservation) => {
    // Can cancel if status is active AND reservation hasn't ended yet
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    
    return reservation.status === 'active' && now < endTime;
  };

  const canDeleteReservation = (reservation) => {
    // Can delete if:
    // 1. Status is cancelled, completed, or expired
    // 2. OR if it's an active reservation but has ended
    const isPast = isReservationPast(reservation);
    
    return (
      reservation.status === 'cancelled' || 
      reservation.status === 'completed' || 
      reservation.status === 'expired' ||
      (reservation.status === 'active' && isPast)
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-silver-light mb-2">My Dashboard</h1>
            <p className="text-silver">Manage your parking reservations</p>
          </div>
          <button
            onClick={() => navigate('/reserve')}
            className="flex items-center space-x-2 bg-silver text-dark-bg px-6 py-3 rounded-lg font-semibold hover:bg-silver-light transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Reservation</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-silver">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <AnimatedBorder className="bg-dark-card rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-silver-dark mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-silver-light mb-2">
              No Reservations Yet
            </h3>
            <p className="text-silver-dark mb-6">
              Start by making your first parking reservation
            </p>
            <button
              onClick={() => navigate('/reserve')}
              className="inline-flex items-center space-x-2 bg-silver text-dark-bg px-6 py-3 rounded-lg font-semibold hover:bg-silver-light transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Make a Reservation</span>
            </button>
          </AnimatedBorder>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((reservation) => {
              const isPast = isReservationPast(reservation);
              const showCancel = canCancelReservation(reservation);
              const showDelete = canDeleteReservation(reservation);

              return (
                <AnimatedBorder
                  key={reservation._id}
                  className="bg-dark-card rounded-xl p-6 hover:border-silver transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-silver-light mb-1">
                        {reservation.location.name}
                      </h3>
                      <p className="text-sm text-silver-dark">
                        Slot {reservation.slot.slotNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {reservation.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-silver-dark text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{reservation.location.address}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-silver-dark text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{formatDate(reservation.startTime)}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-silver-dark text-sm">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{reservation.duration} hours</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-border flex items-center justify-between">
                    <span className="text-silver-dark text-sm">Total Amount</span>
                    <span className="text-xl font-bold text-silver-light">
                      ₹{reservation.totalPrice}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-silver-dark">
                      Reservation ID: {reservation.reservationId}
                    </p>
                  </div>

                  {/* Countdown Component */}
                  <div className="mt-4">
                    <ReservationCountdown
                      startTime={reservation.startTime}
                      endTime={reservation.endTime}
                      status={reservation.status}
                    />
                  </div>

                  {/* Action Buttons Container */}
                  <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
                    {/* Cancel Button - Only for active reservations that haven't ended */}
                    {showCancel && (
                      <button
                        onClick={() => handleCancelReservation(reservation._id)}
                        disabled={cancellingId === reservation._id}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-900/20 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === reservation._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Reservation</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Delete Button - For cancelled/completed/expired OR past active reservations */}
                    {showDelete && (
                      <button
                        onClick={() => handleDeleteReservation(reservation._id)}
                        disabled={deletingId === reservation._id}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900/20 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === reservation._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Reservation</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Status Messages */}
                    {reservation.status === 'cancelled' && (
                      <div className="flex items-center space-x-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>This reservation has been cancelled</span>
                      </div>
                    )}

                    {reservation.status === 'active' && isPast && (
                      <div className="flex items-center space-x-2 text-sm text-yellow-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>This reservation has ended</span>
                      </div>
                    )}
                  </div>
                </AnimatedBorder>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;