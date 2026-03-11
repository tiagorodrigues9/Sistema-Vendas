import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Phone, Mail, MapPin, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { suppliersAPI } from '../services/suppliersAPI';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [suppliers, setSuppliers] = useState([]);
  const [deletedSuppliers, setDeletedSuppliers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contact: {
      name: '',
      email: '',
      phone: ''
    },
    notes: ''
  });

  // Carregar fornecedores
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      setSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Filtrar fornecedores
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm)
  );

  // Formatar CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    return cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  // Formatar telefone
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return phone;
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      contact: {
        name: '',
        email: '',
        phone: ''
      },
      notes: ''
    });
    setEditingSupplier(null);
  };

  // Abrir formulário
  const openForm = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        cnpj: supplier.cnpj || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        contact: supplier.contact || {
          name: '',
          email: '',
          phone: ''
        },
        notes: supplier.notes || ''
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  // Salvar fornecedor
  const handleSave = async () => {
    try {
      if (!formData.name) {
        toast.error('Preencha o nome do fornecedor');
        return;
      }

      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier._id, formData);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await suppliersAPI.create(formData);
        toast.success('Fornecedor criado com sucesso');
      }
      
      setShowForm(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    }
  };

  // Excluir fornecedor
  const handleDelete = async (supplierId) => {
    try {
      await suppliersAPI.delete(supplierId);
      toast.success('Fornecedor excluído com sucesso');
      loadSuppliers();
      setShowTrash(false);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
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
        <h1 className="text-2xl font-bold">Fornecedores</h1>
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
            <span className="hidden sm:inline">Novo Fornecedor</span>
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
              placeholder="Buscar por nome, CNPJ ou telefone..."
              className="input pl-10 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lista de Fornecedores</h3>
        </div>
        <div className="card-content">
          {filteredSuppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CNPJ</th>
                    <th className="text-left py-3 px-4">Telefone</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Cidade/UF</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatCNPJ(supplier.cnpj)}</td>
                      <td className="py-3 px-4">{formatPhone(supplier.phone)}</td>
                      <td className="py-3 px-4">{supplier.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {supplier.address?.city ? `${supplier.address.city}/${supplier.address.state}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(supplier)}
                            className="btn btn-primary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do fornecedor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/[^\d]/g, '') })}
                    placeholder="00.000.000/0000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d]/g, '') })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@fornecedor.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      placeholder="Rua"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.number}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, number: e.target.value }
                      })}
                      placeholder="Número"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.complement}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, complement: e.target.value }
                      })}
                      placeholder="Complemento"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, neighborhood: e.target.value }
                      })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value.toUpperCase() }
                      })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value.replace(/[^\d]/g, '') }
                      })}
                      placeholder="CEP"
                      maxLength={8}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contato
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.contact.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, name: e.target.value }
                      })}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      className="input"
                      value={formData.contact.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, email: e.target.value }
                      })}
                      placeholder="Email do contato"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={formData.contact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, phone: e.target.value.replace(/[^\d]/g, '') }
                      })}
                      placeholder="Telefone do contato"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o fornecedor"
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
                {editingSupplier ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showTrash && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o fornecedor "<span className="font-medium">{selectedSupplier.name}</span>"? 
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
                onClick={() => handleDelete(selectedSupplier._id)}
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

export default Suppliers;
