import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, FileText, Check, X, AlertCircle } from 'lucide-react';

const Entries = () => {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryForm, setEntryForm] = useState({
    invoiceCode: '',
    supplier: '',
    invoiceValue: 0
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    barcode: '',
    description: '',
    quantity: 0
  });

  const [entries, setEntries] = useState([
    {
      id: 1,
      invoiceCode: 'NF001',
      supplier: 'Fornecedor A',
      invoiceValue: 1500.00,
      date: '15/01/2026',
      status: 'completed',
      products: [
        { barcode: '7891234567890', description: 'Produto 1', quantity: 10 },
        { barcode: '7891234567891', description: 'Produto 2', quantity: 5 }
      ]
    },
    {
      id: 2,
      invoiceCode: 'NF002',
      supplier: 'Fornecedor B',
      invoiceValue: 800.00,
      date: '14/01/2026',
      status: 'completed',
      products: [
        { barcode: '7891234567892', description: 'Produto 3', quantity: 20 }
      ]
    }
  ]);

  const mockProducts = [
    { barcode: '7891234567890', description: 'Produto Exemplo 1' },
    { barcode: '7891234567891', description: 'Produto Exemplo 2' },
    { barcode: '7891234567892', description: 'Produto Exemplo 3' },
    { barcode: '7891234567893', description: 'Produto Exemplo 4' }
  ];

  const filteredEntries = entries.filter(entry =>
    entry.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = mockProducts.filter(product =>
    product.description.toLowerCase().includes(currentProduct.description.toLowerCase()) ||
    product.barcode.includes(currentProduct.barcode)
  );

  const startNewEntry = () => {
    setEntryForm({ invoiceCode: '', supplier: '', invoiceValue: 0 });
    setSelectedProducts([]);
    setShowNewEntry(true);
    setShowEntryDetail(false);
  };

  const confirmEntryHeader = () => {
    if (entryForm.invoiceCode && entryForm.supplier && entryForm.invoiceValue > 0) {
      setShowNewEntry(false);
      setShowEntryDetail(true);
    }
  };

  const addProductToEntry = () => {
    if (currentProduct.barcode && currentProduct.quantity > 0) {
      const product = mockProducts.find(p => p.barcode === currentProduct.barcode);
      if (product) {
        const existingProduct = selectedProducts.find(p => p.barcode === currentProduct.barcode);
        if (existingProduct) {
          setSelectedProducts(selectedProducts.map(p =>
            p.barcode === currentProduct.barcode
              ? { ...p, quantity: p.quantity + currentProduct.quantity }
              : p
          ));
        } else {
          setSelectedProducts([...selectedProducts, {
            barcode: currentProduct.barcode,
            description: product.description,
            quantity: currentProduct.quantity
          }]);
        }
        setCurrentProduct({ barcode: '', description: '', quantity: 0 });
      }
    }
  };

  const removeProductFromEntry = (barcode) => {
    setSelectedProducts(selectedProducts.filter(p => p.barcode !== barcode));
  };

  const finishEntry = () => {
    if (selectedProducts.length > 0) {
      const newEntry = {
        id: Date.now(),
        ...entryForm,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'completed',
        products: [...selectedProducts]
      };
      setEntries([newEntry, ...entries]);
      setShowEntryDetail(false);
      setSelectedProducts([]);
      setEntryForm({ invoiceCode: '', supplier: '', invoiceValue: 0 });
    }
  };

  const editEntry = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      invoiceCode: entry.invoiceCode,
      supplier: entry.supplier,
      invoiceValue: entry.invoiceValue
    });
    setSelectedProducts([...entry.products]);
    setShowEntryDetail(true);
  };

  const deleteEntry = (entry) => {
    setEntries(entries.filter(e => e.id !== entry.id));
  };

  const updateEntry = () => {
    if (editingEntry) {
      setEntries(entries.map(e =>
        e.id === editingEntry.id
          ? { ...e, ...entryForm, products: [...selectedProducts] }
          : e
      ));
      setEditingEntry(null);
      setShowEntryDetail(false);
      setSelectedProducts([]);
      setEntryForm({ invoiceCode: '', supplier: '', invoiceValue: 0 });
    }
  };

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Entrada de Produtos</h1>
        <button
          onClick={startNewEntry}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Realizar Entrada
        </button>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por código da nota ou fornecedor..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Nova Entrada - Cabeçalho */}
      {showNewEntry && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Nova Entrada - Dados da Nota Fiscal</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código de Acesso da Nota Fiscal *</label>
                <input
                  type="text"
                  required
                  value={entryForm.invoiceCode}
                  onChange={(e) => setEntryForm({...entryForm, invoiceCode: e.target.value})}
                  className="input"
                  placeholder="NF001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fornecedor *</label>
                <input
                  type="text"
                  required
                  value={entryForm.supplier}
                  onChange={(e) => setEntryForm({...entryForm, supplier: e.target.value})}
                  className="input"
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor da Nota *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={entryForm.invoiceValue}
                  onChange={(e) => setEntryForm({...entryForm, invoiceValue: parseFloat(e.target.value)})}
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmEntryHeader}
                className="btn btn-primary"
                disabled={!entryForm.invoiceCode || !entryForm.supplier || entryForm.invoiceValue <= 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </button>
              <button
                onClick={() => setShowNewEntry(false)}
                className="btn btn-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalhe da Entrada - Seleção de Produtos */}
      {showEntryDetail && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingEntry ? 'Editar Entrada' : 'Selecionar Produtos para Entrada'}
            </h3>
            <div className="text-sm text-gray-500">
              Nota: {entryForm.invoiceCode} • Fornecedor: {entryForm.supplier} • Valor: R$ {entryForm.invoiceValue.toFixed(2)}
            </div>
          </div>
          <div className="card-content">
            {/* Adicionar Produtos */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Adicionar Produtos</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pesquisar Produto</label>
                  <input
                    type="text"
                    value={currentProduct.description}
                    onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                    className="input"
                    placeholder="Descrição do produto"
                  />
                  {filteredProducts.length > 0 && currentProduct.description && (
                    <div className="border rounded mt-1 max-h-32 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.barcode}
                          onClick={() => setCurrentProduct({...currentProduct, barcode: product.barcode, description: product.description})}
                          className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {product.description} ({product.barcode})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={currentProduct.quantity}
                    onChange={(e) => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value)})}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addProductToEntry}
                    className="btn btn-primary w-full"
                    disabled={!currentProduct.barcode || currentProduct.quantity <= 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Produtos Selecionados */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Produtos Selecionados</h4>
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum produto selecionado</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm">Código</th>
                        <th className="text-left py-2 px-4 text-sm">Descrição</th>
                        <th className="text-center py-2 px-4 text-sm">Quantidade</th>
                        <th className="text-center py-2 px-4 text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((product) => (
                        <tr key={product.barcode} className="border-t">
                          <td className="py-2 px-4 text-sm">{product.barcode}</td>
                          <td className="py-2 px-4 text-sm">{product.description}</td>
                          <td className="py-2 px-4 text-center">{product.quantity}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => removeProductFromEntry(product.barcode)}
                              className="btn btn-error btn-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {editingEntry ? (
                <button
                  onClick={updateEntry}
                  className="btn btn-primary"
                  disabled={selectedProducts.length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Atualizar Entrada
                </button>
              ) : (
                <button
                  onClick={finishEntry}
                  className="btn btn-success"
                  disabled={selectedProducts.length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Entrada
                </button>
              )}
              <button
                onClick={() => {
                  setShowEntryDetail(false);
                  setEditingEntry(null);
                  setSelectedProducts([]);
                }}
                className="btn btn-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Entradas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Entradas Realizadas</h3>
        </div>
        <div className="card-content">
          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma entrada encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código</th>
                    <th className="text-left py-3 px-4">Fornecedor</th>
                    <th className="text-left py-3 px-4">Valor</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Produtos</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          {entry.invoiceCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">{entry.supplier}</td>
                      <td className="py-3 px-4 font-medium">R$ {entry.invoiceValue.toFixed(2)}</td>
                      <td className="py-3 px-4">{entry.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {entry.products.length} itens
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editEntry(entry)}
                            className="btn btn-primary btn-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry)}
                            className="btn btn-error btn-sm"
                            title="Excluir"
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

export default Entries;
