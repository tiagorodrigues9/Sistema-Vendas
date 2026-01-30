import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, BarChart3, Download, Check, PlusCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    barcode: '',
    description: '',
    brand: '',
    group: '',
    subgroup: '',
    quantity: 0,
    unit: 'UND',
    costPrice: 0,
    salePrice: 0,
    minStock: 0
  });
  
  const [stockData, setStockData] = useState({
    quantity: 0,
    justification: ''
  });

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.group?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatar valor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Obter status do estoque
  const getStockStatus = (product) => {
    if (product.quantity <= 0) return { color: 'text-red-600 bg-red-100', text: 'Sem Estoque' };
    if (product.quantity <= product.minStock) return { color: 'text-yellow-600 bg-yellow-100', text: 'Estoque Baixo' };
    return { color: 'text-green-600 bg-green-100', text: 'Em Estoque' };
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      barcode: '',
      description: '',
      brand: '',
      group: '',
      subgroup: '',
      quantity: 0,
      unit: 'UND',
      costPrice: 0,
      salePrice: 0,
      minStock: 0
    });
    setEditingProduct(null);
  };

  // Abrir formulário
  const openForm = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode || '',
        description: product.description || '',
        brand: product.brand || '',
        group: product.group || '',
        subgroup: product.subgroup || '',
        quantity: product.quantity || 0,
        unit: product.unit || 'UND',
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        minStock: product.minStock || 0
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  // Salvar produto
  const handleSave = async () => {
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, formData);
        toast.success('Produto atualizado com sucesso');
      } else {
        await productsAPI.create(formData);
        toast.success('Produto criado com sucesso');
      }
      
      setShowForm(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  // Excluir produto
  const handleDelete = async (productId) => {
    try {
      await productsAPI.delete(productId);
      toast.success('Produto excluído com sucesso');
      loadProducts();
      setShowTrash(false);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  // Ajustar estoque
  const handleStockAdjustment = async () => {
    try {
      await productsAPI.adjustStock(selectedProduct._id, stockData);
      toast.success('Estoque ajustado com sucesso');
      setShowStockModal(false);
      setStockData({ quantity: 0, justification: '' });
      loadProducts();
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast.error('Erro ao ajustar estoque');
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
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => openForm()}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por código, descrição, marca ou grupo..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lista de Produtos</h3>
        </div>
        <div className="card-content">
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código</th>
                    <th className="text-left py-3 px-4">Descrição</th>
                    <th className="text-left py-3 px-4">Marca</th>
                    <th className="text-left py-3 px-4">Grupo</th>
                    <th className="text-right py-3 px-4">Estoque</th>
                    <th className="text-right py-3 px-4">Preço Custo</th>
                    <th className="text-right py-3 px-4">Preço Venda</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2 text-gray-400" />
                            {product.barcode || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{product.description}</td>
                        <td className="py-3 px-4">{product.brand || 'N/A'}</td>
                        <td className="py-3 px-4">{product.group || 'N/A'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <span className="font-medium">{product.quantity}</span>
                            <span className="text-gray-500 ml-1">{product.unit}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{formatCurrency(product.costPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(product.salePrice)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openForm(product)}
                              className="btn btn-primary btn-sm"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowStockModal(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="Ajustar Estoque"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowTrash(true);
                              }}
                              className="btn btn-danger btn-sm"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <select
                    className="input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="UND">UNIDADE</option>
                    <option value="KG">QUILOGRAMA</option>
                    <option value="LT">LITRO</option>
                    <option value="CX">CAIXA</option>
                    <option value="FD">FARDO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subgrupo
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.subgroup}
                    onChange={(e) => setFormData({ ...formData, subgroup: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Custo
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!formData.description}
              >
                {editingProduct ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Ajustar Estoque</h3>
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setStockData({ quantity: 0, justification: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Produto: <span className="font-medium">{selectedProduct.description}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Estoque Atual: <span className="font-medium">{selectedProduct.quantity} {selectedProduct.unit}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  className="input"
                  value={stockData.quantity}
                  onChange={(e) => setStockData({ ...stockData, quantity: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justificativa
                </label>
                <textarea
                  className="input"
                  rows="3"
                  value={stockData.justification}
                  onChange={(e) => setStockData({ ...stockData, justification: e.target.value })}
                  placeholder="Motivo do ajuste..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setStockData({ quantity: 0, justification: '' });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleStockAdjustment}
                className="btn btn-primary"
                disabled={!stockData.quantity || !stockData.justification}
              >
                Ajustar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showTrash && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o produto "<span className="font-medium">{selectedProduct.description}</span>"? 
              Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTrash(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(selectedProduct._id)}
                className="btn btn-danger"
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

export default Products;
