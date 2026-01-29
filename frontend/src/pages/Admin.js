import React, { useState, useEffect } from 'react';
import { Settings, Users, Building, CheckCircle, XCircle, Clock, TrendingUp, Eye, Edit, Trash2, Key } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadCompanies();
    loadUsers();
    loadPendingCompanies();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/admin/companies/usage');
      setCompanies(response.data);
    } catch (error) {
      toast.error('Erro ao carregar empresas');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users/activity');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    }
  };

  const loadPendingCompanies = async () => {
    try {
      const response = await api.get('/admin/companies/pending');
      setPendingCompanies(response.data);
    } catch (error) {
      toast.error('Erro ao carregar empresas pendentes');
    } finally {
      setLoading(false);
    }
  };

  const approveCompany = async (companyId) => {
    try {
      await api.put(`/admin/companies/${companyId}/approve`);
      toast.success('Empresa aprovada com sucesso!');
      loadPendingCompanies();
      loadCompanies();
      loadStats();
    } catch (error) {
      toast.error('Erro ao aprovar empresa');
    }
  };

  const rejectCompany = async (companyId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta empresa?')) return;
    
    try {
      await api.put(`/admin/companies/${companyId}/reject`);
      toast.success('Empresa rejeitada com sucesso!');
      loadPendingCompanies();
      loadStats();
    } catch (error) {
      toast.error('Erro ao rejeitar empresa');
    }
  };

  const deactivateUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?')) return;
    
    try {
      await api.put(`/admin/users/${userId}`, { isActive: false });
      toast.success('Usuário desativado com sucesso!');
      loadUsers();
    } catch (error) {
      toast.error('Erro ao desativar usuário');
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Digite a nova senha:');
    if (!newPassword) return;
    
    try {
      await api.put(`/admin/users/${userId}/reset-password`, {
        newPassword
      });
      toast.success('Senha resetada com sucesso!');
    } catch (error) {
      toast.error('Erro ao resetar senha');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'pending', label: 'Aprovações', icon: Clock },
            { id: 'companies', label: 'Empresas', icon: Building },
            { id: 'users', label: 'Usuários', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalCompanies}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingCompanies}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Companies Tab */}
      {activeTab === 'pending' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Empresas Aguardando Aprovação</h2>
          
          {pendingCompanies.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Nenhuma empresa pendente</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>CNPJ</th>
                    <th>Responsável</th>
                    <th>Email</th>
                    <th>Data Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies.map((company) => (
                    <tr key={company._id}>
                      <td className="font-medium">{company.companyName}</td>
                      <td>{company.cnpj}</td>
                      <td>{company.ownerName}</td>
                      <td>{company.email}</td>
                      <td>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveCompany(company._id)}
                            className="btn btn-sm btn-success"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rejectCompany(company._id)}
                            className="btn btn-sm btn-danger"
                          >
                            <XCircle className="w-4 h-4" />
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
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Empresas</h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CNPJ</th>
                  <th>Status</th>
                  <th>Usuários</th>
                  <th>Vendas</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company._id}>
                    <td className="font-medium">{company.companyName}</td>
                    <td>{company.cnpj}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'approved' ? 'bg-green-100 text-green-800' :
                        company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {company.status === 'approved' ? 'Aprovada' :
                         company.status === 'pending' ? 'Pendente' : 'Inativa'}
                      </span>
                    </td>
                    <td>{company.userCount || 0}</td>
                    <td>{company.saleCount || 0}</td>
                    <td>{formatCurrency(company.totalRevenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {companies.length === 0 && (
              <p className="text-center py-8 text-gray-500">Nenhuma empresa encontrada</p>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Usuários</h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' :
                         user.role === 'owner' ? 'Dono' : 'Funcionário'}
                      </span>
                    </td>
                    <td>{user.company?.companyName || '-'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resetPassword(user._id)}
                          className="btn btn-sm btn-outline"
                          title="Resetar Senha"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {user.isActive && (
                          <button
                            onClick={() => deactivateUser(user._id)}
                            className="btn btn-sm btn-danger"
                            title="Desativar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <p className="text-center py-8 text-gray-500">Nenhum usuário encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
