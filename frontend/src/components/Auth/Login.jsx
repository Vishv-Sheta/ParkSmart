import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBorder className="bg-dark-card rounded-xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-silver-light mb-2">Welcome Back</h2>
        <p className="text-silver-dark">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="tester@gmail.com"
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
              placeholder="tester123"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-silver text-dark-bg font-semibold py-3 rounded-lg hover:bg-silver-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <LogIn className="w-5 h-5" />
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-silver-dark">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-silver hover:text-silver-light transition-colors font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </AnimatedBorder>
  );
};

export default Login;