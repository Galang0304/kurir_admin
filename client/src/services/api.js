import axios from 'axios';

const API_URL = '/api';

// Auth API
export const authAPI = {
  login: (email, password) => axios.post(`${API_URL}/auth/login`, { email, password }),
  register: (data) => axios.post(`${API_URL}/auth/register`, data),
  getMe: () => axios.get(`${API_URL}/auth/me`)
};

// Orders API
export const ordersAPI = {
  getAll: (params) => axios.get(`${API_URL}/orders`, { params }),
  getById: (id) => axios.get(`${API_URL}/orders/${id}`),
  getByDriver: (driverId, params) => axios.get(`${API_URL}/orders/driver/${driverId}`, { params }),
  getStats: () => axios.get(`${API_URL}/orders/stats`),
  create: (data) => axios.post(`${API_URL}/orders`, data),
  updateStatus: (id, status, cancelReason) => 
    axios.put(`${API_URL}/orders/${id}/status`, { status, cancelReason }),
  assign: (id, driverId) => axios.put(`${API_URL}/orders/${id}/assign`, { driverId })
};

// Drivers API
export const driversAPI = {
  getAll: () => axios.get(`${API_URL}/drivers`),
  getById: (id) => axios.get(`${API_URL}/drivers/${id}`),
  getAvailable: () => axios.get(`${API_URL}/drivers/available`),
  update: (id, data) => axios.put(`${API_URL}/drivers/${id}`, data),
  toggleDuty: (id) => axios.put(`${API_URL}/drivers/${id}/duty`),
  delete: (id) => axios.delete(`${API_URL}/drivers/${id}`)
};

// Shifts API
export const shiftsAPI = {
  getAll: (params) => axios.get(`${API_URL}/shifts`, { params }),
  getToday: () => axios.get(`${API_URL}/shifts/today`),
  create: (data) => axios.post(`${API_URL}/shifts`, data),
  update: (id, data) => axios.put(`${API_URL}/shifts/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/shifts/${id}`),
  bulkCreate: (shifts) => axios.post(`${API_URL}/shifts/bulk`, { shifts })
};
