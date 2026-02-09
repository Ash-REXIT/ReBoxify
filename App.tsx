
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import UserPortal from './pages/UserPortal';
import AdminDashboard from './pages/AdminDashboard';
import CompanyAdminPortal from './pages/CompanyAdminPortal';
import DeliveryPartnerApp from './pages/DeliveryPartnerApp';
import LoginPage from './pages/LoginPage';

import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

const AppRoutes: React.FC = () => {
  const { session } = useAuth();
  const { isAuthenticated, user } = session;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/user-login" element={<LoginPage type="user" />} />
      <Route path="/company-login" element={<LoginPage type="company" />} />
      <Route path="/partner-login" element={<LoginPage type="partner" />} />
      <Route path="/admin-login" element={<LoginPage type="admin" />} />
      <Route path="/login" element={<Navigate to="/user-login" />} />
      <Route
        path="/user-portal"
        element={isAuthenticated && user?.role === 'user' ? <UserPortal /> : <Navigate to="/user-login" />}
      />
      <Route
        path="/super-admin"
        element={isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin-login" />}
      />
      <Route
        path="/company-admin"
        element={isAuthenticated && user?.role === 'company' ? <CompanyAdminPortal /> : <Navigate to="/company-login" />}
      />
      <Route
        path="/delivery-partner"
        element={isAuthenticated && user?.role === 'partner' ? <DeliveryPartnerApp /> : <Navigate to="/partner-login" />}
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <ThemeToggle />
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
