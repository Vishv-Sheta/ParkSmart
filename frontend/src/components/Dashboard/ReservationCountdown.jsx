import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

const ReservationCountdown = ({ startTime, endTime, status }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      // If reservation hasn't started yet
      if (now < start) {
        const difference = start - now;
        return {
          type: 'starts-in',
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      // If reservation is active
      else if (now >= start && now < end) {
        const difference = end - now;
        const totalDuration = end - start;
        const elapsed = now - start;
        const progressPercent = (elapsed / totalDuration) * 100;
        
        setProgress(progressPercent);

        return {
          type: 'ends-in',
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          progress: progressPercent,
        };
      }
      // If reservation has ended
      else {
        return {
          type: 'ended',
        };
      }
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  if (status !== 'active') {
    return null;
  }

  const renderCountdown = () => {
    if (timeLeft.type === 'starts-in') {
      return (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Starts In</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {timeLeft.days > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-silver-light">{timeLeft.days}</div>
                <div className="text-xs text-silver-dark">Days</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.hours}</div>
              <div className="text-xs text-silver-dark">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.minutes}</div>
              <div className="text-xs text-silver-dark">Min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.seconds}</div>
              <div className="text-xs text-silver-dark">Sec</div>
            </div>
          </div>
        </div>
      );
    }

    if (timeLeft.type === 'ends-in') {
      return (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Active - Ends In</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.hours}</div>
              <div className="text-xs text-silver-dark">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.minutes}</div>
              <div className="text-xs text-silver-dark">Min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-silver-light">{timeLeft.seconds}</div>
              <div className="text-xs text-silver-dark">Sec</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-silver-dark">Started</span>
              <span className="text-xs text-green-400">{Math.round(progress)}%</span>
              <span className="text-xs text-silver-dark">End</span>
            </div>
          </div>
        </div>
      );
    }

    if (timeLeft.type === 'ended') {
      return (
        <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Reservation Ended</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return renderCountdown();
};

export default ReservationCountdown;