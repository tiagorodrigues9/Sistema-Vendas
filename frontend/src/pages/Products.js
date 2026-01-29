import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit, Trash2, RotateCcw, TrendingUp, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerStock, handleSubmit: handleStockSubmit, formState: { errors: stockErrors } } = useForm();

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: { search, group: selectedGroup, deleted: showDeleted }
      });
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup, showDeleted]);

  const loadGroups = async () => {
    try {
      const response = await api.get('/products/groups/list');
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadGroups();
  }, [loadProducts]);

  const onSubmit = async (data) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await api.post('/products', data);
        toast.success('Produto criado com sucesso!');
      }
      setShowForm(false);
      setEditingProduct(null);
      reset();
      loadProducts();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const onStockSubmit = async (data) => {
    try {
      await api.post(`/products/${stockProduct._id}/stock`, data);
      toast.success('Estoque adicionado com sucesso!');
      setShowStockForm(false);
      setStockProduct(null);
      loadProducts();
    } catch (error) {
      toast.error('Erro ao adicionar estoque');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto excluído com sucesso!');
      loadProducts();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const restoreProduct = async (id) => {
    try {
      await api.put(`/products/${id}/restore`);
      toast.success('Produto restaurado com sucesso!');
      loadProducts();
    } catch (error) {
      toast.error('Erro ao restaurar produto');
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    reset(product);
    setShowForm(true);
  };

  const addStock = (product) => {
    setStockProduct(product);
    setShowStockForm(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStockStatus = (product) => {
    if (product.quantity <= product.minQuantity) {
      return { status: 'critical', color: 'text-red-600 bg-red-50', icon: AlertCircle };
    } else if (product.quantity <= product.minQuantity * 1.5) {
      return { status: 'low', color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle };
    } else {
      return { status: 'good', color: 'text-green-600 bg-green-50', icon: CheckCircle };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p.quantity <= p.minQuantity).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Grupos</p>
              <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10 h-12"
              />
            </div>
          </div>
          
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="form-input h-12 min-w-48"
          >
            <option value="">Todos os grupos</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`btn h-12 ${showDeleted ? 'btn-danger' : 'btn-outline'}`}
          >
            <Trash2 className="w-5 h-5" />
            {showDeleted ? 'Ocultar' : 'Mostrar'} Excluídos
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Grupo</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {product.description?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.description}</p>
                          <p className="text-sm text-gray-500">{product.code}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {product.group || 'Sem grupo'}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{product.quantity}</span>
                        <span className="text-sm text-gray-500">{product.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {stockStatus.status === 'critical' ? 'Crítico' : 
                         stockStatus.status === 'low' ? 'Baixo' : 'Normal'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addStock(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Adicionar Estoque"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {product.deleted ? (
                          <button
                            onClick={() => restoreProduct(product._id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Restaurar"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhum produto encontrado</p>
              <p className="text-gray-400">Tente ajustar os filtros ou adicionar um novo produto</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Código</label>
                  <input
                    {...register('code', { required: 'Código é obrigatório' })}
                    className="form-input"
                    placeholder="EX: 001"
                  />
                  {errors.code && <p className="form-error">{errors.code.message}</p>}
                </div>

                <div>
                  <label className="form-label">Descrição</label>
                  <input
                    {...register('description', { required: 'Descrição é obrigatória' })}
                    className="form-input"
                    placeholder="Nome do produto"
                  />
                  {errors.description && <p className="form-error">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="form-label">Grupo</label>
                  <input
                    {...register('group')}
                    className="form-input"
                    placeholder="Categoria do produto"
                  />
                </div>

                <div>
                  <label className="form-label">Unidade</label>
                  <select {...register('unit')} className="form-input">
                    <option value="UN">Unidade</option>
                    <option value="KG">Quilograma</option>
                    <option value="LT">Litro</option>
                    <option value="CX">Caixa</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Preço de Venda</label>
                  <input
                    {...register('price', { required: 'Preço é obrigatório' })}
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="form-error">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="form-label">Custo</label>
                  <input
                    {...register('cost')}
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="form-label">Quantidade Mínima</label>
                  <input
                    {...register('minQuantity', { required: 'Quantidade mínima é obrigatória' })}
                    type="number"
                    className="form-input"
                    placeholder="10"
                  />
                  {errors.minQuantity && <p className="form-error">{errors.minQuantity.message}</p>}
                </div>

                <div>
                  <label className="form-label">Quantidade Inicial</label>
                  <input
                    {...register('quantity')}
                    type="number"
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    reset();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProduct ? 'Atualizar' : 'Cadastrar'} Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Form Modal */}
      {showStockForm && stockProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Adicionar Estoque</h2>
              <p className="text-gray-600 mt-1">{stockProduct.description}</p>
            </div>
            
            <form onSubmit={handleStockSubmit(onStockSubmit)} className="p-6 space-y-6">
              <div>
                <label className="form-label">Quantidade</label>
                <input
                  {...registerStock('quantity', { required: 'Quantidade é obrigatória' })}
                  type="number"
                  className="form-input"
                  placeholder="0"
                />
                {stockErrors.quantity && <p className="form-error">{stockErrors.quantity.message}</p>}
              </div>

              <div>
                <label className="form-label">Motivo</label>
                <textarea
                  {...registerStock('justification')}
                  className="form-input"
                  rows={3}
                  placeholder="Motivo da entrada de estoque"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockForm(false);
                    setStockProduct(null);
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Adicionar Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
