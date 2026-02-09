
import React from 'react';

const StackItem: React.FC<{ label: string; sub: string; icon: React.ReactNode }> = ({ label, sub, icon }) => (
  <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 flex items-center justify-center text-emerald-600 mb-4 bg-emerald-50 rounded-xl">
      {icon}
    </div>
    <span className="font-semibold text-slate-800 text-center">{label}</span>
    <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{sub}</span>
  </div>
);

const TechStack: React.FC = () => {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">The ReBoxify Stack</h2>
        <p className="text-slate-500 max-w-2xl mx-auto italic">
          Built for massive scale, reliability, and real-time lifecycle tracking.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StackItem 
          label="Next.js" 
          sub="Frontend" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm10.323 12l-7.234-9.337c.304.425.568.88.789 1.358L18.428 12l-2.55 7.979c-.221.478-.485.933-.789 1.358L22.323 12zM3.477 12l5.748-18.001c-.131-.001-.261-.001-.392-.001C5.373 0 0 5.373 0 12s5.373 12 8.833 12c.131 0 .261 0 .392-.001L3.477 12zM12 5.03L9.638 12.39h4.724L12 5.03z"/></svg>}
        />
        <StackItem 
          label="Node.js" 
          sub="Backend" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-1.346 0-2.618.35-3.717 1.032l-5.636 3.254c-1.096.634-1.896 1.76-1.896 2.894v6.521c0 1.133.8 2.26 1.896 2.893l5.636 3.254c1.099.682 2.371 1.032 3.717 1.032 1.346 0 2.617-.35 3.717-1.032l5.635-3.254c1.097-.633 1.897-1.76 1.897-2.893v-6.521c0-1.134-.8-2.26-1.897-2.894l-5.635-3.254c-1.1-.682-2.371-1.032-3.717-1.032zm0 2c.94 0 1.83.253 2.593.725l5.637 3.254c.762.44 1.258 1.17 1.258 1.901v6.521c0 .73-.496 1.46-1.258 1.9l-5.637 3.255c-.763.472-1.652.724-2.593.724s-1.83-.252-2.593-.724l-5.637-3.255c-.762-.44-1.258-1.17-1.258-1.9v-6.521c0-.731.496-1.461 1.258-1.901l5.637-3.254c.763-.472 1.653-.725 2.593-.725z"/></svg>}
        />
        <StackItem 
          label="PostgreSQL" 
          sub="Database" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-4.418 0-8 3.582-8 8 0 4.418 3.582 8 8 8s8-3.582 8-8c0-4.418-3.582-8-8-8zm0 2c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6zm0 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>}
        />
        <StackItem 
          label="Firebase" 
          sub="Auth" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0c-.392 0-.742.203-.94.532l-1.986 3.696-2.13-3.957a1.076 1.076 0 00-1.884 0L0 19.34a1.07 1.07 0 00.187 1.161 1.08 1.08 0 001.07.25l10.74-2.822 10.738 2.822a1.082 1.082 0 001.258-1.411L12.936.532a1.076 1.076 0 00-.94-.532z"/></svg>}
        />
        <StackItem 
          label="AWS" 
          sub="Cloud" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.18 17.514c-1.393.385-3.048.583-4.832.583-1.815 0-3.418-.21-4.708-.607a.23.23 0 01-.023-.42c.07-.035.204-.085.345-.133a.23.23 0 01.272.073c1.012.35 2.454.516 4.114.516 1.623 0 3.097-.152 4.15-.436a.23.23 0 01.275.086c.137.197.355.518.43.645a.23.23 0 01-.023.294z"/></svg>}
        />
        <StackItem 
          label="Laser ID + QR" 
          sub="Scanning" 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zm2 2v4h4V5zm10-2h6v6h-6zm2 2v2h2V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-2 2h2v2h-2zm2 2h3v3h-3zm2-2h3v2h-3zm0 5h2v2h-2zm-5-2h2v2h-2zm2-3h3v2h-3z"/></svg>}
        />
      </div>
    </section>
  );
};

export default TechStack;
