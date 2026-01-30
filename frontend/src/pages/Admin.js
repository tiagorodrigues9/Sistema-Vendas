import React, { useState } from 'react';
import { Users, Building, Check, X, Eye, Edit2, Trash2, Key, UserCheck, BarChart3, Download, AlertCircle, Shield } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: 1,
      name: 'Novo Usuario 1',
      email: 'novo1@email.com',
      role: 'dono',
      company: 'Empresa Nova 1',
      cnpj: '12345678000123',
      registrationDate: '20/01/2026',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Novo Usuario 2',
      email: 'novo2@email.com',
      role: 'funcionario',
      company: 'Empresa Nova 2',
      cnpj: '98765432000198',
      registrationDate: '21/01/2026',
      status: 'pending'
    }
  ]);

  const [pendingCompanies, setPendingCompanies] = useState([
    {
      id: 1,
      companyName: 'Empresa Nova 1',
      ownerName: 'Novo Usuario 1',
      email: 'contato@empresanova1.com',
      cnpj: '12345678000123',
      phone: '11999999999',
      registrationDate: '20/01/2026',
      status: 'pending'
    }
  ]);

  const [allUsers, setAllUsers] = useState([
    {
      id: 1,
      name: 'Administrador Sistema',
      email: 'tr364634@gmail.com',
      role: 'administrador',
      company: 'Sistema PDV Admin',
      isActive: true,
      isApproved: true,
      lastLogin: '29/01/2026 23:00',
      registrationDate: '01/01/2026'
    },
    {
      id: 2,
      name: 'Usuario Ativo 1',
      email: 'usuario1@email.com',
      role: 'dono',
      company: 'Empresa Ativa 1',
      isActive: true,
      isApproved: true,
      lastLogin: '28/01/2026 15:30',
      registrationDate: '15/01/2026'
    },
    {
      id: 3,
      name: 'Usuario Inativo',
      email: 'inativo@email.com',
      role: 'funcionario',
      company: 'Empresa Ativa 2',
      isActive: false,
      isApproved: true,
      lastLogin: '10/01/2026 09:00',
      registrationDate: '05/01/2026'
    }
  ]);

  const [allCompanies, setAllCompanies] = useState([
    {
      id: 1,
      companyName: 'Sistema PDV Admin',
      ownerName: 'Administrador Sistema',
      email: 'tr364634@gmail.com',
      cnpj: '00000000000000',
      isActive: true,
      isApproved: true,
      plan: 'enterprise',
      registrationDate: '01/01/2026'
    },
    {
      id: 2,
      companyName: 'Empresa Ativa 1',
      ownerName: 'Usuario Ativo 1',
      email: 'contato@empresaativa1.com',
      cnpj: '11111111000111',
      isActive: true,
      isApproved: true,
      plan: 'premium',
      registrationDate: '15/01/2026'
    }
  ]);

  const [usageStats] = useState([
    { userEmail: 'usuario1@email.com', loginCount: 45, lastAccess: '28/01/2026 15:30', avgSessionTime: '2h 15min' },
    { userEmail: 'usuario2@email.com', loginCount: 32, lastAccess: '27/01/2026 10:20', avgSessionTime: '1h 45min' },
    { userEmail: 'usuario3@email.com', loginCount: 28, lastAccess: '26/01/2026 14:10', avgSessionTime: '3h 05min' }
  ]);

  const approveUser = (userId) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    const user = pendingUsers.find(u => u.id === userId);
    if (user) {
      setAllUsers([...allUsers, { ...user, isActive: true, isApproved: true, lastLogin: null }]);
    }
  };

  const rejectUser = (userId) => {
    setPendingUsers(pendingUsers.filter(user => user.id !== userId));
  };

  const approveCompany = (companyId) => {
    setPendingCompanies(pendingCompanies.filter(company => company.id !== companyId));
    const company = pendingCompanies.find(c => c.id === companyId);
    if (company) {
      setAllCompanies([...allCompanies, { ...company, isActive: true, isApproved: true, plan: 'basic' }]);
    }
  };

  const rejectCompany = (companyId) => {
    setPendingCompanies(pendingCompanies.filter(company => company.id !== companyId));
  };

  const toggleUserStatus = (userId) => {
    setAllUsers(allUsers.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const toggleCompanyStatus = (companyId) => {
    setAllCompanies(allCompanies.map(company =>
      company.id === companyId ? { ...company, isActive: !company.isActive } : company
    ));
  };

  const deleteUser = (userId) => {
    setAllUsers(allUsers.filter(user => user.id !== userId));
  };

  const deleteCompany = (companyId) => {
    setAllCompanies(allCompanies.filter(company => company.id !== companyId));
  };

  const resetPassword = (userEmail) => {
    alert(`Senha resetada para: ${userEmail}`);
  };

  const changeUserRole = (userId, newRole) => {
    setAllUsers(allUsers.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const generateReport = (type) => {
    alert(`Gerando relatório ${type}...`);
  };

  const filteredPendingUsers = pendingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingCompanies = pendingCompanies.filter(company =>
    company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllCompanies = allCompanies.filter(company =>
    company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <div className="flex gap-3">
          <button
            onClick={() => generateReport('usuarios')}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório de Usuários
          </button>
          <button
            onClick={() => generateReport('empresas')}
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
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.company}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        <p>CNPJ: {user.cnpj}</p>
                        <p>Cadastro: {user.registrationDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
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
                    <div key={company.id} className="border rounded-lg p-4">
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
                        <p>Telefone: {company.phone}</p>
                        <p>Cadastro: {company.registrationDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveCompany(company.id)}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => rejectCompany(company.id)}
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
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{user.company}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => changeUserRole(user.id, e.target.value)}
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
                        <td className="py-3 px-4 text-sm">{user.lastLogin || 'Nunca'}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                              title={user.isActive ? 'Inativar' : 'Ativar'}
                            >
                              {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => resetPassword(user.email)}
                              className="btn btn-secondary btn-sm"
                              title="Resetar Senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
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
                      <tr key={company.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{company.companyName}</td>
                        <td className="py-3 px-4">{company.ownerName}</td>
                        <td className="py-3 px-4">{company.email}</td>
                        <td className="py-3 px-4 text-sm">{company.cnpj}</td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                            {company.plan}
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
                              onClick={() => toggleCompanyStatus(company.id)}
                              className={`btn btn-sm ${company.isActive ? 'btn-warning' : 'btn-success'}`}
                              title={company.isActive ? 'Inativar' : 'Ativar'}
                            >
                              {company.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteCompany(company.id)}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Email do Usuário</th>
                    <th className="text-center py-3 px-4">Total de Logins</th>
                    <th className="text-left py-3 px-4">Último Acesso</th>
                    <th className="text-left py-3 px-4">Tempo Médio de Sessão</th>
                  </tr>
                </thead>
                <tbody>
                  {usageStats.map((stat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{stat.userEmail}</td>
                      <td className="py-3 px-4 text-center">{stat.loginCount}</td>
                      <td className="py-3 px-4">{stat.lastAccess}</td>
                      <td className="py-3 px-4">{stat.avgSessionTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
