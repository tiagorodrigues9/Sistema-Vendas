import api from './api';

export const productSubgroupsAPI = {
  // Listar subgrupos
  getAll: async (params = {}) => {
    const response = await api.get('/product-subgroups', { params });
    return response.data;
  },

  // Listar subgrupos por grupo
  getByGroup: async (groupId) => {
    const response = await api.get(`/product-subgroups/by-group/${groupId}`);
    return response.data;
  },

  // Buscar subgrupo por ID
  getById: async (id) => {
    const response = await api.get(`/product-subgroups/${id}`);
    return response.data;
  },

  // Criar subgrupo
  create: async (data) => {
    const response = await api.post('/product-subgroups', data);
    return response.data;
  },

  // Atualizar subgrupo
  update: async (id, data) => {
    const response = await api.put(`/product-subgroups/${id}`, data);
    return response.data;
  },

  // Excluir subgrupo
  delete: async (id) => {
    const response = await api.delete(`/product-subgroups/${id}`);
    return response.data;
  }
};
