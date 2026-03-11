import api from './api';

export const suppliersAPI = {
  // Listar fornecedores
  getAll: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  // Buscar fornecedor por ID
  getById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Criar fornecedor
  create: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  // Atualizar fornecedor
  update: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  // Excluir fornecedor
  delete: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  // Restaurar fornecedor
  restore: async (id) => {
    const response = await api.put(`/suppliers/${id}/restore`);
    return response.data;
  }
};
