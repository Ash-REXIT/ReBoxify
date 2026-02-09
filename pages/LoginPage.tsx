
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserIcon, BuildingIcon, TruckIcon, DashboardIcon } from '../components/Icons';

export type LoginType = 'user' | 'company' | 'partner' | 'admin';


interface LoginPageProps {
  type: LoginType;
  onLogin: (details: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ type, onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsSignUp(mode === 'signup' && type === 'user');
    setError(null);
  }, [searchParams, type]);

  // Config based on the login type
  const config = {
    user: {
      title: 'Customer Login',
      subtitle: 'Manage your sustainable orders',
      label: 'Email Address',
      placeholder: 'name@email.com',
      color: 'blue',
      bg: 'bg-blue-50/50',
      icon: <UserIcon />,
      redirect: '/user-portal',
      allowSignup: true
    },
    company: {
      title: 'MNC Inventory Login',
      subtitle: 'Manage corporate circular assets',
      label: 'Admin ID',
      placeholder: 'MNC-XXXX',
      color: 'yellow',
      bg: 'bg-yellow-50/50',
      icon: <BuildingIcon />,
      redirect: '/company-admin',
      allowSignup: false,
      adminContact: 'admin@reboxify.com'
    },
    partner: {
      title: 'Delivery Partner App',
      subtitle: 'Scan and track box movements',
      label: 'Partner ID',
      placeholder: 'PRT-XXXX',
      color: 'orange',
      bg: 'bg-orange-50/50',
      icon: <TruckIcon />,
      redirect: '/delivery-partner',
      allowSignup: false,
      adminContact: 'logistics@reboxify.com'
    },
    admin: {
      title: 'Super Admin Access',
      subtitle: 'Global platform control',
      label: 'Super Admin ID',
      placeholder: 'SEC-XXXX',
      color: 'slate',
      bg: 'bg-slate-100',
      icon: <DashboardIcon />,
      redirect: '/super-admin',
      allowSignup: false,
      adminContact: 'security@reboxify.com'
    }
  }[type];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 ring-blue-500/20 border-blue-500',
    yellow: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 ring-amber-500/20 border-amber-500',
    orange: 'bg-orange-600 hover:bg-orange-700 shadow-orange-200 ring-orange-500/20 border-orange-500',
    slate: 'bg-slate-900 hover:bg-black shadow-slate-200 ring-slate-500/20 border-slate-900',
  };

  const textMap: Record<string, string> = {
    blue: 'text-blue-600',
    yellow: 'text-amber-600',
    orange: 'text-orange-600',
    slate: 'text-slate-900',
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      let isValid = false;
      let errorMessage = 'Invalid credentials. Please try again.';
      let sessionDetails: any = {};

      if (type === 'user') {
        if (isSignUp) {
          const existingUsers = JSON.parse(localStorage.getItem('reboxify_users') || '{}');
          if (existingUsers[identity]) {
            errorMessage = 'Email already registered.';
          } else {
            existingUsers[identity] = password;
            localStorage.setItem('reboxify_users', JSON.stringify(existingUsers));
            isValid = true;
            sessionDetails = { email: identity };
          }
        } else {
          const existingUsers = JSON.parse(localStorage.getItem('reboxify_users') || '{}');
          if (existingUsers[identity] === password || (identity === 'user@demo.com' && password === '123')) {
            isValid = true;
            sessionDetails = { email: identity };
          }
        }
      } else if (type === 'admin') {
        isValid = (identity === 'super-admin' && password === '123');
        if (isValid) sessionDetails = { id: identity };
        errorMessage = 'Invalid Super Admin ID.';
      } else if (type === 'company') {
        // Amazon demo
        if (identity === 'MNC-AMZ' && password === '123') {
          isValid = true;
          sessionDetails = { companyId: 'MNC-AMZ', id: identity };
        } else if (identity === 'MNC-FLK' && password === '123') {
          isValid = true;
          sessionDetails = { companyId: 'MNC-FLK', id: identity };
        }
        errorMessage = 'Invalid Admin ID for assigned MNC.';
      } else if (type === 'partner') {
        isValid = (identity === 'DLP-001' && password === '123');
        if (isValid) sessionDetails = { id: identity, zone: 'North-East' };
        errorMessage = 'Invalid Partner ID.';
      }

      setLoading(false);

      if (isValid) {
        onLogin(sessionDetails);
        navigate(config.redirect);
      } else {
        setError(errorMessage);
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen ${config.bg} flex items-center justify-center p-6 transition-all duration-500`}>
      <div className="max-w-md w-full">
        {/* Navigation Link back */}
        <div className="text-center mb-8">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer mb-6 group"
          >
            <div className={`w-10 h-10 ${colorMap[config.color].split(' ')[0]} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110`}>R</div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">ReBoxify</span>
          </div>
          <div className={`w-12 h-12 bg-white ${textMap[config.color]} mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-md`}>
            {config.icon}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isSignUp ? 'Create Account' : config.title}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {config.subtitle}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 p-8 border border-slate-100">
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{config.label}</label>
              <input
                type={type === 'user' ? 'email' : 'text'}
                required
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                {!isSignUp && <a href="#" className={`text-xs font-bold ${textMap[config.color]} hover:opacity-80`}>Forgot?</a>}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-slate-800"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 ${colorMap[config.color]} text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Sign Up' : 'Login'
              )}
            </button>
          </form>

          {config.allowSignup && (
            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : "New to the platform?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className={`font-bold ${textMap[config.color]} hover:opacity-80`}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up Now'}
                </button>
              </p>
            </div>
          )}

          {!config.allowSignup && (
            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-xs text-slate-400 italic">
                Restricted Access. Credentials managed by Super Admin. <br />
                <span className="text-slate-300">Support: {config.adminContact}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
