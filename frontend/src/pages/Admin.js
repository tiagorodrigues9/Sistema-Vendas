import React, { useState, useEffect } from 'react';
import { Users, Building, Check, X, Eye, Edit2, Trash2, Key, UserCheck, BarChart3, Download, AlertCircle, Shield } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para dados reais
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [usageStats, setUsageStats] = useState([]);

  // Carregar dados da API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        pendingUsersRes,
        pendingCompaniesRes,
        allUsersRes,
        allCompaniesRes,
        dashboardRes,
        usageRes
      ] = await Promise.all([
        adminAPI.getPendingUsers(),
        adminAPI.getPendingCompanies(),
        adminAPI.getUsers(),
        adminAPI.getCompanies(),
        adminAPI.getDashboard(),
        adminAPI.getUsage()
      ]);

      setPendingUsers(pendingUsersRes.data || []);
      setPendingCompanies(pendingCompaniesRes.data || []);
      setAllUsers(allUsersRes.data?.users || []);
      setAllCompanies(allCompaniesRes.data?.companies || []);
      setDashboardStats(dashboardRes.data || {});
      setUsageStats(usageRes.data?.companyUsage || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do painel');
      
      // Garantir que os estados permaneçam como arrays em caso de erro
      setPendingUsers([]);
      setPendingCompanies([]);
      setAllUsers([]);
      setAllCompanies([]);
      setDashboardStats({});
      setUsageStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Aprovações
  const handleApproveUser = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      toast.success('Usuário aprovado com sucesso!');
      loadData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleApproveCompany = async (companyId) => {
    try {
      await adminAPI.approveCompany(companyId);
      toast.success('Empresa aprovada com sucesso!');
      loadData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao aprovar empresa');
    }
  };

  const handleRejectUser = (userId) => {
    setPendingUsers(pendingUsers.filter(user => user._id !== userId));
    toast.info('Usuário rejeitado');
  };

  const handleRejectCompany = (companyId) => {
    setPendingCompanies(pendingCompanies.filter(company => company._id !== companyId));
    toast.info('Empresa rejeitada');
  };

  // Funções para gestão de usuários (placeholder)
  const handleChangeUserRole = (userId, newRole) => {
    toast.info('Alteração de papel em desenvolvimento');
  };

  const handleToggleUserStatus = (userId) => {
    toast.info('Alteração de status em desenvolvimento');
  };

  const handleResetPassword = (userEmail) => {
    toast.info('Reset de senha em desenvolvimento');
  };

  const handleDeleteUser = (userId) => {
    toast.info('Exclusão de usuário em desenvolvimento');
  };

  // Funções para gestão de empresas (placeholder)
  const handleToggleCompanyStatus = (companyId) => {
    toast.info('Alteração de status em desenvolvimento');
  };

  const handleDeleteCompany = (companyId) => {
    toast.info('Exclusão de empresa em desenvolvimento');
  };

  // Funções de filtro
  const filteredPendingUsers = (pendingUsers || []).filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingCompanies = (pendingCompanies || []).filter(company =>
    company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = (allUsers || []).filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllCompanies = (allCompanies || []).filter(company =>
    company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <div className="flex gap-3">
          <button
            onClick={() => toast.info('Relatório de usuários em desenvolvimento')}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório de Usuários
          </button>
          <button
            onClick={() => toast.info('Relatório de empresas em desenvolvimento')}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório de Empresas
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'approvals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Aprovações
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'companies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building className="w-4 h-4 inline mr-2" />
              Empresas
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'usage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Uso do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usuários Pendentes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Usuários Aguardando Aprovação</h3>
            </div>
            <div className="card-content">
              {filteredPendingUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum usuário pendente</p>
              ) : (
                <div className="space-y-4">
                  {filteredPendingUsers.map((user) => (
                    <div key={user._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.company?.companyName}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        <p>CNPJ: {user.company?.cnpj}</p>
                        <p>Cadastro: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id)}
                          className="btn btn-error btn-sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Empresas Pendentes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Empresas Aguardando Aprovação</h3>
            </div>
            <div className="card-content">
              {filteredPendingCompanies.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma empresa pendente</p>
              ) : (
                <div className="space-y-4">
                  {filteredPendingCompanies.map((company) => (
                    <div key={company._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{company.companyName}</h4>
                          <p className="text-sm text-gray-500">{company.ownerName}</p>
                          <p className="text-sm text-gray-500">{company.email}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          Pendente
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        <p>CNPJ: {company.cnpj}</p>
                        <p>Telefone: {company.phone || 'Não informado'}</p>
                        <p>Cadastro: {new Date(company.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveCompany(company._id)}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectCompany(company._id)}
                          className="btn btn-error btn-sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Todos os Usuários</h3>
          </div>
          <div className="card-content">
            {filteredAllUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum usuário encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Empresa</th>
                      <th className="text-left py-3 px-4">Função</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Último Acesso</th>
                      <th className="text-center py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.name || '-'}</td>
                        <td className="py-3 px-4">{user.email || '-'}</td>
                        <td className="py-3 px-4">{user.company?.companyName || '-'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeUserRole(user._id, e.target.value)}
                            className="input text-sm"
                          >
                            <option value="administrador">Administrador</option>
                            <option value="dono">Dono</option>
                            <option value="funcionario">Funcionário</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(user._id)}
                              className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                              title={user.isActive ? 'Inativar' : 'Ativar'}
                            >
                              {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.email)}
                              className="btn btn-secondary btn-sm"
                              title="Resetar Senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn btn-error btn-sm"
                              title="Excluir"
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
      )}

      {activeTab === 'companies' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Todas as Empresas</h3>
          </div>
          <div className="card-content">
            {filteredAllCompanies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma empresa encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Empresa</th>
                      <th className="text-left py-3 px-4">Dono</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">CNPJ</th>
                      <th className="text-left py-3 px-4">Plano</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllCompanies.map((company) => (
                      <tr key={company._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{company.companyName || '-'}</td>
                        <td className="py-3 px-4">{company.ownerName || '-'}</td>
                        <td className="py-3 px-4">{company.email || '-'}</td>
                        <td className="py-3 px-4 text-sm">{company.cnpj || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                            {company.plan || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            company.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {company.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleToggleCompanyStatus(company._id)}
                              className={`btn btn-sm ${company.isActive ? 'btn-warning' : 'btn-success'}`}
                              title={company.isActive ? 'Inativar' : 'Ativar'}
                            >
                              {company.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCompany(company._id)}
                              className="btn btn-error btn-sm"
                              title="Excluir"
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
      )}

      {activeTab === 'usage' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Relatório de Uso do Sistema</h3>
          </div>
          <div className="card-content">
            {usageStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum dado de uso encontrado</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Empresa</th>
                    <th className="text-center py-3 px-4">Total de Vendas</th>
                    <th className="text-left py-3 px-4">Faturamento</th>
                    <th className="text-left py-3 px-4">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {usageStats.map((stat, index) => (
                    <tr key={stat._id || index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{stat.companyName || '-'}</td>
                      <td className="py-3 px-4 text-center">{stat.sales || 0}</td>
                      <td className="py-3 px-4">
                        {stat.total ? `R$ ${stat.total.toFixed(2)}` : 'R$ 0,00'}
                      </td>
                      <td className="py-3 px-4">
                        {stat.sales && stat.total ? `R$ ${(stat.total / stat.sales).toFixed(2)}` : 'R$ 0,00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
