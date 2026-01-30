import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
  getByCNPJ: (cnpj) => api.get(`/companies/cnpj/${cnpj}`),
  getAll: (params) => api.get('/companies', { params }),
  getPending: () => api.get('/companies/pending'),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  approve: (id) => api.put(`/companies/${id}/approve`),
  deactivate: (id) => api.put(`/companies/${id}/deactivate`),
  delete: (id) => api.delete(`/companies/${id}`),
  openCashRegister: (data) => api.put('/companies/cash-register/open', data),
  closeCashRegister: () => api.put('/companies/cash-register/close'),
  adjustCashRegister: (data) => api.put('/companies/cash-register/adjust', data),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getGroups: () => api.get('/products/groups'),
  getTrash: (params) => api.get('/products/trash', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  addStock: (id, data) => api.put(`/products/${id}/stock`, data),
  adjustStock: (id, data) => api.put(`/products/${id}/adjust-stock`, data),
  restore: (id) => api.put(`/products/${id}/restore`),
  delete: (id) => api.delete(`/products/${id}`),
  deletePermanent: (id) => api.delete(`/products/${id}/permanent`),
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
};

// Entries API
export const entriesAPI = {
  getAll: (params) => api.get('/entries', { params }),
  getById: (id) => api.get(`/entries/${id}`),
  create: (data) => api.post('/entries', data),
  update: (id, data) => api.put(`/entries/${id}`, data),
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
