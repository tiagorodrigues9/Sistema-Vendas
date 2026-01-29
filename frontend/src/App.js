import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Entries from './pages/Entries';
import Receivables from './pages/Receivables';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children, requiredPermission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !user.permissions[requiredPermission]) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute requiredPermission="canViewDashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/sales" element={
                    <ProtectedRoute requiredPermission="canMakeSales">
                      <Sales />
                    </ProtectedRoute>
                  } />
                  <Route path="/customers" element={
                    <ProtectedRoute requiredPermission="canManageCustomers">
                      <Customers />
                    </ProtectedRoute>
                  } />
                  <Route path="/products" element={
                    <ProtectedRoute requiredPermission="canManageProducts">
                      <Products />
                    </ProtectedRoute>
                  } />
                  <Route path="/entries" element={
                    <ProtectedRoute requiredPermission="canManageEntries">
                      <Entries />
                    </ProtectedRoute>
                  } />
                  <Route path="/receivables" element={
                    <ProtectedRoute requiredPermission="canManageReceivables">
                      <Receivables />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredPermission="canAccessAdmin">
                      <Admin />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
