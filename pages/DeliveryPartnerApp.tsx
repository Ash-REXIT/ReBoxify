import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, QRIcon, PackageIcon } from '../components/Icons';
import { getInventory, validateAndTransition, extractBoxId, Box } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';

const DeliveryPartnerApp: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { user } = session;
  const [activeTab, setActiveTab] = useState<'scan' | 'tasks'>('scan');
  const [scanning, setScanning] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const { awardTokens } = useAuth();

  // Link to the Real Backend Inventory
  const [inventory, setInventory] = useState<Box[]>(getInventory());
  const [tasks, setTasks] = useState<any[]>([]);

  const [conditionPending, setConditionPending] = useState<{ id: string, type: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'partner') {
      return;
    }
    // Generate tasks based on real inventory state
    const currentInv = getInventory();
    const activeTasks = currentInv.filter(b => b.status === 'DISPATCHED' || b.status === 'DELIVERED').map(b => ({
      id: b.id,
      addr: 'Demo Address ' + b.id.split('-')[1],
      type: b.status === 'DISPATCHED' ? 'Delivery' : 'Collection',
      status: 'pending'
    }));
    setTasks(activeTasks);
    setInventory(currentInv);
  }, [user]);

  if (!user || user.role !== 'partner') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Authenticating Agent...</div>;

  const handleConditionSubmit = (condition: 'GOOD' | 'MINOR_DAMAGE' | 'DAMAGED') => {
    if (!conditionPending) return;

    const { id, type } = conditionPending;
    const boxBeforeUpdate = getInventory().find(b => b.id === id);
    const customerToAward = boxBeforeUpdate?.customer_id;

    const res = validateAndTransition(id, 'partner', 'RECEIVED', { condition });

    if (res.success) {
      alert(`Collection Successful!\nBox ${id} is now in RECEIVED state.`);

      // Award Tokens if condition is GOOD
      if (condition === 'GOOD' && customerToAward) {
        awardTokens(customerToAward, 5);
        alert(`Success! 5 Green Tokens awarded to ${customerToAward} for returning the box in GOOD condition.`);
      }

      setInventory(getInventory());
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    } else {
      alert(`Error: ${res.message}`);
    }
    setConditionPending(null);
  };

  const handleScan = (type: string) => {
    setScanning(type);

    setTimeout(() => {
      if (!(window as any).Html5QrcodeScanner) {
        alert("Scanner library failed to load.");
        setScanning(null);
        return;
      }

      const scanner = new (window as any).Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );

      scanner.render(
        (decodedText: string) => {
          scanner.clear();
          setScanning(null);

          const resultId = extractBoxId(decodedText);

          if (!resultId) {
            alert(`Scan Error: No valid Box ID found in the QR code.\nDetected: "${decodedText.substring(0, 30)}..."\n\nPlease ensure you are scanning a ReBoxify ID (e.g. ESA-001).`);
            return;
          }

          const isCollection = type.toLowerCase().includes('collection');

          if (isCollection) {
            // Trigger condition selection UI instead of prompt or immediate transition
            setConditionPending({ id: resultId, type });
          } else {
            // Immediate delivery transition - Link to demo user for now
            const res = validateAndTransition(resultId, 'partner', 'DELIVERED', {
              customer_id: 'user@demo.com',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            if (res.success) {
              alert(`Delivery Successful!\nBox ${resultId} handed over to user@demo.com.`);
              setInventory(getInventory());
              setTasks(prev => prev.map(t => t.id === resultId ? { ...t, status: 'completed' } : t));
            } else {
              alert(`Error: ${res.message}`);
            }
          }
        },
        () => { }
      );
    }, 500);
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] font-sans text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-700">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-100/40 dark:bg-orange-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-100/50 dark:bg-slate-900/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Scanner Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">{scanning} ACTIVE</h3>
            <button onClick={() => setScanning(null)} className="text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div className="w-full max-w-sm overflow-hidden rounded-[3rem] shadow-2xl shadow-black/50 bg-white dark:bg-slate-800 border-4 border-white/10 dark:border-white/5 relative transition-colors">
            <div id="reader" className="w-full min-h-[350px]"></div>
            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/5 rounded-[3rem]"></div>
          </div>

          <div className="mt-10 text-center px-8 space-y-6 w-full max-w-sm">
            <div className="space-y-2">
              <p className="text-white font-black text-lg">Align QR in Frame</p>
              <p className="text-slate-400 text-xs leading-relaxed uppercase tracking-widest font-bold">Logistics Node: {user?.details?.zone || 'Global'}</p>
            </div>

            <div className="relative pt-6 border-t border-white/10">
              <p className="text-white/30 text-[9px] uppercase font-black tracking-[0.4em] mb-4">Manual Override</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID (e.g. ESA-012)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                />
                <button
                  onClick={() => {
                    if (!manualId.trim()) return;
                    const cleanId = extractBoxId(manualId);
                    const isCollection = scanning?.toLowerCase().includes('collection');
                    if (isCollection) {
                      setConditionPending({ id: cleanId, type: scanning || 'Manual Entry' });
                    } else {
                      const res = validateAndTransition(cleanId, 'partner', 'DELIVERED', {
                        customer_id: 'user@demo.com',
                        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      });
                      if (res.success) {
                        setInventory(getInventory());
                        setTasks(prev => prev.map(t => t.id === cleanId ? { ...t, status: 'completed' } : t));
                        setScanning(null);
                        setManualId('');
                      } else {
                        alert(res.message);
                      }
                    }
                  }}
                  className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
                >
                  Confirm
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const taskType = scanning?.includes('Delivery') ? 'Delivery' : 'Collection';
                const pendingTask = tasks.find(t => t.type === taskType && t.status === 'pending');
                const simId = pendingTask ? pendingTask.id : (taskType === 'Delivery' ? 'ESA-012' : 'ESA-001');
                const nextStatus = taskType === 'Delivery' ? 'DELIVERED' : 'RECEIVED';

                if (nextStatus === 'RECEIVED') {
                  setConditionPending({ id: simId, type: scanning || 'Simulation' });
                } else {
                  const deadlineDate = new Date();
                  deadlineDate.setDate(deadlineDate.getDate() + 14);
                  const deadlineStr = deadlineDate.toISOString().split('T')[0];

                  const res = validateAndTransition(simId, 'partner', 'DELIVERED', {
                    customer_id: 'user@demo.com',
                    deadline: deadlineStr
                  });
                  if (res.success) {
                    setTasks(prev => prev.map(t => t.id === simId ? { ...t, status: 'completed' } : t));
                    setInventory(getInventory());
                  }
                }
                setScanning(null);
              }}
              className="text-white/20 hover:text-white/40 text-[9px] font-black uppercase tracking-[0.3em] transition-colors"
            >
              Simulate Scan Payload
            </button>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            #reader { border: none !important; }
            #reader img { display: none !important; }
            #reader__dashboard_section_csr button {
              background: #f97316 !important;
              color: white !important;
              padding: 14px 28px !important;
              border-radius: 16px !important;
              font-weight: 900 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.1em !important;
              border: none !important;
              margin: 10px 0 !important;
              cursor: pointer !important;
              font-size: 11px !important;
            }
            #reader__status_span { color: #64748b !important; font-size: 10px !important; font-weight: 700 !important; }
            #reader video { border-radius: 24px !important; object-fit: cover !important; }
            #reader a { display: none !important; }
            #reader__dashboard_section_fsr { display: none !important; }
          `}} />
        </div>
      )}

      {/* Condition Selection Modal */}
      {conditionPending && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center p-6 transition-colors">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl border border-white dark:border-white/5 space-y-10 animate-in fade-in zoom-in duration-500 transition-colors">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-orange-50/50 dark:ring-orange-500/5 transition-all">
                <PackageIcon />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Condition Report</h3>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Asset Serial: {conditionPending.id}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleConditionSubmit('GOOD')}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 hover:bg-emerald-500 dark:hover:bg-emerald-600 border border-slate-100 dark:border-white/5 hover:border-emerald-400 rounded-[2rem] flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-emerald-500 font-black group-hover:scale-110 transition-transform">A</div>
                  <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Optimal Condition</span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover:border-white/50 flex items-center justify-center text-emerald-500 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
              </button>

              <button
                onClick={() => handleConditionSubmit('MINOR_DAMAGE')}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 hover:bg-amber-500 dark:hover:bg-amber-600 border border-slate-100 dark:border-white/5 hover:border-amber-400 rounded-[2rem] flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-amber-500 font-black group-hover:scale-110 transition-transform">B</div>
                  <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Fair / Wear</span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover:border-white/50 flex items-center justify-center text-amber-500 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                </div>
              </button>

              <button
                onClick={() => handleConditionSubmit('DAMAGED')}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 hover:bg-rose-500 dark:hover:bg-rose-600 border border-slate-100 dark:border-white/5 hover:border-rose-400 rounded-[2rem] flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-rose-500 font-black group-hover:scale-110 transition-transform">C</div>
                  <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Critical Failure</span>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover:border-white/50 flex items-center justify-center text-rose-500 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </div>
              </button>
            </div>

            <button
              onClick={() => setConditionPending(null)}
              className="w-full text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
            >
              Abort Ledger Entry
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/70 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[1.8rem] flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-2xl shadow-black/[0.02] transition-all">
            <TruckIcon />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Logistics Hub</h1>
            <span className="text-[10px] text-orange-600 dark:text-orange-500 font-black uppercase tracking-[0.3em] mt-2">{user.details?.zone || 'Zone Alpha'} Terminal</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Agent Operational</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-300">{user.id}</span>
          </div>
          <button
            onClick={logout}
            className="w-14 h-14 bg-white/70 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto p-6 md:p-8 pb-40">
        {/* Command Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[3rem] shadow-2xl shadow-black/[0.02] transition-all">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Tasks Active</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{tasks.filter(t => t.status === 'pending').length}</h3>
          </div>
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[3rem] shadow-2xl shadow-black/[0.02] transition-all">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Zone Status</p>
            <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter uppercase">Optimal</h3>
          </div>
          <div className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[3rem] shadow-2xl shadow-black/[0.02] col-span-2 hidden md:block transition-all">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Sector Progression</p>
            <div className="flex items-center gap-6">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
              </h3>
              <div className="flex-1 h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner uppercase">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 shadow-xl shadow-orange-500/20"
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'scan' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Main Scanner Section */}
            <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] p-12 md:p-20 rounded-[4.5rem] shadow-2xl shadow-black/[0.02] text-center transition-all">
              <div className="w-28 h-28 bg-orange-600 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-orange-600/30 ring-8 ring-orange-50 dark:ring-orange-500/10 transition-all">
                <QRIcon />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Custody Protocol</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-16 max-w-xs mx-auto leading-relaxed">System Link: Verify asset lifecycle transitions.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleScan('Delivery')}
                  className="group relative flex flex-col items-center justify-center p-12 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-[3.5rem] hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white transition-all duration-500 shadow-xl active:scale-95 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                    <TruckIcon />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center mb-8 shadow-inner transition-all duration-500 group-hover:scale-110">
                    <TruckIcon />
                  </div>
                  <span className="font-black text-xs uppercase tracking-[0.3em] mb-2 dark:text-slate-300 group-hover:text-white">Dispatch Asset</span>
                  <span className="text-[10px] font-black opacity-30 group-hover:opacity-60 uppercase tracking-widest leading-none">Complete Handover</span>
                </button>

                <button
                  onClick={() => handleScan('Collection')}
                  className="group relative flex flex-col items-center justify-center p-12 bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/[0.08] rounded-[3.5rem] hover:bg-orange-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95 overflow-hidden text-white/50"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                    <QRIcon />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-white/20 text-orange-500 dark:text-orange-400 group-hover:text-white flex items-center justify-center mb-8 shadow-inner transition-all duration-500 group-hover:scale-110">
                    <QRIcon />
                  </div>
                  <span className="font-black text-xs uppercase tracking-[0.3em] mb-2 text-white">Reverse Ledger</span>
                  <span className="text-[10px] font-black opacity-30 uppercase tracking-widest leading-none">Validate Return</span>
                </button>
              </div>
            </div>

            {/* Quick Task Alert */}
            <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group transition-all">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                  <h4 className="font-black mb-3 text-indigo-200 uppercase text-[10px] tracking-[0.4em]">Operational Queue</h4>
                  <p className="text-xl font-black tracking-tight leading-tight">Priority Zone {user.details?.zone || 'Alpha'} has {tasks.filter(t => t.status === 'pending').length} pending actions.</p>
                </div>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-2xl active:scale-95"
                >
                  Launch Terminal
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-end px-6 mb-10">
              <div>
                <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Operational Queue</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] line-clamp-1">Sector Link: {user.details?.zone || 'Alpha'}</p>
              </div>
              <span className="hidden sm:block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 shadow-sm">
                Efficiency: {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}% Balanced
              </span>
            </div>

            <div className="space-y-6">
              {tasks.length > 0 ? tasks.map((task, i) => (
                <div
                  key={i}
                  className={`group p-10 rounded-[4rem] border transition-all duration-500 ${task.status === 'completed'
                    ? 'bg-white/30 dark:bg-white/[0.01] border-emerald-100/50 dark:border-emerald-500/10 opacity-30 scale-[0.98]'
                    : 'bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/[0.01] hover:shadow-black/10 hover:border-orange-500/20'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-start gap-8">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-all group-hover:rotate-6 ${task.type === 'Collection'
                        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                        }`}>
                        {task.type === 'Collection' ? <QRIcon /> : <TruckIcon />}
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-colors ${task.type === 'Collection' ? 'bg-orange-600 text-white' : 'bg-emerald-600 text-white'
                            }`}>{task.type}</span>
                          <code className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg">{task.id}</code>
                        </div>
                        <h4 className={`text-xl font-black tracking-tight ${task.status === 'completed' ? 'text-slate-400 dark:text-slate-700 line-through' : 'text-slate-900 dark:text-white'}`}>{task.addr}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end lg:self-center">
                      {task.status === 'completed' ? (
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] bg-emerald-50 dark:bg-emerald-500/10 px-6 py-4 rounded-2xl shadow-inner uppercase transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          Archived
                        </div>
                      ) : (
                        <button
                          onClick={() => handleScan(task.type)}
                          className="px-8 py-5 bg-slate-900 dark:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all active:scale-95 shadow-2xl"
                        >
                          Process Node
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-white/40 dark:bg-white/[0.01] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] p-24 rounded-[4.5rem] text-center transition-all">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <PackageIcon />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Zero active vectors in this sector.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-64px)] max-w-sm bg-slate-900/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-white/10 dark:border-white/[0.05] p-3 rounded-[3rem] flex justify-between gap-3 z-[50] shadow-2xl shadow-black/60 transition-all">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 flex items-center justify-center gap-4 py-5 rounded-[2.2rem] transition-all duration-500 ${activeTab === 'scan' ? 'bg-white text-slate-900 shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white/70'
            }`}
        >
          <div className="w-5 h-5 flex items-center justify-center"><QRIcon /></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-4 py-5 rounded-[2.2rem] transition-all duration-500 ${activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-2xl shadow-white/10' : 'text-white/40 hover:text-white/70'
            }`}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <TruckIcon />
            {tasks.some(t => t.status === 'pending') && (
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border-2 border-slate-900 dark:border-[#020617] rounded-full animate-pulse"></div>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Queue</span>
        </button>
      </nav>
    </div>
  );
};

export default DeliveryPartnerApp;
