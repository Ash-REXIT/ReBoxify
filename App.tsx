
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UserPortal from './pages/UserPortal';
import AdminDashboard from './pages/AdminDashboard';
import CompanyAdminPortal from './pages/CompanyAdminPortal';
import DeliveryPartnerApp from './pages/DeliveryPartnerApp';
import LoginPage from './pages/LoginPage';


export interface UserSession {
  isAuthenticated: boolean;
  role: 'user' | 'company' | 'partner' | 'admin' | null;
  email?: string;
  companyId?: string;
}

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('reboxify_session');
    return saved ? JSON.parse(saved) : { isAuthenticated: false, role: null };
  });

  const login = (role: UserSession['role'], details: Partial<UserSession>) => {
    const newSession = { isAuthenticated: true, role, ...details };
    setSession(newSession);
    localStorage.setItem('reboxify_session', JSON.stringify(newSession));
    localStorage.setItem('reboxify_user_context', JSON.stringify(newSession)); // For backward compatibility
  };

  const logout = () => {
    const newSession = { isAuthenticated: false, role: null };
    setSession(newSession);
    localStorage.removeItem('reboxify_session');
    localStorage.removeItem('reboxify_user_context');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Landing Page is strictly for showcase - No login buttons here */}
        <Route path="/" element={<LandingPage />} />

        {/* Specific Login Routes */}
        <Route path="/user-login" element={<LoginPage type="user" onLogin={(details) => login('user', details)} />} />
        <Route path="/company-login" element={<LoginPage type="company" onLogin={(details) => login('company', details)} />} />
        <Route path="/partner-login" element={<LoginPage type="partner" onLogin={(details) => login('partner', details)} />} />
        <Route path="/admin-login" element={<LoginPage type="admin" onLogin={(details) => login('admin', details)} />} />

        {/* Generic Login fallback (defaults to user) */}
        <Route path="/login" element={<Navigate to="/user-login" />} />

        {/* Protected Routes */}
        <Route
          path="/user-portal"
          element={session.isAuthenticated && session.role === 'user' ? <UserPortal /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/super-admin"
          element={session.isAuthenticated && session.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin-login" />}
        />
        <Route
          path="/company-admin"
          element={session.isAuthenticated && session.role === 'company' ? <CompanyAdminPortal /> : <Navigate to="/company-login" />}
        />
        <Route
          path="/delivery-partner"
          element={session.isAuthenticated && session.role === 'partner' ? <DeliveryPartnerApp /> : <Navigate to="/partner-login" />}
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
