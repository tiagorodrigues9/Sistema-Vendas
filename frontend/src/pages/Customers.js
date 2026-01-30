import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, User, Mail, Phone, MapPin, Check } from 'lucide-react';

const Customers = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    document: '',
    address: '',
    neighborhood: '',
    city: ''
  });

  const [customers, setCustomers] = useState([
    {
      id: 1,
      fullName: 'João Silva',
      document: '123.456.789-00',
      address: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      isDeleted: false
    },
    {
      id: 2,
      fullName: 'Maria Santos',
      document: '987.654.321-00',
      address: 'Av. Principal, 456',
      neighborhood: 'Jardim',
      city: 'Rio de Janeiro',
      isDeleted: false
    }
  ]);

  const [deletedCustomers, setDeletedCustomers] = useState([
    {
      id: 3,
      fullName: 'Antigo Cliente',
      document: '111.222.333-44',
      address: 'Rua Antiga, 789',
      neighborhood: 'Velho',
      city: 'Belo Horizonte',
      isDeleted: true
    }
  ]);

  const filteredCustomers = customers.filter(customer =>
    !customer.isDeleted &&
    (customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.document.includes(searchTerm))
  );

  const filteredDeletedCustomers = deletedCustomers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.document.includes(searchTerm)
  );

  const detectDocumentType = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleanValue.length === 14) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(customers.map(customer =>
        customer.id === editingCustomer.id
          ? { ...customer, ...formData }
          : customer
      ));
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        isDeleted: false
      };
      setCustomers([...customers, newCustomer]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      document: '',
      address: '',
      neighborhood: '',
      city: ''
    });
    setShowForm(false);
    setEditingCustomer(null);
  };

  const editCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      document: customer.document,
      address: customer.address,
      neighborhood: customer.neighborhood,
      city: customer.city
    });
    setShowForm(true);
  };

  const deleteCustomer = (customer) => {
    setCustomers(customers.filter(c => c.id !== customer.id));
    setDeletedCustomers([...deletedCustomers, { ...customer, isDeleted: true }]);
  };

  const restoreCustomer = (customer) => {
    setDeletedCustomers(deletedCustomers.filter(c => c.id !== customer.id));
    setCustomers([...customers, { ...customer, isDeleted: false }]);
  };

  const permanentDelete = (customer) => {
    setDeletedCustomers(deletedCustomers.filter(c => c.id !== customer.id));
  };

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`btn ${showTrash ? 'btn-warning' : 'btn-secondary'}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {showTrash ? 'Ver Ativos' : 'Lixeira'}
          </button>
          {!showTrash && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Cliente
            </button>
          )}
        </div>
      </div>

      {/* Formulário de Cadastro/Edição */}
      {showForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="input"
                    placeholder="Nome completo do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF/CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: detectDocumentType(e.target.value)})}
                    className="input"
                    placeholder="CPF ou CNPJ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Endereço *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="input"
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    className="input"
                    placeholder="Bairro"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="input"
                    placeholder="Cidade"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF/CNPJ..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {showTrash ? 'Clientes na Lixeira' : 'Clientes Ativos'}
          </h3>
        </div>
        <div className="card-content">
          {!showTrash && filteredCustomers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum cliente encontrado</p>
          ) : showTrash && filteredDeletedCustomers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum cliente na lixeira</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CPF/CNPJ</th>
                    <th className="text-left py-3 px-4">Endereço</th>
                    <th className="text-left py-3 px-4">Bairro</th>
                    <th className="text-left py-3 px-4">Cidade</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {!showTrash && filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.document}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.address}
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.neighborhood}</td>
                      <td className="py-3 px-4">{customer.city}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editCustomer(customer)}
                            className="btn btn-primary btn-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer)}
                            className="btn btn-error btn-sm"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {showTrash && filteredDeletedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b bg-red-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.document}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.address}
                        </div>
                      </td>
                      <td className="py-3 px-4">{customer.neighborhood}</td>
                      <td className="py-3 px-4">{customer.city}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => restoreCustomer(customer)}
                            className="btn btn-success btn-sm"
                            title="Restaurar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => permanentDelete(customer)}
                            className="btn btn-error btn-sm"
                            title="Excluir Permanentemente"
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
    </div>
  );
};

export default Customers;
