import React, { useState } from 'react';
import { Search, Eye, DollarSign, Calendar, User, FileText, Check, AlertCircle, Clock } from 'lucide-react';

const Receivables = () => {
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [receivables] = useState([
    {
      id: 1,
      saleCode: 'VENDA-001',
      customerName: 'João Silva',
      paymentMethod: 'Boleto',
      totalValue: 1500.00,
      dueDate: '15/02/2026',
      status: 'pending',
      installments: [
        { number: 1, value: 500, dueDate: '15/02/2026', status: 'paid' },
        { number: 2, value: 500, dueDate: '15/03/2026', status: 'pending' },
        { number: 3, value: 500, dueDate: '15/04/2026', status: 'pending' }
      ]
    },
    {
      id: 2,
      saleCode: 'VENDA-002',
      customerName: 'Maria Santos',
      paymentMethod: 'Promissória',
      totalValue: 2800.00,
      dueDate: '20/02/2026',
      status: 'pending',
      installments: [
        { number: 1, value: 1400, dueDate: '20/02/2026', status: 'pending' },
        { number: 2, value: 1400, dueDate: '20/03/2026', status: 'pending' }
      ]
    },
    {
      id: 3,
      saleCode: 'VENDA-003',
      customerName: 'Pedro Oliveira',
      paymentMethod: 'Parcelado',
      totalValue: 900.00,
      dueDate: '10/02/2026',
      status: 'overdue',
      installments: [
        { number: 1, value: 300, dueDate: '10/01/2026', status: 'paid' },
        { number: 2, value: 300, dueDate: '10/02/2026', status: 'overdue' },
        { number: 3, value: 300, dueDate: '10/03/2026', status: 'pending' }
      ]
    },
    {
      id: 4,
      saleCode: 'VENDA-004',
      customerName: 'Ana Costa',
      paymentMethod: 'Boleto',
      totalValue: 2200.00,
      dueDate: '25/03/2026',
      status: 'pending',
      installments: [
        { number: 1, value: 2200, dueDate: '25/03/2026', status: 'pending' }
      ]
    }
  ]);

  const [saleDetails] = useState({
    'VENDA-001': {
      date: '15/01/2026',
      items: [
        { description: 'Produto Exemplo 1', quantity: 2, unitPrice: 250, total: 500 },
        { description: 'Produto Exemplo 2', quantity: 1, unitPrice: 1000, total: 1000 }
      ],
      payments: [
        { method: 'Boleto', amount: 1500, installments: 3 }
      ]
    },
    'VENDA-002': {
      date: '20/01/2026',
      items: [
        { description: 'Produto Exemplo 3', quantity: 3, unitPrice: 400, total: 1200 },
        { description: 'Produto Exemplo 4', quantity: 2, unitPrice: 800, total: 1600 }
      ],
      payments: [
        { method: 'Promissória', amount: 2800, installments: 2 }
      ]
    }
  });

  const filteredReceivables = receivables.filter(receivable =>
    receivable.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receivable.saleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receivable.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const showSaleDetails = (receivable) => {
    setSelectedReceivable(receivable);
    setShowSaleModal(true);
  };

  const getTotalPending = () => {
    return receivables.reduce((total, receivable) => {
      const pendingInstallments = receivable.installments.filter(inst => inst.status === 'pending' || inst.status === 'overdue');
      return total + pendingInstallments.reduce((sum, inst) => sum + inst.value, 0);
    }, 0);
  };

  const getTotalOverdue = () => {
    return receivables.reduce((total, receivable) => {
      const overdueInstallments = receivable.installments.filter(inst => inst.status === 'overdue');
      return total + overdueInstallments.reduce((sum, inst) => sum + inst.value, 0);
    }, 0);
  };

  const getTotalPaid = () => {
    return receivables.reduce((total, receivable) => {
      const paidInstallments = receivable.installments.filter(inst => inst.status === 'paid');
      return total + paidInstallments.reduce((sum, inst) => sum + inst.value, 0);
    }, 0);
  };

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
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
                <p className="text-2xl font-bold text-blue-600">R$ {getTotalPending().toLocaleString('pt-BR')}</p>
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
                <p className="text-2xl font-bold text-red-600">R$ {getTotalOverdue().toLocaleString('pt-BR')}</p>
                <p className="text-sm text-gray-500">em atraso</p>
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
                <p className="text-2xl font-bold text-green-600">R$ {getTotalPaid().toLocaleString('pt-BR')}</p>
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
            <p className="text-gray-500 text-center py-8">Nenhuma conta a receber encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código Venda</th>
                    <th className="text-left py-3 px-4">Cliente</th>
                    <th className="text-left py-3 px-4">Forma Pagamento</th>
                    <th className="text-right py-3 px-4">Valor Total</th>
                    <th className="text-left py-3 px-4">Vencimento</th>
                    <th className="text-center py-3 px-4">Parcelas</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivables.map((receivable) => (
                    <tr key={receivable.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          {receivable.saleCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {receivable.customerName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                          {receivable.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {receivable.totalValue.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {receivable.dueDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {receivable.installments.map((installment, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(installment.status)}`}>
                                {getStatusIcon(installment.status)}
                                <span className="ml-1">{installment.number}/{receivable.installments.length}</span>
                              </span>
                              <span className="text-sm">R$ {installment.value.toLocaleString('pt-BR')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => showSaleDetails(receivable)}
                            className="btn btn-primary btn-sm"
                            title="Mostrar Venda"
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

      {/* Modal de Detalhes da Venda */}
      {showSaleModal && selectedReceivable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detalhes da Venda {selectedReceivable.saleCode}</h3>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {saleDetails[selectedReceivable.saleCode] && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div>
                  <h4 className="font-medium mb-3">Informações da Venda</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-medium">{saleDetails[selectedReceivable.saleCode].date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-medium">{selectedReceivable.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor Total</p>
                      <p className="font-medium">R$ {selectedReceivable.totalValue.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div>
                  <h4 className="font-medium mb-3">Itens da Venda</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-4 text-sm">Descrição</th>
                          <th className="text-center py-2 px-4 text-sm">Qtd</th>
                          <th className="text-right py-2 px-4 text-sm">Valor Unit.</th>
                          <th className="text-right py-2 px-4 text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleDetails[selectedReceivable.saleCode].items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-4 text-sm">{item.description}</td>
                            <td className="py-2 px-4 text-center text-sm">{item.quantity}</td>
                            <td className="py-2 px-4 text-right text-sm">R$ {item.unitPrice.toLocaleString('pt-BR')}</td>
                            <td className="py-2 px-4 text-right text-sm font-medium">R$ {item.total.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div>
                  <h4 className="font-medium mb-3">Formas de Pagamento</h4>
                  <div className="space-y-2">
                    {saleDetails[selectedReceivable.saleCode].payments.map((payment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{payment.method}</span>
                          <span>R$ {payment.amount.toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-sm text-gray-500">{payment.installments} parcela(s)</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parcelas */}
                <div>
                  <h4 className="font-medium mb-3">Situação das Parcelas</h4>
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
                          <p className="font-medium">R$ {installment.value.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-500">Venc: {installment.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
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
