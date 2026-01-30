import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, DollarSign, Calculator, Printer, RefreshCw, Eye, X, Check } from 'lucide-react';
import { salesAPI, productsAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Sales = () => {
  // Carregar estado do caixa do localStorage
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(() => {
    const saved = localStorage.getItem('@PDV:cashRegisterOpen');
    return saved === 'true';
  });
  const [showCashManagement, setShowCashManagement] = useState(false);
  const [cashAmount, setCashAmount] = useState(() => {
    const saved = localStorage.getItem('@PDV:cashAmount');
    return saved ? parseFloat(saved) : 0;
  });
  const [cashAdjustment, setCashAdjustment] = useState('');
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('@PDV:cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('CONSUMIDOR');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResponse, customersResponse, salesResponse] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll(),
        salesAPI.getAll()
      ]);
      
      setProducts(productsResponse.data.products || []);
      setCustomers(customersResponse.data.customers || []);
      setSales(salesResponse.data.sales || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setProducts([]);
      setCustomers([]);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Salvar estados no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('@PDV:cashRegisterOpen', isCashRegisterOpen.toString());
  }, [isCashRegisterOpen]);

  useEffect(() => {
    localStorage.setItem('@PDV:cashAmount', cashAmount.toString());
  }, [cashAmount]);

  useEffect(() => {
    localStorage.setItem('@PDV:cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Abrir caixa
  const openCashRegister = () => {
    setIsCashRegisterOpen(true);
  };

  // Fechar caixa
  const closeCashRegister = () => {
    setIsCashRegisterOpen(false);
    // Limpar carrinho ao fechar caixa
    setCartItems([]);
    setPaymentMethods([]);
    setSelectedCustomer('CONSUMIDOR');
    toast.success('Caixa fechado com sucesso');
  };

  // Ajustar caixa
  const adjustCash = (type) => {
    const value = parseFloat(cashAdjustment);
    if (!isNaN(value)) {
      if (type === 'add') {
        setCashAmount(cashAmount + value);
      } else {
        setCashAmount(Math.max(0, cashAmount - value));
      }
      setCashAdjustment('');
      setShowCashManagement(false);
    }
  };

  // Adicionar ao carrinho
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    if (existingItem) {
      updateQuantity(existingItem._id, existingItem.quantity + 1);
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  // Remover do carrinho
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item._id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item => 
        item._id === productId ? { ...item, quantity } : item
      ));
    }
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular totais
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  // Finalizar venda
  const finalizeSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    try {
      const saleData = {
        customer: selectedCustomer === 'CONSUMIDOR' ? null : selectedCustomer,
        customerName: selectedCustomer === 'CONSUMIDOR' ? 'CONSUMIDOR' : 
          customers.find(c => c._id === selectedCustomer)?.fullName,
        items: cartItems.map(item => ({
          product: item._id,
          description: item.description,
          quantity: item.quantity,
          unitValue: item.salePrice,
          totalValue: item.salePrice * item.quantity
        })),
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        paymentMethods: paymentMethods,
        status: 'completed'
      };

      const response = await salesAPI.create(saleData);
      setCurrentSale(response.data);
      setShowPrintDialog(true);
      
      // Limpar carrinho
      setCartItems([]);
      setPaymentMethods([]);
      setSelectedCustomer('CONSUMIDOR');
      
      // Recarregar vendas
      loadData();
      
      toast.success('Venda realizada com sucesso');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Erro ao finalizar venda');
    }
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Vendas</h1>
          {isCashRegisterOpen && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <Check className="w-4 h-4" />
              Caixa Aberto
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSalesHistory(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Histórico
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={isCashRegisterOpen ? closeCashRegister : openCashRegister}
            className={`btn flex items-center gap-2 ${isCashRegisterOpen ? 'btn-danger' : 'btn-primary'}`}
          >
            <DollarSign className="w-4 h-4" />
            {isCashRegisterOpen ? 'Fechar Caixa' : 'Abrir Caixa'}
          </button>
        </div>
      </div>

      {/* PDV */}
      {isCashRegisterOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Produtos</h3>
              </div>
              <div className="card-content">
                {/* Busca */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    className="input pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Lista de Produtos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 col-span-2 text-center py-8">
                      {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{product.description}</h4>
                            <p className="text-sm text-gray-500">{product.barcode}</p>
                            <p className="text-sm text-gray-500">
                              Estoque: {product.quantity} {product.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(product.salePrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Cliente</h3>
              </div>
              <div className="card-content">
                <select
                  className="input"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="CONSUMIDOR">CONSUMIDOR</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Carrinho */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Carrinho</h3>
              </div>
              <div className="card-content">
                {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.description}</h4>
                          <p className="text-sm text-gray-500">{formatCurrency(item.salePrice)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="btn btn-secondary btn-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="btn btn-secondary btn-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Totais */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>

                    {/* Finalizar */}
                    <button
                      onClick={finalizeSale}
                      className="btn btn-primary w-full"
                      disabled={cartItems.length === 0}
                    >
                      Finalizar Venda
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Vendas */}
      {showSalesHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Histórico de Vendas</h3>
              <button
                onClick={() => setShowSalesHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Número</th>
                    <th className="text-left py-3 px-4">Cliente</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-right py-3 px-4">Total</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{sale.saleNumber}</td>
                        <td className="py-3 px-4">{sale.customerName}</td>
                        <td className="py-3 px-4">{formatDate(sale.createdAt)}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                            {sale.status === 'completed' ? 'Concluída' : sale.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setCurrentSale(sale);
                                setShowPrintDialog(true);
                              }}
                              className="btn btn-primary btn-sm"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Impressão */}
      {showPrintDialog && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Comprovante de Venda</h3>
              <button
                onClick={() => setShowPrintDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h4 className="font-bold">SISTEMA PDV</h4>
                <p className="text-sm text-gray-600">Comprovante de Venda</p>
              </div>

              <div>
                <p><strong>Número:</strong> {currentSale.saleNumber}</p>
                <p><strong>Data:</strong> {formatDate(currentSale.createdAt)}</p>
                <p><strong>Cliente:</strong> {currentSale.customerName}</p>
              </div>

              <div>
                <h5 className="font-medium mb-2">Itens:</h5>
                <div className="space-y-1">
                  {currentSale.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.description}</span>
                      <span>{formatCurrency(item.totalValue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(currentSale.total)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => window.print()}
                className="btn btn-primary flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => setShowPrintDialog(false)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
