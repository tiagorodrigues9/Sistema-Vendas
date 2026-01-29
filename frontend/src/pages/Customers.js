import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadCustomers();
  }, [search, showDeleted]);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers', {
        params: { search, deleted: showDeleted }
      });
      setCustomers(response.data.customers);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, data);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await api.post('/customers', data);
        toast.success('Cliente criado com sucesso!');
      }
      
      setShowForm(false);
      setEditingCustomer(null);
      reset();
      loadCustomers();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Cliente excluído com sucesso!');
      loadCustomers();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const restoreCustomer = async (id) => {
    try {
      await api.put(`/customers/${id}/restore`);
      toast.success('Cliente restaurado com sucesso!');
      loadCustomers();
    } catch (error) {
      toast.error('Erro ao restaurar cliente');
    }
  };

  const editCustomer = (customer) => {
    setEditingCustomer(customer);
    reset(customer);
    setShowForm(true);
  };

  const formatDocument = (doc) => {
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCustomer(null);
            reset();
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="mr-2"
            />
            Mostrar excluídos
          </label>
        </div>
      </div>

      {/* Customer Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Nome Completo</label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                className="form-input"
                placeholder="Nome do cliente"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="form-label">CPF/CNPJ</label>
              <input
                {...register('document', { required: 'Documento é obrigatório' })}
                className="form-input"
                placeholder="000.000.000-00"
              />
              {errors.document && <p className="form-error">{errors.document.message}</p>}
            </div>

            <div>
              <label className="form-label">Telefone</label>
              <input
                {...register('phone')}
                className="form-input"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Email</label>
              <input
                {...register('email')}
                type="email"
                className="form-input"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Endereço</label>
              <input
                {...register('address.street', { required: 'Rua é obrigatória' })}
                className="form-input"
                placeholder="Rua, número"
              />
              {errors.address?.street && <p className="form-error">{errors.address.street.message}</p>}
            </div>

            <div>
              <label className="form-label">Bairro</label>
              <input
                {...register('address.neighborhood', { required: 'Bairro é obrigatório' })}
                className="form-input"
                placeholder="Bairro"
              />
              {errors.address?.neighborhood && <p className="form-error">{errors.address.neighborhood.message}</p>}
            </div>

            <div>
              <label className="form-label">Cidade</label>
              <input
                {...register('address.city', { required: 'Cidade é obrigatória' })}
                className="form-input"
                placeholder="Cidade"
              />
              {errors.address?.city && <p className="form-error">{errors.address.city.message}</p>}
            </div>

            <div>
              <label className="form-label">Estado</label>
              <input
                {...register('address.state', { required: 'Estado é obrigatório' })}
                className="form-input"
                placeholder="UF"
              />
              {errors.address?.state && <p className="form-error">{errors.address.state.message}</p>}
            </div>

            <div>
              <label className="form-label">CEP</label>
              <input
                {...register('address.zipCode')}
                className="form-input"
                placeholder="00000-000"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingCustomer ? 'Atualizar' : 'Cadastrar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                  reset();
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="font-medium">{customer.name}</td>
                  <td>{formatDocument(customer.document)}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.address.city}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editCustomer(customer)}
                        className="btn btn-sm btn-outline"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {customer.isDeleted ? (
                        <button
                          onClick={() => restoreCustomer(customer._id)}
                          className="btn btn-sm btn-success"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteCustomer(customer._id)}
                          className="btn btn-sm btn-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {customers.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              Nenhum cliente encontrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
