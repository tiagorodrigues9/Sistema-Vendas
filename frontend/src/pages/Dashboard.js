import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para dados reais
  const [overview, setOverview] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        overviewResponse,
        monthlySalesResponse,
        topCustomersResponse,
        topProductsResponse,
        lowStockResponse,
        movementsResponse
      ] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getMonthlySales(),
        dashboardAPI.getTopCustomers({ period: selectedPeriod }),
        dashboardAPI.getTopProducts({ period: selectedPeriod }),
        dashboardAPI.getLowStock(),
        dashboardAPI.getInventoryMovements({ period: selectedPeriod })
      ]);

      setOverview(overviewResponse.data);
      setMonthlySales(monthlySalesResponse.data.data || []);
      setTopCustomers(topCustomersResponse.data.data || []);
      setTopProducts(topProductsResponse.data.data || []);
      setLowStockProducts(lowStockResponse.data || []);
      setInventoryMovements(movementsResponse.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      
      // Inicializar com valores vazios para evitar erros
      setOverview({
        totalSales: 0,
        monthlySales: { total: 0, count: 0 },
        todaySales: { total: 0, count: 0 },
        lowStockProducts: 0,
        totalCustomers: 0,
        pendingReceivables: { total: 0, count: 0 }
      });
      setMonthlySales([]);
      setTopCustomers([]);
      setTopProducts([]);
      setLowStockProducts([]);
      setInventoryMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Calcular crescimento
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Obter dados do mês atual e anterior para comparação
  const getCurrentAndPreviousMonth = () => {
    const currentMonth = monthlySales.find(sale => {
      const month = new Date().getMonth() + 1;
      return sale.month === month;
    });
    
    const previousMonth = monthlySales.find(sale => {
      const month = new Date().getMonth();
      return sale.month === month;
    });

    return { currentMonth, previousMonth };
  };

  const { currentMonth, previousMonth } = getCurrentAndPreviousMonth();
  const salesGrowth = calculateGrowth(
    currentMonth?.total || 0,
    previousMonth?.total || 0
  );

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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="year">Último Ano</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
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
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(overview?.monthlySales?.total || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {overview?.monthlySales?.count || 0} vendas
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              {Number(salesGrowth) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={Number(salesGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(Number(salesGrowth))}% vs mês anterior
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vendas Hoje</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(overview?.todaySales?.total || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {overview?.todaySales?.count || 0} vendas
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total de Clientes</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {overview?.totalCustomers || 0}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(overview?.pendingReceivables?.total || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {overview?.pendingReceivables?.count || 0} contas
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <div className="card mb-6 border-l-4 border-red-500">
          <div className="card-content">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h4 className="font-medium text-red-800">Atenção: Estoque Baixo</h4>
                <p className="text-red-600">
                  {lowStockProducts.length} produto(s) precisam de reposição
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Vendas Mensais */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vendas Mensais</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {monthlySales.slice(0, 6).map((sale, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">{sale.monthName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-gray-500">{sale.count} vendas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Clientes</h3>
          </div>
          <div className="card-content">
            {topCustomers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum cliente encontrado</p>
            ) : (
              <div className="space-y-4">
                {topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{customer._id}</p>
                        <p className="text-xs text-gray-500">{customer.count} compras</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(customer.totalValue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Produtos Vendidos</h3>
          </div>
          <div className="card-content">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum produto encontrado</p>
            ) : (
              <div className="space-y-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{product._id}</p>
                        <p className="text-xs text-gray-500">
                          {product.totalQuantity} unidades
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(product.totalValue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produtos com Estoque Baixo */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Estoque Baixo</h3>
          </div>
          <div className="card-content">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum produto com estoque baixo</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{product.description}</p>
                        <p className="text-xs text-gray-500">
                          Estoque: {product.quantity} / Mínimo: {product.minStock}
                        </p>
                      </div>
                    </div>
                    <span className="text-red-600 font-medium">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
