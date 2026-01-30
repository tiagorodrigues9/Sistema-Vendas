import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ShoppingCart, AlertCircle, Building, User, Mail, Lock, Search, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import { validateEmail, validateCNPJ } from '../utils/helpers';
import { authAPI, companiesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);
  const [companyFound, setCompanyFound] = useState(null);
  const [step, setStep] = useState('initial'); // initial, cnpj, register, new-company
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
    reset
  } = useForm();

  const password = watch('password');

  // Função para buscar empresa por CNPJ
  const searchCompanyByCNPJ = async (cnpj) => {
    if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
      return;
    }

    setSearchingCNPJ(true);
    try {
      const cleanedCnpj = cnpj.replace(/\D/g, '');
      const response = await companiesAPI.getByCNPJ(cleanedCnpj);
      
      if (response.data) {
        setCompanyFound(response.data);
        toast.success('Empresa encontrada!');
        setStep('register');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setCompanyFound(null);
        toast('Empresa não encontrada. Você pode cadastrar uma nova empresa.', {
          icon: 'ℹ️',
        });
        setStep('new-company');
      } else {
        toast.error('Erro ao buscar empresa');
      }
    } finally {
      setSearchingCNPJ(false);
    }
  };

  // Função para registrar usuário em empresa existente
  const onSubmitExistingCompany = async (data) => {
    setIsLoading(true);
    
    try {
      await authAPI.registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        companyId: companyFound._id
      });
      
      toast.success('Cadastro realizado com sucesso! Aguarde aprovação do administrador.');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer cadastro';
      
      if (error.response?.status === 400) {
        setError('root', {
          type: 'manual',
          message
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para registrar nova empresa + usuário
  const onSubmitNewCompany = async (data) => {
    setIsLoading(true);
    
    try {
      await registerUser({
        cnpj: data.cnpj.replace(/\D/g, ''),
        companyName: data.companyName,
        ownerName: data.name,
        email: data.email,
        password: data.password
      });
      
      toast.success('Cadastro realizado com sucesso! Aguarde aprovação do administrador.');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer cadastro';
      
      if (error.response?.status === 400) {
        setError('root', {
          type: 'manual',
          message
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return value;
  };

  const resetForm = () => {
    reset();
    setCompanyFound(null);
    setStep('initial');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'initial' && 'Escolha como deseja criar sua conta'}
            {step === 'cnpj' && 'Verificando empresa...'}
            {step === 'register' && 'Vincular-se à empresa existente'}
            {step === 'new-company' && 'Cadastrar nova empresa'}
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Initial Choice */}
          {step === 'initial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                Já existe uma empresa cadastrada?
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setStep('cnpj')}
                  className="flex items-center justify-center px-6 py-4 border-2 border-primary-600 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Sim, buscar empresa
                </button>
                
                <button
                  onClick={() => setStep('new-company')}
                  className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Building className="h-5 w-5 mr-2" />
                  Não, cadastrar nova empresa
                </button>
              </div>
            </div>
          )}

          {/* Step 2: CNPJ Search */}
          {step === 'cnpj' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="searchCnpj" className="block text-sm font-medium text-gray-700">
                  CNPJ da Empresa
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('searchCnpj', {
                      required: 'CNPJ é obrigatório',
                      validate: (value) => {
                        const cleaned = value.replace(/\D/g, '');
                        return cleaned.length === 14 || 'CNPJ deve ter 14 dígitos';
                      },
                      pattern: {
                        value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                        message: 'Formato inválido. Use: 00.000.000/0000-00'
                      }
                    })}
                    type="text"
                    maxLength="18"
                    className={`input ${errors.searchCnpj ? 'border-error-500' : ''}`}
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => {
                      e.target.value = formatCNPJ(e.target.value);
                      setValue('searchCnpj', e.target.value);
                    }}
                  />
                  {searchingCNPJ && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
                {errors.searchCnpj && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.searchCnpj.message}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => searchCompanyByCNPJ(watch('searchCnpj'))}
                  disabled={searchingCNPJ || !watch('searchCnpj') || errors.searchCnpj}
                  className="flex-1 btn btn-primary"
                >
                  {searchingCNPJ ? 'Buscando...' : 'Buscar Empresa'}
                </button>
                
                <button
                  onClick={resetForm}
                  type="button"
                  className="btn btn-secondary"
                >
                  Voltar
                </button>
              </div>

              {/* Company Found */}
              {companyFound && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">
                        Empresa encontrada
                      </h4>
                      <div className="mt-2 text-sm text-green-700">
                        <p><strong>Nome:</strong> {companyFound.companyName}</p>
                        <p><strong>CNPJ:</strong> {companyFound.cnpj}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Register User in Existing Company */}
          {step === 'register' && companyFound && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitExistingCompany)}>
              {/* Company Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <Building className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Você será vinculado à empresa:
                    </h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <p><strong>{companyFound.companyName}</strong></p>
                      <p>CNPJ: {companyFound.cnpj}</p>
                      <p className="text-xs mt-1">Sua permissão será: Funcionário</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                    <div className="ml-3">
                      <p className="text-sm text-error-800">
                        {errors.root.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Seus Dados
                </h3>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome Completo
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('name', {
                        required: 'Nome é obrigatório',
                        minLength: {
                          value: 3,
                          message: 'Nome deve ter pelo menos 3 caracteres'
                        }
                      })}
                      type="text"
                      className={`input ${errors.name ? 'border-error-500' : ''}`}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido'
                        }
                      })}
                      type="email"
                      className={`input ${errors.email ? 'border-error-500' : ''}`}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password', {
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-10 ${errors.password ? 'border-error-500' : ''}`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Confirmação de senha é obrigatória',
                        validate: (value) => value === password || 'Senhas não coincidem'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`input pr-10 ${errors.confirmPassword ? 'border-error-500' : ''}`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn btn-primary"
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar como Funcionário'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Voltar
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Register New Company */}
          {step === 'new-company' && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitNewCompany)}>
              {/* Error Message */}
              {errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                    <div className="ml-3">
                      <p className="text-sm text-error-800">
                        {errors.root.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Dados da Empresa
                </h3>

                {/* CNPJ */}
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                    CNPJ
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('cnpj', {
                        required: 'CNPJ é obrigatório',
                        validate: (value) => {
                          const cleaned = value.replace(/\D/g, '');
                          return cleaned.length === 14 || 'CNPJ deve ter 14 dígitos';
                        },
                        pattern: {
                          value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                          message: 'Formato inválido. Use: 00.000.000/0000-00'
                        }
                      })}
                      type="text"
                      maxLength="18"
                      className={`input ${errors.cnpj ? 'border-error-500' : ''}`}
                      placeholder="00.000.000/0000-00"
                      onChange={(e) => {
                        e.target.value = formatCNPJ(e.target.value);
                      }}
                    />
                    {errors.cnpj && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.cnpj.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Nome da Empresa
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('companyName', {
                        required: 'Nome da empresa é obrigatório',
                        minLength: {
                          value: 3,
                          message: 'Nome deve ter pelo menos 3 caracteres'
                        }
                      })}
                      type="text"
                      className={`input ${errors.companyName ? 'border-error-500' : ''}`}
                      placeholder="Nome da sua empresa"
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.companyName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Seus Dados
                </h3>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome Completo
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('name', {
                        required: 'Nome é obrigatório',
                        minLength: {
                          value: 3,
                          message: 'Nome deve ter pelo menos 3 caracteres'
                        }
                      })}
                      type="text"
                      className={`input ${errors.name ? 'border-error-500' : ''}`}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('email', {
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido'
                        }
                      })}
                      type="email"
                      className={`input ${errors.email ? 'border-error-500' : ''}`}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password', {
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-10 ${errors.password ? 'border-error-500' : ''}`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Confirmação de senha é obrigatória',
                        validate: (value) => value === password || 'Senhas não coincidem'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`input pr-10 ${errors.confirmPassword ? 'border-error-500' : ''}`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Ao cadastrar uma nova empresa, você será definido como <strong>Dono</strong> com permissões administrativas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn btn-primary"
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Empresa e Usuário'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Voltar
                </button>
              </div>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:text-primary-500">
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            &copy; 2026 Sistema PDV. Desenvolvido por Tiago Rodrigues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
