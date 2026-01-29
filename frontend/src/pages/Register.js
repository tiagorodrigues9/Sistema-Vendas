import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Store, Building, User, Mail, Lock, Eye, EyeOff, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const cnpjValue = watch('cnpj');

  const formatCNPJ = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return cleaned;
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      navigate('/login');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Store className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cadastre sua Empresa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Preencha os dados abaixo para solicitar acesso ao sistema
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="cnpj" className="form-label">
                CNPJ da Empresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('cnpj', {
                    required: 'CNPJ é obrigatório',
                    pattern: {
                      value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                      message: 'CNPJ inválido'
                    }
                  })}
                  type="text"
                  className="form-input pl-10"
                  placeholder="00.000.000/0000-00"
                  value={cnpjValue}
                  onChange={(e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  }}
                />
              </div>
              {errors.cnpj && (
                <p className="form-error">{errors.cnpj.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="companyName" className="form-label">
                Nome da Empresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('companyName', {
                    required: 'Nome da empresa é obrigatório'
                  })}
                  type="text"
                  className="form-input pl-10"
                  placeholder="Nome da sua empresa"
                />
              </div>
              {errors.companyName && (
                <p className="form-error">{errors.companyName.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="ownerName" className="form-label">
                Nome do Responsável
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('ownerName', {
                    required: 'Nome do responsável é obrigatório'
                  })}
                  type="text"
                  className="form-input pl-10"
                  placeholder="Seu nome completo"
                />
              </div>
              {errors.ownerName && (
                <p className="form-error">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="form-input pl-10"
                  placeholder="email@empresa.com"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter no mínimo 6 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
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
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Store className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Informação Importante
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Após o cadastro, sua solicitação será analisada pelo administrador.
                    Você receberá um email quando sua empresa for aprovada para acessar o sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg"
            >
              {isLoading ? <LoadingSpinner size="small" /> : 'Cadastrar Empresa'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Faça login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
