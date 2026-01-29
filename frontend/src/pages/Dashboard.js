import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, ShoppingCart, Package, DollarSign, AlertTriangle, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard', {
        params: dateRange
      });
      setData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-gray-600 font-medium">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const statsCards = [
    {
      title: 'Total de Vendas',
      value: data.salesData?.totalSales || 0,
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Faturamento Total',
      value: formatCurrency(data.salesData?.totalRevenue || 0),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.salesData?.avgTicket || 0),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '-2.1%',
      trendUp: false
    },
    {
      title: 'Estoque Baixo',
      value: data.lowStock?.length || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: '+3 itens',
      trendUp: false
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">De:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="form-input text-sm py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Até:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="form-input text-sm py-2"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div key={index} className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" 
                   style={{ backgroundImage: `linear-gradient(135deg, ${stat.color.split(' ')[0].replace('from-', '')}, ${stat.color.split(' ')[1].replace('to-', '')})` }}>
              </div>
              
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h2>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.topProducts?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.product?.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.totalSold} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(item.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">faturamento</p>
                </div>
              </div>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto vendido no período</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Melhores Clientes</h2>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {data.topCustomers?.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {item.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {item.customer?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.totalPurchases} compras
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(item.totalSpent)}
                  </p>
                  <p className="text-xs text-gray-500">total gasto</p>
                </div>
              </div>
            ))}
            {(!data.topCustomers || data.topCustomers.length === 0) && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum cliente no período</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Formas de Pagamento</h2>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {data.paymentMethods?.map((method, index) => {
            const methodNames = {
              cash: 'Dinheiro',
              credit_card: 'Cartão',
              debit_card: 'Débito',
              pix: 'PIX',
              bank_slip: 'Boleto',
              promissory_note: 'Promissória',
              installment: 'Parcelado'
            };

            const methodColors = [
              'from-green-500 to-green-600',
              'from-blue-500 to-blue-600',
              'from-purple-500 to-purple-600',
              'from-orange-500 to-orange-600',
              'from-pink-500 to-pink-600',
              'from-indigo-500 to-indigo-600',
              'from-teal-500 to-teal-600'
            ];

            return (
              <div key={index} className="group cursor-pointer">
                <div className={`bg-gradient-to-br ${methodColors[index % methodColors.length]} p-4 rounded-xl text-white text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                  <p className="text-xs font-medium opacity-90 mb-1">{methodNames[method._id] || method._id}</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(method.total)}
                  </p>
                </div>
              </div>
            );
          })}
          {(!data.paymentMethods || data.paymentMethods.length === 0) && (
            <div className="col-span-full text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma venda no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.lowStock && data.lowStock.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alerta de Estoque Baixo</h2>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{data.lowStock.length} itens</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.lowStock.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-red-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} {product.unit} disponíveis
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600 font-medium">
                    Mínimo: {product.minQuantity} {product.unit}
                  </span>
                  <div className="w-full bg-red-200 rounded-full h-2 ml-3">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((product.quantity / product.minQuantity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
