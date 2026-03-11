import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Aumentado para 20 segundos para lidar com backend lento
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@PDV:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('@PDV:token');
      localStorage.removeItem('@PDV:user');
      localStorage.removeItem('@PDV:company');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerUser: (userData) => api.post('/auth/register-user', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getByCompany: () => api.get('/users/company'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  approve: (id) => api.put(`/users/${id}/approve`),
  deactivate: (id) => api.put(`/users/${id}/deactivate`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Companies API
export const companiesAPI = {
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  updateSettings: (id, settings) => api.put(`/companies/${id}/settings`, settings),
  cashRegister: {
    open: (id, data) => api.post(`/companies/${id}/cash-register/open`, data),
    close: (id, data) => api.post(`/companies/${id}/cash-register/close`, data),
    adjust: (id, data) => api.post(`/companies/${id}/cash-register/adjust`, data),
    getCurrentAdjustments: (id) => api.get(`/companies/${id}/cash-register/current-adjustments`),
  },
  getPrinters: () => api.get('/companies/printers'),
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  adjustStock: async (id, data) => {
    const response = await api.put(`/products/${id}/adjust-stock`, data);
    return response.data;
  }
};

export const brandsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/brands', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/brands', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/brands/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  }
};

export const productGroupsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/product-groups', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/product-groups/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/product-groups', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/product-groups/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/product-groups/${id}`);
    return response.data;
  }
};

export const productSubgroupsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/product-subgroups', { params });
    return response.data;
  },

  getByGroup: async (groupId) => {
    const response = await api.get(`/product-subgroups/by-group/${groupId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/product-subgroups/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/product-subgroups', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/product-subgroups/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/product-subgroups/${id}`);
    return response.data;
  }
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getTrash: (params) => api.get('/customers/trash', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getByDocument: (document) => api.get(`/customers/document/${document}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  restore: (id) => api.put(`/customers/${id}/restore`),
  delete: (id) => api.delete(`/customers/${id}`),
  deletePermanent: (id) => api.delete(`/customers/${id}/permanent`),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  cancel: (id, data) => api.put(`/sales/${id}/cancel`, data),
  getDailyReport: (params) => api.get('/sales/report/daily', { params }),
  getPeriodReport: (params) => api.get('/sales/report/period', { params }),
  getCurrentCashRegisterReport: (params) => api.get('/sales/report/current-cash-register', { params })
};

// Entries API
export const entriesAPI = {
  getAll: (params) => api.get('/entries', { params }),
  getById: (id) => api.get(`/entries/${id}`),
  create: (data) => api.post('/entries', data),
  update: (id, data) => api.put(`/entries/${id}`, data),
  delete: (id) => api.delete(`/entries/${id}`),
  complete: (id) => api.put(`/entries/${id}/complete`),
  cancel: (id, data) => api.put(`/entries/${id}/cancel`, data),
  getPeriodReport: (params) => api.get('/entries/report/period', { params }),
};

// Receivables API
export const receivablesAPI = {
  getAll: (params) => api.get('/receivables', { params }),
  getOverdue: () => api.get('/receivables/overdue'),
  getSummary: () => api.get('/receivables/summary'),
  getById: (id) => api.get(`/receivables/${id}`),
  addPayment: (id, data) => api.post(`/receivables/${id}/payment`, data),
  cancel: (id, data) => api.put(`/receivables/${id}/cancel`, data),
  getByCustomer: (customerId) => api.get(`/receivables/customer/${customerId}`),
  getOverdueInstallments: () => api.get('/receivables/installments/overdue'),
  addInstallmentPayment: (receivableId, installmentNumber, data) => 
    api.post(`/receivables/installments/${receivableId}/${installmentNumber}/payment`, data),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getMonthlySales: (params) => api.get('/dashboard/sales/monthly', { params }),
  getTopProducts: (params) => api.get('/dashboard/sales/top-products', { params }),
  getTopCustomers: (params) => api.get('/dashboard/sales/top-customers', { params }),
  getLowStock: () => api.get('/dashboard/inventory/low-stock'),
  getInventoryMovements: (params) => api.get('/dashboard/inventory/movements', { params }),
  getReceivables: () => api.get('/dashboard/financial/receivables'),
  exportReport: (params) => api.get('/dashboard/reports/export', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingCompanies: () => api.get('/admin/companies/pending'),
  getPendingUsers: () => api.get('/admin/users/pending'),
  approveCompany: (id) => api.post(`/admin/companies/${id}/approve`),
  approveUser: (id) => api.post(`/admin/users/${id}/approve`),
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUsage: (params) => api.get('/admin/usage', { params }),
  getLogs: (params) => api.get('/admin/logs', { params }),
  getSystemInfo: () => api.get('/admin/system/info'),
};

// Export default API instance
export default api;
