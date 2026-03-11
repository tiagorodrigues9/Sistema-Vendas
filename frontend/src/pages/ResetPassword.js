import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken(token);
        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      await authAPI.resetPassword({
        token,
        newPassword: data.password
      });
      
      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao redefinir senha';
      
      if (error.response?.status === 400) {
        setError('root', {
          type: 'manual',
          message: message
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Verificando token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-error-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-error-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Token inválido
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Este link de recuperação é inválido ou expirou.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to="/forgot-password"
                className="w-full btn btn-primary block text-center"
              >
                Solicitar nova recuperação
              </Link>
              
              <Link
                to="/login"
                className="w-full btn btn-secondary block text-center"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Senha redefinida!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Sua senha foi redefinida com sucesso.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full btn btn-primary"
              >
                Fazer login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para o login
          </Link>
          
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>

        {/* Form */}
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

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nova Senha
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
                Confirmar Nova Senha
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
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
                    Redefinindo...
                  </div>
                ) : (
                  'Redefinir Senha'
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Voltar para o login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
