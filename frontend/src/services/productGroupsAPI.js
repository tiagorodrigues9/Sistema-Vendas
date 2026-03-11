import api from './api';

export const productGroupsAPI = {
  // Listar grupos
  getAll: async (params = {}) => {
    const response = await api.get('/product-groups', { params });
    return response.data;
  },

  // Buscar grupo por ID
  getById: async (id) => {
    const response = await api.get(`/product-groups/${id}`);
    return response.data;
  },

  // Criar grupo
  create: async (data) => {
    const response = await api.post('/product-groups', data);
    return response.data;
  },

  // Atualizar grupo
  update: async (id, data) => {
    const response = await api.put(`/product-groups/${id}`, data);
    return response.data;
  },

  // Excluir grupo
  delete: async (id) => {
    const response = await api.delete(`/product-groups/${id}`);
    return response.data;
  }
};
