import React, { useState } from 'react';
import { User, Mail, Lock, Phone, Car, UserPlus } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licensePlate: '',
    defaultVehiclePlate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalVal = name === 'licensePlate' ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalVal,
      ...(name === 'licensePlate' ? { defaultVehiclePlate: finalVal } : {}),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const plate = (formData.licensePlate || formData.defaultVehiclePlate || '').toUpperCase().trim();
      await onRegister({
        ...formData,
        licensePlate: plate,
        defaultVehiclePlate: plate,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBorder className="bg-dark-card rounded-xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-silver-light mb-2">Create Account</h2>
        <p className="text-silver-dark">Join ParkSmart today</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-silver mb-2 text-sm">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-silver-light placeholder:text-gray-400 placeholder:opacity-90 focus:outline-none focus:border-silver transition-colors"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-silver mb-2 text-sm">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-silver-light placeholder:text-gray-400 placeholder:opacity-90 focus:outline-none focus:border-silver transition-colors"
              placeholder="e.g. rahul@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-silver mb-2 text-sm">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-silver-light placeholder:text-gray-400 placeholder:opacity-90 focus:outline-none focus:border-silver transition-colors"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-silver mb-2 text-sm">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-silver-light placeholder:text-gray-400 placeholder:opacity-90 focus:outline-none focus:border-silver transition-colors"
              placeholder="e.g. 9876543210"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-silver mb-2 text-sm">License Plate (Default Vehicle)</label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark" />
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-3 text-silver-light placeholder:text-gray-400 placeholder:opacity-90 focus:outline-none focus:border-silver transition-colors uppercase font-mono tracking-wider"
              placeholder="GJ-01-AB-1234"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-silver text-dark-bg font-semibold py-3 rounded-lg hover:bg-silver-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
        >
          <UserPlus className="w-5 h-5" />
          <span>{loading ? 'Creating account...' : 'Create Account'}</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-silver-dark">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-silver hover:text-silver-light transition-colors font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </AnimatedBorder>
  );
};

export default Register;