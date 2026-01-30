import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ShoppingCart, AlertCircle, Building, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import { validateEmail, validateCNPJ } from '../utils/helpers';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      await registerUser({
        cnpj: data.cnpj.replace(/\D/g, ''),
        companyName: data.companyName,
        ownerName: data.ownerName,
        email: data.email,
        password: data.password
      });
      
      toast.success('Cadastro realizado com sucesso! Aguarde aprovação do administrador.');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer cadastro';
      
      if (error.response?.status === 400) {
        // Handle specific validation errors
        if (message.includes('CNPJ') || message.includes('e-mail')) {
          setError('root', {
            type: 'manual',
            message
          });
        } else {
          toast.error(message);
        }
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
            Cadastre sua empresa para começar a usar o sistema PDV
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                Informações da Empresa
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

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                  Nome do Dono
                </label>
                <div className="mt-1">
                  <input
                    {...register('ownerName', {
                      required: 'Nome do dono é obrigatório',
                      minLength: {
                        value: 3,
                        message: 'Nome deve ter pelo menos 3 caracteres'
                      }
                    })}
                    type="text"
                    className={`input ${errors.ownerName ? 'border-error-500' : ''}`}
                    placeholder="Seu nome completo"
                  />
                  {errors.ownerName && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.ownerName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações de Acesso
              </h3>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <div className="mt-1">
                  <input
                    {...register('email', {
                      required: 'E-mail é obrigatório',
                      validate: (value) => validateEmail(value) || 'E-mail inválido'
                    })}
                    type="email"
                    autoComplete="email"
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
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Senha deve conter letra maiúscula, minúscula e número'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'border-error-500' : ''}`}
                    placeholder="••••••••"
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
                      required: 'Confirme sua senha',
                      validate: (value) => value === password || 'As senhas não coincidem'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.confirmPassword ? 'border-error-500' : ''}`}
                    placeholder="••••••••"
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

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                {...register('terms', {
                  required: 'Você deve aceitar os termos e condições'
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Eu concordo com os{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  termos e condições
                </a>{' '}
                e a{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  política de privacidade
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-error-600">
                {errors.terms.message}
              </p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Cadastrando...
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Faça login
              </Link>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 Sistema PDV. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
