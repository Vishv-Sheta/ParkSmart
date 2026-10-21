import React, { useState, useEffect } from 'react';
import { User, Phone, Car } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';
import { useAuth } from '../../context/AuthContext';

const UserDetails = ({ onDetailsConfirm }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || 'Tester User',
    phone: user?.phone || '9876543210',
    licensePlate: user?.licensePlate || user?.defaultVehiclePlate || 'GJ-01-AB-1234',
  });

  useEffect(() => {
    const initialData = {
      name: user?.name || formData.name || 'Tester User',
      phone: user?.phone || formData.phone || '9876543210',
      licensePlate: user?.licensePlate || user?.defaultVehiclePlate || formData.licensePlate || 'GJ-01-AB-1234',
    };
    setFormData(initialData);
    onDetailsConfirm(initialData);
  }, [user]);

  const handleChange = (e) => {
    const updatedData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(updatedData);
    onDetailsConfirm(updatedData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-silver-light">Confirm Your Details</h2>

      <AnimatedBorder className="bg-dark-card rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-silver mb-2 text-sm flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-silver-light focus:outline-none focus:border-silver transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-silver mb-2 text-sm flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-silver-light focus:outline-none focus:border-silver transition-colors"
              placeholder="+1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-silver mb-2 text-sm flex items-center space-x-2">
              <Car className="w-4 h-4" />
              <span>License Plate Number</span>
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-silver-light focus:outline-none focus:border-silver transition-colors uppercase"
              placeholder="ABC123"
              required
            />
          </div>
        </div>
      </AnimatedBorder>
    </div>
  );
};

export default UserDetails;