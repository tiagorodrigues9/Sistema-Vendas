import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, X, DollarSign, CreditCard, Printer } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Sales = () => {
  const [cashRegister, setCashRegister] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [change, setChange] = useState(0);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCashManagement, setShowCashManagement] = useState(false);
  const [cashAmount, setCashAmount] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    loadCashRegister();
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalPaid(paid);
    setChange(Math.max(0, paid - total));
  }, [cart, payments]);

  const loadCashRegister = async () => {
    try {
      const response = await api.get('/sales/cash-register/current');
      setCashRegister(response.data);
    } catch (error) {
      console.log('No open cash register');
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Error loading customers:', error);
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

  const openCashRegister = async (data) => {
    setLoading(true);
    try {
      await api.post('/sales/cash-register/open', {
        openingBalance: parseFloat(data.openingBalance) || 0
      });
      toast.success('Caixa aberto com sucesso!');
      loadCashRegister();
      setShowCashManagement(false);
    } catch (error) {
      toast.error('Erro ao abrir caixa');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.salePrice
      }]);
    }
    setShowProductSearch(false);
    setProductSearch('');
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
    } else {
      setCart(cart.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ));
    }
  };

  const addPayment = (method, amount) => {
    setPayments([...payments, { method, amount: parseFloat(amount) }]);
    setShowAddPayment(false);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const finishSale = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    if (payments.length === 0) {
      toast.error('Adicione uma forma de pagamento');
      return;
    }

    const total = getTotal();
    if (totalPaid < total) {
      toast.error('Valor pago é insuficiente');
      return;
    }

    setLoading(true);
    try {
      await api.post('/sales', {
        customer: customers[0]?._id || null,
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        payments: payments.map(payment => ({
          method: payment.method,
          amount: payment.amount
        }))
      });

      toast.success('Venda realizada com sucesso!');
      setCart([]);
      setPayments([]);
      
      // Show print option
      if (window.confirm('Deseja imprimir o comprovante?')) {
        window.print();
      }
    } catch (error) {
      toast.error('Erro ao realizar venda');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'bank_slip', label: 'Boleto' },
    { value: 'promissory_note', label: 'Promissória' }
  ];

  const filteredProducts = products.filter(product =>
    product.description.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode?.includes(productSearch)
  );

  if (!cashRegister) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Abrir Caixa</h2>
          
          <form onSubmit={handleSubmit(openCashRegister)} className="space-y-4">
            <div>
              <label className="form-label">Valor Inicial em Caixa</label>
              <input
                {...register('openingBalance')}
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0,00"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Abrir Caixa'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Sales Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Nova Venda</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Caixa aberto: {formatCurrency(cashRegister.openingBalance)}
              </span>
              <button
                onClick={() => setShowCashManagement(true)}
                className="btn btn-outline btn-sm"
              >
                Gerenciar Caixa
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="mb-6">
            <label className="form-label">Cliente</label>
            <select className="form-input">
              <option value="">CONSUMIDOR</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="form-label">Data</label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                readOnly
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Hora</label>
              <input
                type="time"
                value={new Date().toTimeString().slice(0, 5)}
                readOnly
                className="form-input"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="mb-6">
            <label className="form-label">Adicionar Produto</label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
                placeholder="Digite o nome ou código de barras..."
                className="form-input pr-10"
              />
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              
              {showProductSearch && productSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <div
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{product.description}</p>
                          <p className="text-sm text-gray-500">
                            {product.barcode && `Cód: ${product.barcode}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.salePrice)}</p>
                          <p className="text-sm text-gray-500">
                            Estoque: {product.quantity} {product.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-3 text-gray-500 text-center">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Itens da Venda</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} x {item.quantity} {item.product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-16 form-input text-sm"
                        min="1"
                      />
                      <span className="font-medium w-24 text-right">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Formas de Pagamento</h3>
              <button
                onClick={() => setShowAddPayment(true)}
                className="btn btn-outline btn-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma forma de pagamento adicionada</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                      <span>
                        {paymentMethods.find(m => m.value === payment.method)?.label || payment.method}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <button
                        onClick={() => removePayment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pago:</span>
                <span>{formatCurrency(totalPaid)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Troco:</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={finishSale}
              disabled={loading || cart.length === 0 || payments.length === 0}
              className="btn btn-primary flex-1"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Finalizar Venda'}
            </button>
            <button className="btn btn-outline">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Summary */}
        <div className="card">
          <h3 className="font-semibold mb-4">Resumo da Venda</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Itens:</span>
              <span className="font-medium">{cart.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-lg">{formatCurrency(getTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pago:</span>
              <span className="font-medium">{formatCurrency(totalPaid)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Troco:</span>
                <span className="font-semibold">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="card">
          <h3 className="font-semibold mb-4">Hoje</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vendas:</span>
              <span>0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Faturamento:</span>
              <span>{formatCurrency(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="font-semibold mb-4">Adicionar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Forma de Pagamento</label>
                <select
                  id="paymentMethod"
                  className="form-input"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Valor</label>
                <input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  const method = document.getElementById('paymentMethod').value;
                  const amount = document.getElementById('paymentAmount').value;
                  if (amount) {
                    addPayment(method, amount);
                  }
                }}
                className="btn btn-primary flex-1"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddPayment(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
