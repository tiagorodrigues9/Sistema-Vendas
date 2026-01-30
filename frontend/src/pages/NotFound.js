import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { ROUTES } from '../utils/constants';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Página não encontrada
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Desculpe, não conseguimos encontrar a página que você está procurando.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  O que você pode fazer?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verifique se o endereço está correto</li>
                    <li>Volte para a página anterior</li>
                    <li>Use o menu de navegação</li>
                    <li>Entre em contato com o suporte</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link
              to={ROUTES.DASHBOARD}
              className="flex-1 btn btn-primary flex items-center justify-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex-1 btn btn-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>

          <div className="text-center">
            <Link
              to={ROUTES.DASHBOARD}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
