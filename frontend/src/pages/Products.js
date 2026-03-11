import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, BarChart3, Download, Check, PlusCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { productsAPI } from '../services/api';
import { brandsAPI } from '../services/brandsAPI';
import { productGroupsAPI } from '../services/productGroupsAPI';
import { productSubgroupsAPI } from '../services/productSubgroupsAPI';
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
  
  // Estados para cadastros auxiliares
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  
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
      console.log('Carregando produtos...');
      const response = await productsAPI.getAll();
      console.log('Products response:', response);
      console.log('Products data:', response.data);
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar cadastros auxiliares
  const loadAuxData = async () => {
    try {
      console.log('Carregando dados auxiliares...');
      const [brandsRes, groupsRes, subgroupsRes] = await Promise.all([
        brandsAPI.getAll(),
        productGroupsAPI.getAll(),
        productSubgroupsAPI.getAll()
      ]);
      
      console.log('Brands response:', brandsRes);
      console.log('Groups response:', groupsRes);
      console.log('Subgroups response:', subgroupsRes);
      
      setBrands(brandsRes.brands || []);
      setGroups(groupsRes.groups || []);
      setSubgroups(subgroupsRes.subgroups || []);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAuxData();
  }, []);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProducts(), loadAuxData()]);
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Função para obter nome da marca pelo ID
  const getBrandName = (brandId) => {
    if (!brandId) return 'N/A';
    const brand = brands.find(b => b._id === brandId);
    return brand ? brand.name : 'N/A';
  };

  // Função para obter nome do grupo pelo ID
  const getGroupName = (groupId) => {
    if (!groupId) return 'N/A';
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'N/A';
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBrandName(product.brand)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getGroupName(product.group)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estado para controlar o valor digitado nos campos
  const [costPriceInput, setCostPriceInput] = useState('');
  const [salePriceInput, setSalePriceInput] = useState('');
  const [stockQuantityInput, setStockQuantityInput] = useState('');

  // Formatar valor monetário para input
  const formatCurrencyInput = (value) => {
    if (!value || value === '') return '';
    // Remove tudo que não é número ou vírgula/ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    // Se estiver vazio após limpeza, retorna vazio
    if (!cleanValue) return '';
    // Substitui vírgula por ponto para conversão
    const numericValue = cleanValue.replace(',', '.');
    // Verifica se é um número válido
    if (isNaN(numericValue) || numericValue === '.') return '';
    return numericValue;
  };

  // Formatar valor monetário para exibição
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Lidar com mudanças nos campos de preço
  const handleCostPriceChange = (e) => {
    const value = e.target.value;
    setCostPriceInput(value); // Salva o valor exato digitado
    
    // Se estiver vazio, define como 0
    if (value === '') {
      setFormData({ ...formData, costPrice: 0 });
      return;
    }
    
    // Remove tudo que não é número ou vírgula/ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    if (!cleanValue) {
      setFormData({ ...formData, costPrice: 0 });
      return;
    }
    
    // Substitui vírgula por ponto para conversão
    const numericValue = cleanValue.replace(',', '.');
    
    // Verifica se é um número válido
    if (isNaN(numericValue) || numericValue === '.') {
      setFormData({ ...formData, costPrice: 0 });
    } else {
      setFormData({ ...formData, costPrice: parseFloat(numericValue) });
    }
  };

  const handleSalePriceChange = (e) => {
    const value = e.target.value;
    setSalePriceInput(value); // Salva o valor exato digitado
    
    // Se estiver vazio, define como 0
    if (value === '') {
      setFormData({ ...formData, salePrice: 0 });
      return;
    }
    
    // Remove tudo que não é número ou vírgula/ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    if (!cleanValue) {
      setFormData({ ...formData, salePrice: 0 });
      return;
    }
    
    // Substitui vírgula por ponto para conversão
    const numericValue = cleanValue.replace(',', '.');
    
    // Verifica se é um número válido
    if (isNaN(numericValue) || numericValue === '.') {
      setFormData({ ...formData, salePrice: 0 });
    } else {
      setFormData({ ...formData, salePrice: parseFloat(numericValue) });
    }
  };

  // Lidar com mudanças no campo de quantidade do estoque
  const handleStockQuantityChange = (e) => {
    const value = e.target.value;
    setStockQuantityInput(value); // Salva o valor exato digitado
    
    // Se estiver vazio, define como 0
    if (value === '') {
      setStockData({ ...stockData, quantity: 0 });
      return;
    }
    
    // Verifica se é um número válido (permite negativo)
    const numericValue = Number(value);
    
    // Se for um número válido, usa ele
    if (!isNaN(numericValue)) {
      setStockData({ ...stockData, quantity: numericValue });
    }
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
    setCostPriceInput('');
    setSalePriceInput('');
    setStockQuantityInput('');
    setEditingProduct(null);
  };

  // Carregar subgrupos por grupo
  const loadSubgroupsByGroup = async (groupId) => {
    try {
      const response = await productSubgroupsAPI.getByGroup(groupId);
      setSubgroups(response || []);
    } catch (error) {
      console.error('Erro ao carregar subgrupos:', error);
    }
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
      
      // Define os valores dos inputs de preço
      setCostPriceInput(product.costPrice ? product.costPrice.toString().replace('.', ',') : '');
      setSalePriceInput(product.salePrice ? product.salePrice.toString().replace('.', ',') : '');
      
      // Carregar subgrupos do grupo selecionado
      if (product.group) {
        loadSubgroupsByGroup(product.group);
      }
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
      // Envia os dados no formato esperado pelo backend
      await productsAPI.adjustStock(selectedProduct._id, {
        newQuantity: stockData.quantity,
        reason: stockData.justification
      });
      toast.success('Estoque ajustado com sucesso');
      setShowStockModal(false);
      setStockData({ quantity: 0, justification: '' });
      setStockQuantityInput('');
      loadProducts();
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      
      // Mostra mensagem de erro específica do backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao ajustar estoque');
      }
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
            <span className="hidden sm:inline">Novo Produto</span>
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
              placeholder="Buscar por código, descrição, marca ou grupo..."
              className="input pl-10 w-full h-10"
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
                        <td className="py-3 px-4">{getBrandName(product.brand)}</td>
                        <td className="py-3 px-4">{getGroupName(product.group)}</td>
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
                              className="btn btn-primary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setStockData({ quantity: 0, justification: '' });
                                setStockQuantityInput('');
                                setShowStockModal(true);
                              }}
                              className="btn btn-secondary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                              title="Ajustar Estoque"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
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
                    Marca
                  </label>
                  <select
                    className="input"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="">Selecione uma marca</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo
                  </label>
                  <select
                    className="input"
                    value={formData.group}
                    onChange={(e) => {
                      const newGroup = e.target.value;
                      setFormData({ ...formData, group: newGroup, subgroup: '' });
                      loadSubgroupsByGroup(newGroup);
                    }}
                  >
                    <option value="">Selecione um grupo</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subgrupo
                  </label>
                  <select
                    className="input"
                    value={formData.subgroup}
                    onChange={(e) => setFormData({ ...formData, subgroup: e.target.value })}
                    disabled={!formData.group}
                  >
                    <option value="">Selecione um subgrupo</option>
                    {subgroups.map((subgroup) => (
                      <option key={subgroup._id} value={subgroup._id}>
                        {subgroup.name}
                      </option>
                    ))}
                  </select>
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
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, quantity: value === '' ? 0 : Number(value) });
                    }}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.minStock || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, minStock: value === '' ? 0 : Number(value) });
                    }}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  {/* Campo vazio para alinhamento */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Custo
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={costPriceInput}
                    onChange={handleCostPriceChange}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={salePriceInput}
                    onChange={handleSalePriceChange}
                    min="0"
                    step="0.01"
                    placeholder="0,00"
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
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
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
                  setStockQuantityInput('');
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
                  type="text"
                  className="input"
                  value={stockQuantityInput}
                  onChange={handleStockQuantityChange}
                  placeholder="0 (positivo para adicionar, negativo para remover)"
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
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleStockAdjustment}
                className="btn btn-primary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
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
                className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(selectedProduct._id)}
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

export default Products;
