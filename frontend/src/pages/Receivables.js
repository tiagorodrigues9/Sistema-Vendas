import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Receivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);

  useEffect(() => {
    loadReceivables();
    loadOverdue();
  }, [search, status]);

  const loadReceivables = async () => {
    try {
      const response = await api.get('/receivables', {
        params: { search, status }
      });
      setReceivables(response.data.receivables);
    } catch (error) {
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdue = async () => {
    try {
      const response = await api.get('/receivables/overdue');
      setOverdue(response.data);
    } catch (error) {
      console.error('Error loading overdue:', error);
    }
  };

  const updatePaymentStatus = async (saleId, paymentId, newStatus) => {
    try {
      await api.put(`/receivables/${saleId}/payment/${paymentId}`, {
        status: newStatus
      });
      toast.success('Status atualizado com sucesso!');
      loadReceivables();
      loadOverdue();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      bank_slip: 'Boleto',
      promissory_note: 'Promissória',
      installment: 'Parcelado'
    };
    return methods[method] || method;
  };

  if (loading) return <LoadingSpinner />;

  const displayData = showOverdue ? overdue : receivables;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
        <button
          onClick={() => setShowOverdue(!showOverdue)}
          className={`btn ${showOverdue ? 'btn-danger' : 'btn-outline'}`}
        >
          <AlertCircle className="w-4 h-4" />
          {showOverdue ? 'Todas as Contas' : `Vencidas (${overdue.length})`}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {receivables.filter(r => r.payment.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-semibold text-gray-900">{overdue.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total a Receber</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  receivables
                    .filter(r => r.payment.status === 'pending')
                    .reduce((sum, r) => sum + r.payment.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou número da venda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          
          {!showOverdue && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          )}
        </div>
      </div>

      {/* Receivables List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Venda</th>
                <th>Cliente</th>
                <th>Forma Pagamento</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((receivable) => (
                <tr key={`${receivable._id}-${receivable.payment._id}`}>
                  <td className="font-medium">{receivable.saleNumber}</td>
                  <td>{receivable.customerName}</td>
                  <td>{getPaymentMethodText(receivable.payment.method)}</td>
                  <td className="font-medium">{formatCurrency(receivable.payment.amount)}</td>
                  <td>
                    {receivable.payment.dueDate ? (
                      new Date(receivable.payment.dueDate).toLocaleDateString('pt-BR')
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(receivable.payment.status)}
                      <span>{getStatusText(receivable.payment.status)}</span>
                    </div>
                  </td>
                  <td>
                    {receivable.payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePaymentStatus(receivable._id, receivable.payment._id, 'paid')}
                          className="btn btn-sm btn-success"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {displayData.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              {showOverdue ? 'Nenhuma conta vencida' : 'Nenhuma conta a receber encontrada'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Receivables;
