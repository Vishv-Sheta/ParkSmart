import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Location APIs
export const getLocationsWithinRadius = async (latitude, longitude, radius = 5) => {
  const response = await api.get('/locations/nearby', {
    params: { latitude, longitude, radius },
  });
  return response.data;
};

export const getAllLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

// Parking Slot APIs
export const getParkingSlots = async (locationId) => {
  const response = await api.get(`/parking/slots/${locationId}`);
  return response.data;
};

// Reservation APIs
export const createReservation = async (reservationData) => {
  const response = await api.post('/reservations', reservationData);
  return response.data;
};

// ... existing code ...

// Area APIs
export const getAllAreas = async () => {
  const response = await api.get('/locations/areas');
  return response.data;
};

export const getLocationsByArea = async (area) => {
  const response = await api.get(`/locations/by-area/${area}`);
  return response.data;
};

// ... rest of existing code ...

export const getUserReservations = async () => {
  const response = await api.get('/reservations/user');
  return response.data;
};

export const extendReservation = async (reservationId, additionalHours) => {
  const response = await api.put(`/reservations/${reservationId}/extend`, {
    additionalHours,
  });
  return response.data;
};

export default api;