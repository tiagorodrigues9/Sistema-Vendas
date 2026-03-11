import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { validateEmail } from '../utils/helpers';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(data.email);
      setEmailSent(data.email);
      setIsSuccess(true);
      
      // Em desenvolvimento, mostrar o token no console
      if (response.data.resetToken) {
        console.log('Token de reset (desenvolvimento):', response.data.resetToken);
        console.log('Link de reset:', `${window.location.origin}/reset-password?token=${response.data.resetToken}`);
      }
      
      toast.success('E-mail de recuperação enviado com sucesso!');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao enviar e-mail de recuperação';
      
      if (error.response?.status === 404) {
        setError('root', {
          type: 'manual',
          message: 'E-mail não encontrado em nosso sistema'
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                E-mail enviado!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enviamos as instruções de recuperação para:
              </p>
              <p className="mt-1 text-sm font-medium text-primary-600">
                {emailSent}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-info-50 border border-info-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-info-400" />
                  <div className="ml-3">
                    <p className="text-sm text-info-800">
                      <strong>Importante:</strong> Verifique sua caixa de entrada e a pasta de spam.
                      O link de recuperação expira em 1 hora.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn btn-primary"
                >
                  Voltar para o login
                </button>
                
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmailSent('');
                  }}
                  className="w-full btn btn-secondary"
                >
                  Enviar para outro e-mail
                </button>
              </div>
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu e-mail e enviaremos as instruções de recuperação
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
                    Enviando...
                  </div>
                ) : (
                  'Enviar instruções'
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

export default ForgotPassword;
