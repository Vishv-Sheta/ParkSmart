import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Car } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-dark-card border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-silver" />
            <span className="text-xl font-bold text-silver-light">ParkSmart</span>
            <span className="text-xs px-2 py-0.5 rounded bg-dark-bg text-silver border border-dark-border">Distributed System</span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-silver">
                <User className="w-5 h-5" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg hover:border-silver transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;