import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { productGroupsAPI } from '../services/productGroupsAPI';
import toast from 'react-hot-toast';

const ProductGroups = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [groups, setGroups] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Carregar grupos
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await productGroupsAPI.getAll();
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar grupos');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Filtrar grupos
  const filteredGroups = searchTerm.trim() === '' 
    ? groups 
    : groups.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingGroup(null);
  };

  // Abrir formulário
  const openForm = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name || '',
        description: group.description || ''
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  // Salvar grupo
  const handleSave = async () => {
    try {
      if (editingGroup) {
        await productGroupsAPI.update(editingGroup._id, formData);
        toast.success('Grupo atualizado com sucesso');
      } else {
        await productGroupsAPI.create(formData);
        toast.success('Grupo criado com sucesso');
      }
      
      setShowForm(false);
      resetForm();
      loadGroups();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      
      // Tratar erros de validação específicos
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error('Erro de validação. Verifique os dados informados.');
        }
      } else {
        toast.error('Erro ao salvar grupo');
      }
    }
  };

  // Excluir grupo
  const handleDelete = async (groupId) => {
    try {
      await productGroupsAPI.delete(groupId);
      toast.success('Grupo excluído com sucesso');
      loadGroups();
      setShowTrash(false);
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  if (loading) {
    return (
      <div className="container-responsive">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Grupos de Produtos</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Atual.</span>
          </button>
          <button
            onClick={() => openForm()}
            className="btn btn-primary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Grupo</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content py-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              className="input pl-10 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Grupos */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lista de Grupos</h3>
        </div>
        <div className="card-content">
          {filteredGroups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm.trim() ? 'Nenhum grupo encontrado para esta pesquisa' : 'Nenhum grupo cadastrado'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Descrição</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <p className="font-medium">{group.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {group.description || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(group)}
                            className="btn btn-primary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroup(group);
                              setShowTrash(true);
                            }}
                            className="btn btn-danger h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do grupo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do grupo (opcional)"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                disabled={!formData.name}
              >
                {editingGroup ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showTrash && editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o grupo "<span className="font-medium">{editingGroup.name}</span>"? 
              Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTrash(false)}
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(editingGroup._id)}
                className="btn btn-danger h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGroups;
