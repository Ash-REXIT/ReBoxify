
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserIcon, BuildingIcon, TruckIcon, DashboardIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../utils/auth';

export type LoginType = 'user' | 'company' | 'partner' | 'admin';

interface LoginPageProps {
  type: LoginType;
}

const LoginPage: React.FC<LoginPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, isLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
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
      label: 'Admin ID / Email',
      placeholder: 'MNC-XXXX or email',
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
      label: 'Partner ID / Email',
      placeholder: 'PRT-XXXX or email',
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
      label: 'Super Admin ID / Email',
      placeholder: 'SEC-XXXX or email',
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const role = type as UserRole;

    if (isSignUp) {
      const result = await signup(identity, password);
      if (result.success) {
        // Automatically link to login after signup
        const loginResult = await login(identity, password, role);
        if (loginResult.success) {
          navigate(config.redirect);
        } else {
          setError('Account created, but login failed. Please try manual login.');
          setIsSignUp(false);
        }
      } else {
        setError(result.error || 'Signup failed.');
      }
    } else {
      const result = await login(identity, password, role);
      if (result.success) {
        navigate(config.redirect);
      } else {
        setError(result.error || 'Login failed.');
      }
    }
  };

  const bgMap: Record<LoginType, string> = {
    user: 'bg-emerald-50/30 dark:bg-[#020617]',
    company: 'bg-indigo-50/30 dark:bg-[#020617]',
    partner: 'bg-orange-50/30 dark:bg-[#020617]',
    admin: 'bg-slate-50 dark:bg-[#020617]',
  };

  return (
    <div className={`min-h-screen ${bgMap[type]} flex items-center justify-center p-6 transition-colors duration-700 relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Navigation Link back */}
        <div className="text-center mb-8">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer mb-8 group"
          >
            <div className={`w-12 h-12 ${colorMap[config.color].split(' ')[0]} rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-transform group-hover:rotate-6`}>R</div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white transition-colors">ReBoxify</span>
          </div>

          <div className={`w-14 h-14 bg-white dark:bg-slate-800 ${textMap[config.color]} mx-auto mb-4 rounded-[1.2rem] flex items-center justify-center shadow-xl border border-white/10 dark:border-white/5`}>
            {config.icon}
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
            {isSignUp ? 'Create Account' : config.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold uppercase text-[10px] tracking-[0.2em] transition-colors">
            {config.subtitle}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] shadow-2xl shadow-black/[0.05] p-10 border border-white/20 dark:border-white/5 transition-all">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{config.label}</label>
              <input
                type={(type === 'user' || isSignUp) ? 'email' : 'text'}
                required
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Security Credentials</label>
                {!isSignUp && <a href="#" className={`text-[10px] font-black uppercase tracking-widest ${textMap[config.color]} hover:opacity-80`}>Forgot?</a>}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 ${colorMap[config.color]} text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-6 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Establish Account' : 'Authenticate'
              )}
            </button>
          </form>

          {config.allowSignup && (
            <div className="mt-10 pt-8 border-t border-slate-50 dark:border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">
                {isSignUp ? 'Identity already exists?' : "New to the loop?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className={`font-black ${textMap[config.color]} hover:opacity-80 ml-2`}
                >
                  {isSignUp ? 'Sign In' : 'Join Pipeline'}
                </button>
              </p>
            </div>
          )}

          {!config.allowSignup && (
            <div className="mt-10 pt-8 border-t border-slate-50 dark:border-white/5 text-center">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                Restricted Protocol. System keys managed by Root Admin. <br />
                <span className="text-slate-300 dark:text-slate-700 mt-2 block">Governance Code: {config.adminContact}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
