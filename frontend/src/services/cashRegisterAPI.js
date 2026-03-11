import api from './api';

export const cashRegisterAPI = {
  // Abrir caixa
  open: async (data) => {
    const response = await api.put('/companies/cash-register/open', data);
    return response.data;
  },

  // Fechar caixa
  close: async (id, data) => {
    const response = await api.put('/companies/cash-register/close', data);
    return response.data;
  },

  // Listar histórico de caixas
  getAll: async (params = {}) => {
    const response = await api.get('/cash-register', { params });
    return response.data;
  },

  // Buscar caixa por ID
  getById: async (id) => {
    const response = await api.get(`/cash-register/${id}`);
    return response.data;
  },

  // Reabrir caixa
  reopen: async (id) => {
    const response = await api.post(`/cash-register/reopen/${id}`);
    return response.data;
  }
};
