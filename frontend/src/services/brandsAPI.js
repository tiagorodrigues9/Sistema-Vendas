import api from './api';

export const brandsAPI = {
  // Listar marcas
  getAll: async (params = {}) => {
    const response = await api.get('/brands', { params });
    return response.data;
  },

  // Buscar marca por ID
  getById: async (id) => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  // Criar marca
  create: async (data) => {
    const response = await api.post('/brands', data);
    return response.data;
  },

  // Atualizar marca
  update: async (id, data) => {
    const response = await api.put(`/brands/${id}`, data);
    return response.data;
  },

  // Excluir marca
  delete: async (id) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  }
};
