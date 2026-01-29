import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Entries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showItemsForm, setShowItemsForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [entryItems, setEntryItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerItem, handleSubmit: handleItemSubmit, formState: { errors: itemErrors } } = useForm();

  useEffect(() => {
    loadEntries();
    loadProducts();
  }, [search]);

  const loadEntries = async () => {
    try {
      const response = await api.get('/entries', { params: { search } });
      setEntries(response.data.entries);
    } catch (error) {
      toast.error('Erro ao carregar entradas');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/entries', {
        ...data,
        items: entryItems
      });
      
      toast.success('Entrada realizada com sucesso!');
      setShowForm(false);
      setShowItemsForm(false);
      setCurrentEntry(null);
      setEntryItems([]);
      reset();
      loadEntries();
    } catch (error) {
      toast.error('Erro ao realizar entrada');
    }
  };

  const onItemSubmit = (data) => {
    const product = products.find(p => p._id === data.product);
    if (!product) return;

    const item = {
      product: product._id,
      description: product.description,
      quantity: parseFloat(data.quantity),
      unitCost: parseFloat(data.unitCost),
      totalCost: parseFloat(data.quantity) * parseFloat(data.unitCost),
      justification: data.justification
    };

    setEntryItems([...entryItems, item]);
    resetItem();
  };

  const removeItem = (index) => {
    setEntryItems(entryItems.filter((_, i) => i !== index));
  };

  const resetItem = () => {
    registerItem('product', '');
    registerItem('quantity', '');
    registerItem('unitCost', '');
    registerItem('justification', '');
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrada?')) return;
    
    try {
      await api.delete(`/entries/${id}`);
      toast.success('Entrada excluída com sucesso!');
      loadEntries();
    } catch (error) {
      toast.error('Erro ao excluir entrada');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Entrada de Produtos</h1>
        <button
          onClick={() => {
            setShowForm(true);
            reset();
            setEntryItems([]);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nova Entrada
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número da NF ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Nova Entrada</h2>
          
          {!showItemsForm ? (
            <form onSubmit={handleSubmit(() => setShowItemsForm(true))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Número da NF</label>
                <input
                  {...register('nfNumber', { required: 'Número da NF é obrigatório' })}
                  className="form-input"
                  placeholder="000000"
                />
                {errors.nfNumber && <p className="form-error">{errors.nfNumber.message}</p>}
              </div>

              <div>
                <label className="form-label">Valor da NF</label>
                <input
                  {...register('nfValue', { required: 'Valor da NF é obrigatório' })}
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0,00"
                />
                {errors.nfValue && <p className="form-error">{errors.nfValue.message}</p>}
              </div>

              <div>
                <label className="form-label">Nome do Fornecedor</label>
                <input
                  {...register('supplier.name', { required: 'Nome do fornecedor é obrigatório' })}
                  className="form-input"
                  placeholder="Nome do fornecedor"
                />
                {errors.supplier?.name && <p className="form-error">{errors.supplier.name.message}</p>}
              </div>

              <div>
                <label className="form-label">CNPJ do Fornecedor</label>
                <input
                  {...register('supplier.cnpj')}
                  className="form-input"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="btn btn-primary">
                  Continuar para Itens
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h3 className="font-semibold mb-4">Itens da Entrada</h3>
              
              {/* Add Item Form */}
              <form onSubmit={handleItemSubmit(onItemSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Produto</label>
                  <select {...registerItem('product', { required: 'Produto é obrigatório' })} className="form-input">
                    <option value="">Selecione um produto</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.description}
                      </option>
                    ))}
                  </select>
                  {itemErrors.product && <p className="form-error">{itemErrors.product.message}</p>}
                </div>

                <div>
                  <label className="form-label">Quantidade</label>
                  <input
                    {...registerItem('quantity', { required: 'Quantidade é obrigatória' })}
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0"
                  />
                  {itemErrors.quantity && <p className="form-error">{itemErrors.quantity.message}</p>}
                </div>

                <div>
                  <label className="form-label">Custo Unitário</label>
                  <input
                    {...registerItem('unitCost', { required: 'Custo unitário é obrigatório' })}
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0,00"
                  />
                  {itemErrors.unitCost && <p className="form-error">{itemErrors.unitCost.message}</p>}
                </div>

                <div>
                  <label className="form-label">Justificativa</label>
                  <input
                    {...registerItem('justification', { required: 'Justificativa é obrigatória' })}
                    className="form-input"
                    placeholder="Motivo da entrada"
                  />
                  {itemErrors.justification && <p className="form-error">{itemErrors.justification.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <button type="submit" className="btn btn-primary">
                    Adicionar Item
                  </button>
                </div>
              </form>

              {/* Items List */}
              {entryItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Itens Adicionados</h4>
                  <div className="space-y-2">
                    {entryItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} und x {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(item.totalCost)}</span>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-right">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(entryItems.reduce((sum, item) => sum + item.totalCost, 0))}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={entryItems.length === 0}
                  className="btn btn-primary"
                >
                  Finalizar Entrada
                </button>
                <button
                  onClick={() => {
                    setShowItemsForm(false);
                    setEntryItems([]);
                  }}
                  className="btn btn-outline"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setShowItemsForm(false);
                    setEntryItems([]);
                    reset();
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Valor NF</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="font-medium">{entry.entryNumber}</td>
                  <td>{new Date(entry.entryDate).toLocaleDateString('pt-BR')}</td>
                  <td>{entry.supplier.name}</td>
                  <td>{formatCurrency(entry.nfValue)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                      entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.status === 'completed' ? 'Concluída' :
                       entry.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteEntry(entry._id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {entries.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              Nenhuma entrada encontrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Entries;
