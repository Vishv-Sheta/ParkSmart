import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import { Car } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    await login(email, password);
    navigate('/dashboard');
  };

  const handleRegister = async (userData) => {
    await register(userData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-12">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col items-center space-y-6 flex-1">
          <div className="flex items-center space-x-4">
            <Car className="w-16 h-16 text-silver" />
            <h1 className="text-5xl font-bold text-silver-light">ParkSmart</h1>
          </div>
          <p className="text-xl text-silver text-center max-w-md">
            Distributed Smart Parking & Reservation System with Real-Time Sensor Telemetry & AI Plate Recognition
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-silver-light mb-1">500+</p>
              <p className="text-sm text-silver-dark">Parking Locations</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-silver-light mb-1">10K+</p>
              <p className="text-sm text-silver-dark">Happy Users</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex-1 flex items-center justify-center">
          {isLogin ? (
            <Login onLogin={handleLogin} onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <Register onRegister={handleRegister} onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;