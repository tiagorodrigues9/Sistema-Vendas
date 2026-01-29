import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, DollarSign, Users, Package, ShoppingCart, FileText, Settings, LogOut, Store, Home, BarChart3 } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      permission: 'canViewDashboard'
    },
    {
      name: 'Vendas',
      icon: ShoppingCart,
      path: '/sales',
      permission: 'canMakeSales'
    },
    {
      name: 'Clientes',
      icon: Users,
      path: '/customers',
      permission: 'canManageCustomers'
    },
    {
      name: 'Produtos',
      icon: Package,
      path: '/products',
      permission: 'canManageProducts'
    },
    {
      name: 'Entradas',
      icon: FileText,
      path: '/entries',
      permission: 'canManageEntries'
    },
    {
      name: 'Receber',
      icon: DollarSign,
      path: '/receivables',
      permission: 'canManageReceivables'
    },
    {
      name: 'Admin',
      icon: Settings,
      path: '/admin',
      permission: 'canAccessAdmin'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || user?.permissions[item.permission]
  );

  return (
    <div className="app-container">
      {/* Modern Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 glass transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PDV Pro</h1>
              <p className="text-xs text-gray-500">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Menu Principal
            </h3>
            <div className="space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`} />
                    </div>
                    <span className="ml-3">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.company?.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Modern Header */}
        <header className="glass sticky top-0 z-40 border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
