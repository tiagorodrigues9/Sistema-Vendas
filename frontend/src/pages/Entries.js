import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, FileText, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { entriesAPI, productsAPI } from '../services/api';
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
  
  const [entryForm, setEntryForm] = useState({
    entryNumber: '',
    fiscalDocument: '',
    supplier: { name: '', cnpj: '', phone: '' },
    items: []
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesResponse, productsResponse] = await Promise.all([
        entriesAPI.getAll(),
        productsAPI.getAll()
      ]);
      
      setEntries(entriesResponse.data.entries || []);
      setProducts(productsResponse.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setEntries([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowNewEntry(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Entrada
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
              placeholder="Buscar por número, documento ou fornecedor..."
              className="input pl-10"
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
                        {formatCurrency(entry.totalValue)}
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
                            className="btn btn-primary btn-sm"
                            title="Ver Detalhes"
                          >
                            <FileText className="w-4 h-4" />
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
                    <p className="font-medium">{formatCurrency(selectedEntry.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedEntry.status)}`}>
                      {getStatusText(selectedEntry.status)}
                    </span>
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
                          <td className="py-2 px-4">{item.description}</td>
                          <td className="py-2 px-4 text-right">{item.quantity}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.unitValue)}</td>
                          <td className="py-2 px-4 text-right font-medium">
                            {formatCurrency(item.totalValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEntryDetail(false)}
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

export default Entries;
