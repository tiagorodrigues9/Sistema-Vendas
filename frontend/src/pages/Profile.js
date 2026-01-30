import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuth();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  const newPassword = watchPassword('newPassword');

  const onProfileSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // TODO: Update user profile API call
      updateUser(data);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // TODO: Update password API call
      toast.success('Senha alterada com sucesso!');
      resetPassword();
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Meu Perfil
          </h3>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Informações Pessoais
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'password'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Alterar Senha
              </button>
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="mt-6">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <div className="mt-1 relative">
                      <input
                        {...registerProfile('name', {
                          required: 'Nome é obrigatório',
                          minLength: {
                            value: 3,
                            message: 'Nome deve ter pelo menos 3 caracteres'
                          }
                        })}
                        type="text"
                        className={`input pl-10 ${profileErrors.name ? 'border-error-500' : ''}`}
                        placeholder="Seu nome completo"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-error-600">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                    <div className="mt-1 relative">
                      <input
                        {...registerProfile('email', {
                          required: 'E-mail é obrigatório',
                          validate: (value) => validateEmail(value) || 'E-mail inválido'
                        })}
                        type="email"
                        className={`input pl-10 ${profileErrors.email ? 'border-error-500' : ''}`}
                        placeholder="seu@email.com"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-error-600">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Usuário
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={user?.role === 'administrador' ? 'Administrador' : 
                            user?.role === 'dono' ? 'Dono' : 'Funcionário'}
                      disabled
                      className="input bg-gray-50"
                    />
                  </div>
                </div>

                {/* Company (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={user?.company?.companyName || '-'}
                      disabled
                      className="input bg-gray-50"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="mt-6">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Senha Atual
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerPassword('currentPassword', {
                        required: 'Senha atual é obrigatória'
                      })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`input pl-10 pr-10 ${passwordErrors.currentPassword ? 'border-error-500' : ''}`}
                      placeholder="Digite sua senha atual"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerPassword('newPassword', {
                        required: 'Nova senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Senha deve conter letra maiúscula, minúscula e número'
                        }
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className={`input pl-10 pr-10 ${passwordErrors.newPassword ? 'border-error-500' : ''}`}
                      placeholder="Digite sua nova senha"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.newPassword.message}
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
                      {...registerPassword('confirmPassword', {
                        required: 'Confirme sua nova senha',
                        validate: (value) => value === newPassword || 'As senhas não coincidem'
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className={`input pl-10 pr-10 ${passwordErrors.confirmPassword ? 'border-error-500' : ''}`}
                      placeholder="Confirme sua nova senha"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requisitos da senha:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Pelo menos 6 caracteres</li>
                    <li>• Pelo menos uma letra maiúscula</li>
                    <li>• Pelo menos uma letra minúscula</li>
                    <li>• Pelo menos um número</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Alterando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
