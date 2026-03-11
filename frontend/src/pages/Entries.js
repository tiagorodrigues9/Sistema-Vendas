import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, FileText, RefreshCw, Building2, ChevronDown, X } from 'lucide-react';
import { entriesAPI } from '../services/api';
import { productsAPI } from '../services/api';
import { suppliersAPI } from '../services/suppliersAPI';
import toast from 'react-hot-toast';

const Entries = () => {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  // Estados para busca de produtos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productQuantity, setProductQuantity] = useState(1);
  
  const [entryForm, setEntryForm] = useState({
    entryNumber: '',
    fiscalDocument: '',
    supplier: { name: '', cnpj: '', phone: '' },
    items: []
  });

  // Estado para controlar o valor digitado nos campos
  const [costPriceInput, setCostPriceInput] = useState('');
  const [salePriceInput, setSalePriceInput] = useState('');
  const [stockQuantityInput, setStockQuantityInput] = useState('');

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carregamento de dados...');
      
      const [entriesResponse, productsResponse, suppliersResponse] = await Promise.all([
        entriesAPI.getAll(),
        productsAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      
      console.log('Resposta da API de fornecedores:', suppliersResponse);
      console.log('Resposta da API de produtos:', productsResponse);
      console.log('Estrutura completa da resposta de produtos:', JSON.stringify(productsResponse, null, 2));
      
      // Acessar dados de forma segura com optional chaining
      setEntries(entriesResponse?.data?.entries || []);
      
      // CORREÇÃO: Acessar suppliers diretamente da resposta, não de data.suppliers
      const suppliersData = suppliersResponse?.suppliers || [];
      setSuppliers(suppliersData);
      
      // CORREÇÃO: Acessar produtos diretamente da resposta, não de data.products
      const productsData = productsResponse?.products || [];
      setProducts(productsData);
      
      // Log para depurar
      console.log('Fornecedores carregados:', suppliersData);
      console.log('Produtos carregados:', productsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setEntries([]);
      setProducts([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar item à entrada
  const addItemToEntry = (product) => {
    const newItem = {
      productId: product._id,
      description: product.description,
      quantity: 1,
      unitValue: product.costPrice || 0,
      totalValue: product.costPrice || 0
    };
    
    setEntryForm({
      ...entryForm,
      items: [...entryForm.items, newItem]
    });
  };

  // Remover item da entrada
  const removeItemFromEntry = (index) => {
    const newItems = entryForm.items.filter((_, i) => i !== index);
    setEntryForm({
      ...entryForm,
      items: newItems
    });
  };

  // Atualizar item da entrada
  const updateItemInEntry = (index, field, value) => {
    const newItems = [...entryForm.items];
    if (field === 'quantity') {
      // Permite digitar qualquer valor, só valida no final
      const parsedValue = value === '' ? '' : parseInt(value) || 1;
      newItems[index].quantity = parsedValue;
      if (parsedValue !== '') {
        newItems[index].totalValue = parsedValue * newItems[index].unitValue;
      }
    } else if (field === 'unitValue') {
      const parsedValue = value === '' ? '' : parseFloat(value) || 0;
      newItems[index].unitValue = parsedValue;
      if (parsedValue !== '' && newItems[index].quantity !== '') {
        newItems[index].totalValue = newItems[index].quantity * parsedValue;
      }
    }
    
    setEntryForm({
      ...entryForm,
      items: newItems
    });
  };

  // Calcular total da entrada
  const calculateTotal = () => {
    return entryForm.items.reduce((total, item) => total + item.totalValue, 0);
  };

  // Salvar entrada
  const handleSaveEntry = async () => {
    try {
      if (entryForm.items.length === 0) {
        toast.error('Adicione pelo menos um produto');
        return;
      }
      
      // CORREÇÃO: Estrutura esperada pelo backend
      const itemsParaBackend = entryForm.items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unitCost: item.unitValue,
        total: item.totalValue
      }));
      
      const entryData = {
        entryNumber: entryForm.entryNumber || `ENT-${Date.now()}`, // Gerar número automático se não existir
        fiscalDocument: entryForm.fiscalDocument || '',
        supplier: entryForm.supplier,
        invoiceValue: calculateTotal(),
        items: itemsParaBackend,
        company: null, // Será preenchido pelo middleware
        user: null, // Será preenchido pelo middleware
        notes: ''
      };

      console.log('entryNumber sendo enviado:', entryData.entryNumber);
      console.log('Dados completos:', entryData);

      const response = await entriesAPI.create(entryData);
      
      toast.success('Entrada registrada com sucesso');
      setShowNewEntry(false);
      
      // Resetar formulário
      setEntryForm({
        entryNumber: '',
        fiscalDocument: '',
        supplier: { name: '', cnpj: '', phone: '' },
        items: []
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      console.log('Resposta de erro:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erro ao salvar entrada');
    }
  };

  // Filtrar fornecedores
  const handleSupplierSearch = (term) => {
    setSupplierSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredSuppliers([]);
      setShowSupplierDropdown(false);
      return;
    }

    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(term.toLowerCase()) ||
      supplier.cnpj?.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredSuppliers(filtered);
    setShowSupplierDropdown(true);
  };

  // Selecionar fornecedor
  const selectSupplier = (supplier) => {
    setEntryForm({
      ...entryForm,
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        cnpj: supplier.cnpj,
        phone: supplier.phone
      }
    });
    setSupplierSearchTerm(supplier.name);
    setShowSupplierDropdown(false);
    setFilteredSuppliers([]);
  };

  // Limpar seleção de fornecedor
  const clearSupplier = () => {
    setEntryForm({
      ...entryForm,
      supplier: { name: '', cnpj: '', phone: '' }
    });
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setFilteredSuppliers([]);
  };

  // Filtrar produtos
  const handleProductSearch = (term) => {
    console.log('Buscando produtos com termo:', term);
    console.log('Produtos disponíveis:', products);
    console.log('Produtos filtrados antes:', filteredProducts);
    
    setProductSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredProducts([]);
      setShowProductDropdown(false);
      return;
    }

    const filtered = products.filter(product =>
      product.description?.toLowerCase().includes(term.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(term.toLowerCase()) ||
      product.brand?.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log('Produtos filtrados depois:', filtered);
    setFilteredProducts(filtered);
    setShowProductDropdown(true);
  };

  // Selecionar produto
  const selectProduct = (product) => {
    setProductSearchTerm(product.description);
    setShowProductDropdown(false);
    setFilteredProducts([]);
  };

  // Adicionar produto à entrada
  const addProductToEntry = (product) => {
    // Garante que productQuantity seja um número válido
    const quantity = productQuantity === '' ? 1 : parseInt(productQuantity) || 1;
    
    // Verificar se o produto já está na lista
    const existingItem = entryForm.items.find(item => item.productId === product._id);
    
    if (existingItem) {
      // Se já existe, apenas aumenta a quantidade
      const updatedItems = entryForm.items.map(item => 
        item.productId === product._id 
          ? { ...item, quantity: item.quantity + quantity, totalValue: (item.quantity + quantity) * item.unitValue }
          : item
      );
      setEntryForm({ ...entryForm, items: updatedItems });
    } else {
      // Se não existe, adiciona novo item
      const newItem = {
        productId: product._id,
        description: product.description,
        quantity: quantity,
        unitValue: product.costPrice || 0,
        totalValue: quantity * (product.costPrice || 0)
      };
      
      setEntryForm({
        ...entryForm,
        items: [...entryForm.items, newItem]
      });
    }
    
    // Limpar busca e resetar quantidade
    setProductSearchTerm('');
    setShowProductDropdown(false);
    setFilteredProducts([]);
    setProductQuantity(1);
  };

  // Limpar busca de produto
  const clearProductSearch = () => {
    setProductSearchTerm('');
    setShowProductDropdown(false);
    setFilteredProducts([]);
    // Não resetar a quantidade aqui - só resetar quando adicionar produto
  };

  useEffect(() => {
    loadData();
  }, []);

  // Excluir entrada
  const handleDeleteEntry = async (entryId, entryNumber) => {
    if (!window.confirm(`Tem certeza que deseja excluir a entrada ${entryNumber}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await entriesAPI.delete(entryId);
      toast.success('Entrada excluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      toast.error('Erro ao excluir entrada');
    }
  };

  // Concluir entrada
  const handleCompleteEntry = async (entryId) => {
    try {
      console.log('Tentando concluir entrada:', entryId);
      const response = await entriesAPI.complete(entryId);
      console.log('Resposta do backend:', response);
      toast.success('Entrada concluída com sucesso');
      setShowEntryDetail(false);
      loadData();
    } catch (error) {
      console.error('Erro ao concluir entrada:', error);
      toast.error('Erro ao concluir entrada');
    }
  };

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Filtrar entradas
  const filteredEntries = entries.filter(entry =>
    entry.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.fiscalDocument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar valor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Obter status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obter status text
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
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
        <h1 className="text-2xl font-bold">Entradas de Produtos</h1>
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
            onClick={() => setShowNewEntry(true)}
            className="btn btn-primary flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Entrada</span>
            <span className="sm:hidden">Nova</span>
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
              placeholder="Buscar por número, documento ou fornecedor..."
              className="input pl-10 w-full h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Entradas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Histórico de Entradas</h3>
        </div>
        <div className="card-content">
          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'Nenhuma entrada encontrada' : 'Nenhuma entrada registrada'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Número</th>
                    <th className="text-left py-3 px-4">Documento Fiscal</th>
                    <th className="text-left py-3 px-4">Fornecedor</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-right py-3 px-4">Valor Total</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          {entry.entryNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">{entry.fiscalDocument || 'N/A'}</td>
                      <td className="py-3 px-4">{entry.supplier?.name || 'N/A'}</td>
                      <td className="py-3 px-4">{formatDate(entry.createdAt)}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(entry.totalItems || entry.invoiceValue || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
                          {getStatusText(entry.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowEntryDetail(true);
                            }}
                            className="btn btn-primary h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                            title="Ver Detalhes"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {entry.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteEntry(entry._id, entry.entryNumber)}
                              className="btn btn-danger h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                              title="Excluir Entrada"
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
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Entrada */}
      {showEntryDetail && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detalhes da Entrada</h3>
              <button
                onClick={() => setShowEntryDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <div>
                <h4 className="font-medium mb-3">Informações da Entrada</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-500">Número</p>
                    <p className="font-medium">{selectedEntry.entryNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Documento Fiscal</p>
                    <p className="font-medium">{selectedEntry.fiscalDocument || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium">{formatDate(selectedEntry.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor Total</p>
                    <p className="font-medium">{formatCurrency(selectedEntry.totalItems || selectedEntry.invoiceValue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Responsável</p>
                    <p className="font-medium">{selectedEntry.user?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Fornecedor */}
              <div>
                <h4 className="font-medium mb-3">Fornecedor</h4>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">{selectedEntry.supplier?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CNPJ/CPF</p>
                      <p className="font-medium">{selectedEntry.supplier?.cnpj || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{selectedEntry.supplier?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itens da Entrada */}
              <div>
                <h4 className="font-medium mb-3">Itens da Entrada</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Produto</th>
                        <th className="text-right py-2 px-4">Quantidade</th>
                        <th className="text-right py-2 px-4">Valor Unit.</th>
                        <th className="text-right py-2 px-4">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntry.items?.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{item.productDescription || item.product?.description || 'N/A'}</td>
                          <td className="py-2 px-4 text-right">{item.quantity}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.unitCost || 0)}</td>
                          <td className="py-2 px-4 text-right font-medium">
                            {formatCurrency(item.total || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Status: <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedEntry.status)}`}>
                  {getStatusText(selectedEntry.status)}
                </span>
              </div>
              <div className="flex gap-3">
                {selectedEntry.status === 'pending' && (
                  <button
                    onClick={() => handleCompleteEntry(selectedEntry._id)}
                    className="btn btn-primary h-11 px-6 text-base"
                  >
                    Concluir Entrada
                  </button>
                )}
                <button
                  onClick={() => setShowEntryDetail(false)}
                  className="btn btn-secondary h-11 px-6 text-base"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Entrada */}
      {showNewEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Nova Entrada de Produtos</h3>
              <button
                onClick={() => setShowNewEntry(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <div>
                <h4 className="font-medium mb-3">Informações da Entrada</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número da Entrada
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={entryForm.entryNumber}
                      onChange={(e) => setEntryForm({ ...entryForm, entryNumber: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento Fiscal
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={entryForm.fiscalDocument}
                      onChange={(e) => setEntryForm({ ...entryForm, fiscalDocument: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Fornecedor */}
              <div>
                <h4 className="font-medium mb-4">Dados do Fornecedor</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesquisar Fornecedor
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                          type="text"
                          className="input pl-10 pr-10"
                          value={supplierSearchTerm}
                          onChange={(e) => handleSupplierSearch(e.target.value)}
                          placeholder="Digite o nome ou CNPJ..."
                        />
                        {supplierSearchTerm && (
                          <button
                            onClick={clearSupplier}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Dropdown de resultados */}
                      {showSupplierDropdown && filteredSuppliers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier._id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => selectSupplier(supplier)}
                            >
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                <div>
                                  <p className="font-medium text-sm">{supplier.name}</p>
                                  <p className="text-xs text-gray-500">{supplier.cnpj || 'Sem CNPJ'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fornecedor Selecionado
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={entryForm.supplier.name || ''}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          supplier: { ...entryForm.supplier, name: e.target.value }
                        })}
                        placeholder="Nome do fornecedor"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={entryForm.supplier.cnpj || ''}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          supplier: { ...entryForm.supplier, cnpj: e.target.value }
                        })}
                        placeholder="00.000.000/0000-00"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={entryForm.supplier.phone || ''}
                        onChange={(e) => setEntryForm({
                          ...entryForm,
                          supplier: { ...entryForm.supplier, phone: e.target.value }
                        })}
                        placeholder="(00) 00000-0000"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Produtos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Produtos</h4>
                  <span className="text-sm text-gray-500">
                    Total: {formatCurrency(calculateTotal())}
                  </span>
                </div>
                
                {entryForm.items.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Nenhum produto adicionado</p>
                    
                    {/* Campo de busca de produtos */}
                    <div className="max-w-md mx-auto mb-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adicionar Produto
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input
                              type="text"
                              className="input pl-10 pr-10"
                              value={productSearchTerm}
                              onChange={(e) => handleProductSearch(e.target.value)}
                              placeholder="Digite o nome, código ou marca..."
                            />
                            {productSearchTerm && (
                              <button
                                onClick={clearProductSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            className="input w-20"
                            value={productQuantity}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              // Permite digitar qualquer valor, só converte para número
                              const parsedValue = newValue === '' ? '' : parseInt(newValue) || 1;
                              setProductQuantity(parsedValue);
                            }}
                            min="1"
                            placeholder="Qtd"
                          />
                        </div>
                        
                        {/* Dropdown de resultados */}
                        {showProductDropdown && filteredProducts.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <div
                                key={product._id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => addProductToEntry(product)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                                    <div>
                                      <p className="font-medium text-sm">{product.description}</p>
                                      <p className="text-xs text-gray-500">{product.barcode || 'Sem código'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(product.costPrice)}</p>
                                    <p className="text-xs text-gray-500">Estoque: {product.quantity}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Campo de busca para adicionar mais produtos */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-2">Adicionar mais produtos:</p>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input
                              type="text"
                              className="input pl-10 pr-10"
                              value={productSearchTerm}
                              onChange={(e) => handleProductSearch(e.target.value)}
                              placeholder="Digite o nome, código ou marca..."
                            />
                            {productSearchTerm && (
                              <button
                                onClick={clearProductSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            className="input w-20"
                            value={productQuantity}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              // Permite digitar qualquer valor, só converte para número
                              const parsedValue = newValue === '' ? '' : parseInt(newValue) || 1;
                              setProductQuantity(parsedValue);
                            }}
                            min="1"
                            placeholder="Qtd"
                          />
                        </div>
                        
                        {/* Dropdown de resultados */}
                        {showProductDropdown && filteredProducts.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <div
                                key={product._id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => addProductToEntry(product)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                                    <div>
                                      <p className="font-medium text-sm">{product.description}</p>
                                      <p className="text-xs text-gray-500">{product.barcode || 'Sem código'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(product.costPrice)}</p>
                                    <p className="text-xs text-gray-500">Estoque: {product.quantity}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Lista de itens adicionados */}
                    <div className="space-y-2">
                      {entryForm.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-gray-500">Custo: {formatCurrency(item.unitValue)} | Estoque: {products.find(p => p._id === item.productId)?.quantity || 0}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="input w-20 text-sm"
                              value={item.quantity}
                              onChange={(e) => updateItemInEntry(index, 'quantity', e.target.value)}
                              min="1"
                              placeholder="Qtd"
                            />
                            <input
                              type="number"
                              className="input w-24 text-sm"
                              value={item.unitValue}
                              onChange={(e) => updateItemInEntry(index, 'unitValue', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="Valor"
                            />
                            <div className="w-24 text-right text-sm font-medium">
                              {formatCurrency(item.totalValue)}
                            </div>
                            <button
                              onClick={() => removeItemFromEntry(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                {entryForm.items.length} produto(s) • {formatCurrency(calculateTotal())}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="btn btn-secondary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={entryForm.items.length === 0}
                  className="btn btn-primary h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
                >
                  Salvar Entrada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entries;
