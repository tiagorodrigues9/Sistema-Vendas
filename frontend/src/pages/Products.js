import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, BarChart3, Download, Check, PlusCircle } from 'lucide-react';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    barcode: '',
    description: '',
    brand: '',
    group: '',
    subgroup: '',
    quantity: 0,
    unit: 'UND',
    costPrice: 0,
    salePrice: 0
  });
  const [stockData, setStockData] = useState({
    quantity: 0,
    justification: ''
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      barcode: '7891234567890',
      description: 'Produto Exemplo 1',
      brand: 'Marca A',
      group: 'Alimentos',
      subgroup: 'Bebidas',
      quantity: 50,
      unit: 'UND',
      costPrice: 8.50,
      salePrice: 10.99,
      isDeleted: false
    },
    {
      id: 2,
      barcode: '7891234567891',
      description: 'Produto Exemplo 2',
      brand: 'Marca B',
      group: 'Limpeza',
      subgroup: 'Detergentes',
      quantity: 30,
      unit: 'LT',
      costPrice: 18.00,
      salePrice: 25.50,
      isDeleted: false
    }
  ]);

  const [deletedProducts, setDeletedProducts] = useState([
    {
      id: 3,
      barcode: '7891234567892',
      description: 'Produto Antigo',
      brand: 'Marca C',
      group: 'Papelaria',
      subgroup: 'Cadernos',
      quantity: 0,
      unit: 'UND',
      costPrice: 5.00,
      salePrice: 7.50,
      isDeleted: true
    }
  ]);

  const filteredProducts = products.filter(product =>
    !product.isDeleted &&
    (product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.barcode.includes(searchTerm) ||
     product.brand.toLowerCase().includes(searchTerm))
  );

  const filteredDeletedProducts = deletedProducts.filter(product =>
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(product =>
        product.id === editingProduct.id
          ? { ...product, ...formData }
          : product
      ));
    } else {
      const newProduct = {
        id: Date.now(),
        ...formData,
        isDeleted: false
      };
      setProducts([...products, newProduct]);
    }
    resetForm();
  };

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
      salePrice: 0
    });
    setShowForm(false);
    setEditingProduct(null);
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      description: product.description,
      brand: product.brand,
      group: product.group,
      subgroup: product.subgroup,
      quantity: product.quantity,
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.salePrice
    });
    setShowForm(true);
  };

  const deleteProduct = (product) => {
    setProducts(products.filter(p => p.id !== product.id));
    setDeletedProducts([...deletedProducts, { ...product, isDeleted: true }]);
  };

  const restoreProduct = (product) => {
    setDeletedProducts(deletedProducts.filter(p => p.id !== product.id));
    setProducts([...products, { ...product, isDeleted: false }]);
  };

  const permanentDelete = (product) => {
    setDeletedProducts(deletedProducts.filter(p => p.id !== product.id));
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockData({ quantity: 0, justification: '' });
    setShowStockModal(true);
  };

  const handleStockAdjustment = (type) => {
    if (selectedProduct && stockData.quantity !== 0 && stockData.justification) {
      const adjustment = type === 'add' ? stockData.quantity : -stockData.quantity;
      setProducts(products.map(product =>
        product.id === selectedProduct.id
          ? { ...product, quantity: product.quantity + adjustment }
          : product
      ));
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockData({ quantity: 0, justification: '' });
    }
  };

  const generateReport = (type) => {
    alert(`Gerando relatório ${type} de produtos...`);
  };

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => generateReport('cadastro')}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </button>
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`btn ${showTrash ? 'btn-warning' : 'btn-secondary'}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {showTrash ? 'Ver Ativos' : 'Lixeira'}
          </button>
          {!showTrash && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Produto
            </button>
          )}
        </div>
      </div>

      {/* Formulário de Cadastro/Edição */}
      {showForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="input"
                    placeholder="Opcional"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-1">Descrição *</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input"
                    placeholder="Descrição do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="input"
                    placeholder="Marca do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grupo *</label>
                  <input
                    type="text"
                    required
                    value={formData.group}
                    onChange={(e) => setFormData({...formData, group: e.target.value})}
                    className="input"
                    placeholder="Grupo do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subgrupo</label>
                  <input
                    type="text"
                    value={formData.subgroup}
                    onChange={(e) => setFormData({...formData, subgroup: e.target.value})}
                    className="input"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="input"
                  >
                    <option value="UND">UND</option>
                    <option value="KG">KG</option>
                    <option value="PCT">PCT</option>
                    <option value="LT">LT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço de Custo *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço de Venda *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value)})}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por descrição, código ou marca..."
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
          <h3 className="card-title">
            {showTrash ? 'Produtos na Lixeira' : 'Produtos Ativos'}
          </h3>
        </div>
        <div className="card-content">
          {!showTrash && filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum produto encontrado</p>
          ) : showTrash && filteredDeletedProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum produto na lixeira</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código</th>
                    <th className="text-left py-3 px-4">Descrição</th>
                    <th className="text-left py-3 px-4">Marca</th>
                    <th className="text-left py-3 px-4">Grupo</th>
                    <th className="text-center py-3 px-4">Qtd</th>
                    <th className="text-left py-3 px-4">Un</th>
                    <th className="text-right py-3 px-4">Preço Custo</th>
                    <th className="text-right py-3 px-4">Preço Venda</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {!showTrash && filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{product.barcode || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          {product.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.brand}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div>{product.group}</div>
                          {product.subgroup && <div className="text-xs text-gray-500">{product.subgroup}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${product.quantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{product.unit}</td>
                      <td className="py-3 px-4 text-right">R$ {product.costPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium">R$ {product.salePrice.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => editProduct(product)}
                            className="btn btn-primary btn-sm"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStockModal(product)}
                            className="btn btn-success btn-sm"
                            title="Incluir Estoque"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
                            className="btn btn-error btn-sm"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {showTrash && filteredDeletedProducts.map((product) => (
                    <tr key={product.id} className="border-b bg-red-50">
                      <td className="py-3 px-4 text-sm">{product.barcode || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          {product.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.brand}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div>{product.group}</div>
                          {product.subgroup && <div className="text-xs text-gray-500">{product.subgroup}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-red-600">{product.quantity}</td>
                      <td className="py-3 px-4 text-center">{product.unit}</td>
                      <td className="py-3 px-4 text-right">R$ {product.costPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">R$ {product.salePrice.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => restoreProduct(product)}
                            className="btn btn-success btn-sm"
                            title="Restaurar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => permanentDelete(product)}
                            className="btn btn-error btn-sm"
                            title="Excluir Permanentemente"
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

      {/* Modal de Ajuste de Estoque */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Ajustar Estoque</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Produto: <strong>{selectedProduct.description}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Estoque atual: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={stockData.quantity}
                    onChange={(e) => setStockData({...stockData, quantity: parseInt(e.target.value)})}
                    className="input w-full"
                    placeholder="Quantidade para ajustar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Justificativa *</label>
                  <textarea
                    required
                    value={stockData.justification}
                    onChange={(e) => setStockData({...stockData, justification: e.target.value})}
                    className="input w-full"
                    rows="3"
                    placeholder="Motivo do ajuste de estoque"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStockAdjustment('add')}
                className="btn btn-success flex-1"
              >
                Adicionar
              </button>
              <button
                onClick={() => handleStockAdjustment('remove')}
                className="btn btn-warning flex-1"
              >
                Retirar
              </button>
              <button
                onClick={() => setShowStockModal(false)}
                className="btn btn-secondary flex-1"
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

export default Products;
