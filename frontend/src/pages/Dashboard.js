import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dados mockados para relatórios
  const [salesData] = useState([
    { month: 'Jan', total: 15000, orders: 120 },
    { month: 'Fev', total: 18000, orders: 145 },
    { month: 'Mar', total: 22000, orders: 180 },
    { month: 'Abr', total: 19000, orders: 160 },
    { month: 'Mai', total: 25000, orders: 200 },
    { month: 'Jun', total: 28000, orders: 220 }
  ]);

  const [topCustomers] = useState([
    { name: 'João Silva', total: 3500, orders: 15 },
    { name: 'Maria Santos', total: 2800, orders: 12 },
    { name: 'Pedro Oliveira', total: 2200, orders: 8 },
    { name: 'Ana Costa', total: 1800, orders: 10 },
    { name: 'Carlos Silva', total: 1500, orders: 7 }
  ]);

  const [topProducts] = useState([
    { name: 'Produto Exemplo 1', quantity: 150, revenue: 1650 },
    { name: 'Produto Exemplo 2', quantity: 120, revenue: 3060 },
    { name: 'Produto Exemplo 3', quantity: 200, revenue: 1150 },
    { name: 'Produto Exemplo 4', quantity: 80, revenue: 2400 },
    { name: 'Produto Exemplo 5', quantity: 95, revenue: 1425 }
  ]);

  const [topEntries] = useState([
    { name: 'Fornecedor A', quantity: 500, value: 8000 },
    { name: 'Fornecedor B', quantity: 350, value: 5500 },
    { name: 'Fornecedor C', quantity: 280, value: 4200 },
    { name: 'Fornecedor D', quantity: 200, value: 3500 },
    { name: 'Fornecedor E', quantity: 150, value: 2800 }
  ]);

  const currentMonthSales = 28000;
  const lastMonthSales = 25000;
  const totalProducts = 1250;
  const totalCustomers = 48;
  const totalReceivables = 8500;

  const salesGrowth = ((currentMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1);

  const exportReport = (type, format) => {
    alert(`Exportando relatório ${type} em formato ${format.toUpperCase()}...`);
  };

  const generatePeriodReport = () => {
    if (startDate && endDate) {
      alert(`Gerando relatório de ${startDate} a ${endDate}`);
    } else {
      alert('Selecione um período válido');
    }
  };

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
            <option value="custom">Período Personalizado</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vendas do Mês</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">R$ {currentMonthSales.toLocaleString('pt-BR')}</p>
                <div className="flex items-center mt-1">
                  {salesGrowth > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${salesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {salesGrowth}% vs mês anterior
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Produtos em Estoque</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalProducts.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-gray-500">itens</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Clientes Ativos</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalCustomers}</p>
                <p className="text-sm text-gray-500">cadastrados</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Contas a Receber</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">R$ {totalReceivables.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-gray-500">em aberto</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Período Personalizado */}
      {selectedPeriod === 'custom' && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Período Personalizado</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generatePeriodReport}
                  className="btn btn-primary w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relatórios em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vendas por Período */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="card-title">Vendas por Período</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('vendas', 'excel')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </button>
                <button
                  onClick={() => exportReport('vendas', 'pdf')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {salesData.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.month}</p>
                    <p className="text-sm text-gray-500">{item.orders} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {item.total.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total do Período:</span>
                <span className="text-lg font-bold text-green-600">
                  R$ {salesData.reduce((sum, item) => sum + item.total, 0).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clientes que Mais Compram */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="card-title">Clientes que Mais Compram</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('clientes', 'excel')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </button>
                <button
                  onClick={() => exportReport('clientes', 'pdf')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.orders} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {customer.total.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="card-title">Produtos Mais Vendidos</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('produtos-vendidos', 'excel')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </button>
                <button
                  onClick={() => exportReport('produtos-vendidos', 'pdf')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {product.revenue.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Entradas de Produtos */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="card-title">Entradas de Produtos</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('entradas', 'excel')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </button>
                <button
                  onClick={() => exportReport('entradas', 'pdf')}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {topEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-gray-500">{entry.quantity} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {entry.value.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Relatório Completo */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Relatório Completo do Sistema</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => exportReport('completo', 'excel')}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel Completo
            </button>
            <button
              onClick={() => exportReport('completo', 'pdf')}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF Completo
            </button>
            <button
              onClick={() => exportReport('financeiro', 'excel')}
              className="btn btn-secondary"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Relatório Financeiro
            </button>
            <button
              onClick={() => exportReport('estoque', 'excel')}
              className="btn btn-secondary"
            >
              <Package className="w-4 h-4 mr-2" />
              Relatório de Estoque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
