import React, { useState } from 'react';
import { Search, Plus, Trash2, DollarSign, Calculator, Printer, Menu, X } from 'lucide-react';

const Sales = () => {
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [showCashManagement, setShowCashManagement] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cashAdjustment, setCashAdjustment] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('CONSUMIDOR');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);

  const openCashRegister = () => {
    setIsCashRegisterOpen(true);
  };

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

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.barcode === product.barcode);
    if (existingItem) {
      updateQuantity(existingItem.barcode, existingItem.quantity + 1);
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (barcode) => {
    setCartItems(cartItems.filter(item => item.barcode !== barcode));
  };

  const updateQuantity = (barcode, quantity) => {
    if (quantity <= 0) {
      removeFromCart(barcode);
    } else {
      setCartItems(cartItems.map(item => 
        item.barcode === barcode ? { ...item, quantity } : item
      ));
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  const addPaymentMethod = () => {
    const remaining = getTotal() - paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (remaining > 0) {
      setPaymentMethods([...paymentMethods, { type: 'dinheiro', amount: remaining }]);
    }
  };

  const updatePaymentMethod = (index, field, value) => {
    const newMethods = [...paymentMethods];
    newMethods[index][field] = value;
    setPaymentMethods(newMethods);
  };

  const removePaymentMethod = (index) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const finishSale = () => {
    const sale = {
      id: Date.now(),
      customer: selectedCustomer,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      items: cartItems,
      paymentMethods: paymentMethods,
      total: getTotal()
    };
    setCurrentSale(sale);
    setShowPrintDialog(true);
    setCartItems([]);
    setPaymentMethods([]);
  };

  const mockProducts = [
    { barcode: '7891234567890', description: 'Produto Exemplo 1', unitPrice: 10.99, stock: 50 },
    { barcode: '7891234567891', description: 'Produto Exemplo 2', unitPrice: 25.50, stock: 30 },
    { barcode: '7891234567892', description: 'Produto Exemplo 3', unitPrice: 5.75, stock: 100 },
  ];

  const filteredProducts = mockProducts.filter(product =>
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const printReceipt = (type) => {
    // Simulação de impressão
    alert(`Imprimindo comprovante em impressora ${type === 'thermal' ? 'térmica' : 'A4'}`);
    setShowPrintDialog(false);
  };

  if (!isCashRegisterOpen) {
    return (
      <div className="container-responsive flex items-center justify-center min-h-screen">
        <div className="card max-w-md w-full">
          <div className="card-header text-center">
            <h2 className="card-title text-2xl">Caixa Fechado</h2>
          </div>
          <div className="card-content text-center">
            <p className="text-gray-600 mb-6">O caixa está fechado. Abra o caixa para iniciar as vendas.</p>
            <button onClick={openCashRegister} className="btn btn-primary w-full">
              Abrir Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ponto de Venda</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Saldo Caixa: </span>
            <span className="font-bold text-green-600">R$ {cashAmount.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => setShowCashManagement(true)}
            className="btn btn-secondary btn-sm"
          >
            <Calculator className="w-4 h-4" />
          </button>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente e Data/Hora */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Informações da Venda</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <input
                    type="text"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('pt-BR')}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora</label>
                  <input
                    type="text"
                    value={new Date().toLocaleTimeString('pt-BR')}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de Itens */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Selecionar Itens</h3>
            </div>
            <div className="card-content">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar por descrição ou código de barras..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Lista de Itens no Carrinho */}
              {cartItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Itens na Venda</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm">Código</th>
                          <th className="px-4 py-2 text-left text-sm">Descrição</th>
                          <th className="px-4 py-2 text-right text-sm">Valor Unit.</th>
                          <th className="px-4 py-2 text-center text-sm">Qtd</th>
                          <th className="px-4 py-2 text-right text-sm">Total</th>
                          <th className="px-4 py-2 text-center text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.barcode} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.barcode}</td>
                            <td className="px-4 py-2 text-sm">{item.description}</td>
                            <td className="px-4 py-2 text-right text-sm">R$ {item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.barcode, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-sm">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => removeFromCart(item.barcode)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Produtos Disponíveis */}
              <div>
                <h4 className="font-medium mb-3">Produtos Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <div key={product.barcode} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-sm">{product.description}</h5>
                          <p className="text-xs text-gray-500">{product.barcode}</p>
                        </div>
                        <span className="font-bold text-green-600">R$ {product.unitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Estoque: {product.stock}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Formas de Pagamento</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <select
                      value={method.type}
                      onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                      className="input flex-1"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="promissoria">Promissória</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={method.amount}
                      onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value))}
                      className="input w-32"
                      placeholder="Valor"
                    />
                    <button
                      onClick={() => removePaymentMethod(index)}
                      className="btn btn-error btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addPaymentMethod}
                  className="btn btn-secondary w-full"
                  disabled={paymentMethods.reduce((sum, p) => sum + p.amount, 0) >= getTotal()}
                >
                  Adicionar Forma de Pagamento
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total da Venda:</span>
                  <span className="text-xl font-bold text-green-600">R$ {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total Pago:</span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {paymentMethods.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={finishSale}
                  className="btn btn-success w-full"
                  disabled={paymentMethods.reduce((sum, p) => sum + p.amount, 0) !== getTotal() || cartItems.length === 0}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Resumo da Venda</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{selectedCustomer}</span>
                </div>
                <div className="flex justify-between">
                  <span>Itens:</span>
                  <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {getTotal().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Gestão de Caixa */}
      {showCashManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Gestão de Caixa</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Saldo atual: R$ {cashAmount.toFixed(2)}</p>
              <input
                type="number"
                step="0.01"
                value={cashAdjustment}
                onChange={(e) => setCashAdjustment(e.target.value)}
                className="input w-full"
                placeholder="Valor para ajustar"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => adjustCash('add')}
                className="btn btn-success flex-1"
              >
                Adicionar
              </button>
              <button
                onClick={() => adjustCash('remove')}
                className="btn btn-warning flex-1"
              >
                Retirar
              </button>
              <button
                onClick={() => setShowCashManagement(false)}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão */}
      {showPrintDialog && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Opções de Impressão</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Deseja imprimir o comprovante?</p>
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-sm"><strong>Venda #{currentSale.id}</strong></p>
                <p className="text-sm">Cliente: {currentSale.customer}</p>
                <p className="text-sm">Total: R$ {currentSale.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => printReceipt('thermal')}
                className="btn btn-primary flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Impressora Térmica
              </button>
              <button
                onClick={() => printReceipt('a4')}
                className="btn btn-secondary flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Impressora A4
              </button>
              <button
                onClick={() => setShowPrintDialog(false)}
                className="btn btn-outline flex-1"
              >
                Não Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
