import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('@PDV:token');
      
      if (token) {
        try {
          const response = await authAPI.me();
          setUser(response.data.user);
          setCompany(response.data.company);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('@PDV:token');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      const { token, user: userData, company: companyData } = response.data;
      
      localStorage.setItem('@PDV:token', token);
      localStorage.setItem('@PDV:user', JSON.stringify(userData));
      localStorage.setItem('@PDV:company', JSON.stringify(companyData));
      
      setUser(userData);
      setCompany(companyData);
      setIsAuthenticated(true);
      
      toast.success(`Bem-vindo, ${userData.name}!`);
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Cadastro realizado com sucesso! Aguarde aprovação.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer cadastro';
      toast.error(message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('@PDV:token');
      localStorage.removeItem('@PDV:user');
      localStorage.removeItem('@PDV:company');
      
      setUser(null);
      setCompany(null);
      setIsAuthenticated(false);
      
      toast.success('Logout realizado com sucesso');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    localStorage.setItem('@PDV:user', JSON.stringify({ ...user, ...userData }));
  }, [user]);

  const updateCompany = useCallback((companyData) => {
    setCompany(prev => ({ ...prev, ...companyData }));
    localStorage.setItem('@PDV:company', JSON.stringify({ ...company, ...companyData }));
  }, [company]);

  const hasPermission = useCallback((requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'funcionario': 1,
      'dono': 2,
      'administrador': 3
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }, [user]);

  const canAccess = useCallback((route) => {
    if (!user) return false;
    
    const permissions = {
      'funcionario': ['vendas', 'clientes'],
      'dono': ['vendas', 'clientes', 'produtos', 'entradas', 'dashboard', 'contas-receber'],
      'administrador': ['vendas', 'clientes', 'produtos', 'entradas', 'dashboard', 'contas-receber', 'admin']
    };
    
    return permissions[user.role]?.includes(route) || false;
  }, [user]);

  const value = {
    user,
    company,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updateCompany,
    hasPermission,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
