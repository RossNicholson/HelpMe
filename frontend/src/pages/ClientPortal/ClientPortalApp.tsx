import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClientPortalProvider, useClientPortal } from '../../contexts/ClientPortalContext';
import ClientPortalLoginPage from './ClientPortalLoginPage';
import ClientPortalDashboardPage from './ClientPortalDashboardPage';

// Protected Route Component for Client Portal
const ProtectedClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useClientPortal();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useClientPortal();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <>{children}</>;
};

// Inner App Component with Routes
const ClientPortalAppInner: React.FC = () => {
  const { sessionToken, client, logout } = useClientPortal();

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicClientRoute>
              <ClientPortalLoginPage onLogin={(token, clientData) => {
                // This will be handled by the context
              }} />
            </PublicClientRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedClientRoute>
              <ClientPortalDashboardPage
                sessionToken={sessionToken!}
                client={client!}
                onLogout={logout}
              />
            </ProtectedClientRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

// Main App Component with Provider
const ClientPortalApp: React.FC = () => {
  return (
    <ClientPortalProvider>
      <ClientPortalAppInner />
    </ClientPortalProvider>
  );
};

export default ClientPortalApp; 