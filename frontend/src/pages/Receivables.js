import React, { useState, useEffect } from 'react';
import { Search, Eye, DollarSign, Calendar, User, FileText, Check, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { receivablesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Receivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados do backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [receivablesResponse, summaryResponse] = await Promise.all([
        receivablesAPI.getAll(),
        receivablesAPI.getSummary()
      ]);
      
      setReceivables(receivablesResponse.data.receivables || []);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      toast.error('Erro ao carregar contas a receber');
      // Inicializar com arrays vazios para evitar erros
      setReceivables([]);
      setSummary({
        summary: [],
        overdue: { count: 0, total: 0 },
        next30Days: { count: 0, total: 0 }
      });
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

  // Filtrar recebíveis
  const filteredReceivables = receivables.filter(receivable =>
    receivable.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receivable.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receivable.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obter status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obter status text
  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  // Obter status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Formatar valor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Obter totais do summary
  const getTotalPending = () => {
    const pending = summary?.summary?.find(item => item._id === 'pending');
    const overdue = summary?.overdue?.total || 0;
    return (pending?.total || 0) + overdue;
  };

  const getTotalOverdue = () => {
    return summary?.overdue?.total || 0;
  };

  const getTotalPaid = () => {
    const paid = summary?.summary?.find(item => item._id === 'paid');
    return paid?.total || 0;
  };

  // Mostrar detalhes da venda
  const showSaleDetails = async (receivable) => {
    try {
      const response = await receivablesAPI.getById(receivable._id);
      setSelectedReceivable(response.data);
      setShowSaleModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da conta');
    }
  };

  // Registrar pagamento
  const handlePayment = async (receivableId, amount, method) => {
    try {
      await receivablesAPI.addPayment(receivableId, { amount, method });
      toast.success('Pagamento registrado com sucesso');
      await loadData(); // Atualizar dados
      setShowSaleModal(false);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
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
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total a Receber</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalPending())}</p>
                <p className="text-sm text-gray-500">pendente</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vencidas</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalOverdue())}</p>
                <p className="text-sm text-gray-500">em atraso ({summary?.overdue?.count || 0})</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recebidas</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalPaid())}</p>
                <p className="text-sm text-gray-500">pagas</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, código ou forma de pagamento..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de Contas a Receber */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Contas dos Clientes</h3>
        </div>
        <div className="card-content">
          {filteredReceivables.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'Nenhuma conta encontrada para esta busca' : 'Nenhuma conta a receber encontrada'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código Venda</th>
                    <th className="text-left py-3 px-4">Cliente</th>
                    <th className="text-left py-3 px-4">Forma Pagamento</th>
                    <th className="text-right py-3 px-4">Valor Total</th>
                    <th className="text-right py-3 px-4">Valor Devido</th>
                    <th className="text-left py-3 px-4">Vencimento</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivables.map((receivable) => (
                    <tr key={receivable._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          {receivable.saleNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {receivable.customerName || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm capitalize">
                          {receivable.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(receivable.originalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(receivable.currentAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(receivable.dueDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(receivable.status)}`}>
                          {getStatusIcon(receivable.status)}
                          <span className="ml-1">{getStatusText(receivable.status)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => showSaleDetails(receivable)}
                            className="btn btn-primary btn-sm"
                            title="Mostrar Detalhes"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Modal de Detalhes da Conta */}
      {showSaleModal && selectedReceivable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detalhes da Conta - {selectedReceivable.saleNumber}</h3>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <div>
                <h4 className="font-medium mb-3">Informações da Conta</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{selectedReceivable.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor Original</p>
                    <p className="font-medium">{formatCurrency(selectedReceivable.originalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor Devido</p>
                    <p className="font-medium">{formatCurrency(selectedReceivable.currentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vencimento</p>
                    <p className="font-medium">{formatDate(selectedReceivable.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Forma Pagamento</p>
                    <p className="font-medium capitalize">{selectedReceivable.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReceivable.status)}`}>
                      {getStatusIcon(selectedReceivable.status)}
                      <span className="ml-1">{getStatusText(selectedReceivable.status)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Parcelas */}
              {selectedReceivable.installments && selectedReceivable.installments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Parcelas</h4>
                  <div className="space-y-2">
                    {selectedReceivable.installments.map((installment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(installment.status)}`}>
                            {getStatusIcon(installment.status)}
                            <span className="ml-1">{getStatusText(installment.status)}</span>
                          </span>
                          <span className="font-medium">Parcela {installment.number}/{selectedReceivable.installments.length}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(installment.amount)}</p>
                          <p className="text-sm text-gray-500">Venc: {formatDate(installment.dueDate)}</p>
                          {installment.paidAt && (
                            <p className="text-sm text-green-600">Pago em: {formatDate(installment.paidAt)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagamentos Realizados */}
              {selectedReceivable.payments && selectedReceivable.payments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Pagamentos Realizados</h4>
                  <div className="space-y-2">
                    {selectedReceivable.payments.map((payment, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{payment.method}</span>
                            <p className="text-sm text-gray-500">
                              Por: {payment.user?.name || 'N/A'} em {formatDate(payment.date)}
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-gray-600">{payment.notes}</p>
                            )}
                          </div>
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedReceivable.notes && (
                <div>
                  <h4 className="font-medium mb-3">Observações</h4>
                  <p className="text-gray-600">{selectedReceivable.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 gap-3">
              {selectedReceivable.status !== 'paid' && selectedReceivable.status !== 'cancelled' && (
                <button
                  onClick={() => handlePayment(selectedReceivable._id, selectedReceivable.currentAmount, 'Dinheiro')}
                  className="btn btn-primary"
                >
                  Registrar Pagamento
                </button>
              )}
              <button
                onClick={() => setShowSaleModal(false)}
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

export default Receivables;
