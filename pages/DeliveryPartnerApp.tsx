
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, QRIcon, PackageIcon } from '../components/Icons';
import { getInventory, validateAndTransition, Box } from '../utils/boxStore';

const DeliveryPartnerApp: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scan' | 'tasks'>('scan');
  const [scanning, setScanning] = useState<string | null>(null);

  // Link to the Real Backend Inventory
  const [inventory, setInventory] = useState<Box[]>(getInventory());
  const [tasks, setTasks] = useState<any[]>([]);

  const [conditionPending, setConditionPending] = useState<{ id: string, type: string } | null>(null);

  const sessionString = localStorage.getItem('reboxify_session');
  const session = sessionString ? JSON.parse(sessionString) : null;

  useEffect(() => {
    if (!session || session.role !== 'partner') {
      navigate('/partner-login');
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
  }, [navigate, session]);

  if (!session || session.role !== 'partner') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Authenticating Agent...</div>;

  const handleConditionSubmit = (condition: 'GOOD' | 'MINOR_DAMAGE' | 'DAMAGED') => {
    if (!conditionPending) return;

    const { id, type } = conditionPending;
    const res = validateAndTransition(id, 'partner', 'RECEIVED', { condition });

    if (res.success) {
      alert(`Collection Successful!\nBox ${id} is now in RECEIVED state.`);
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

          let resultId = decodedText;
          try {
            if (decodedText.startsWith('http')) {
              const url = new URL(decodedText);
              const parts = url.pathname.split('/').filter(p => p);
              resultId = parts.length > 0 ? parts[parts.length - 1] : decodedText;
            }
          } catch (e) { }

          const isCollection = type.toLowerCase().includes('collection');

          if (isCollection) {
            // Trigger condition selection UI instead of prompt or immediate transition
            setConditionPending({ id: resultId, type });
          } else {
            // Immediate delivery transition
            const res = validateAndTransition(resultId, 'partner', 'DELIVERED');
            if (res.success) {
              alert(`Delivery Successful!\nBox ${resultId} handed over.`);
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
    <div className="min-h-screen bg-orange-50/30 font-sans text-slate-900">
      {/* Scanner Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6">
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
            <h3 className="text-white font-bold text-lg uppercase tracking-widest">{scanning} Active</h3>
            <button onClick={() => setScanning(null)} className="text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div className="w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black/50 bg-white shadow-orange-500/10 border border-slate-700/50">
            <div id="reader" className="w-full min-h-[300px]"></div>
          </div>

          <div className="mt-8 text-center px-8 space-y-2">
            <p className="text-white font-medium">Scan Official ReBoxify QR</p>
            <p className="text-slate-400 text-sm leading-relaxed">System updates only the specific tasks assigned for {session.zone || 'your zone'}.</p>
          </div>

          <button
            onClick={() => {
              const taskType = scanning.includes('Delivery') ? 'Delivery' : 'Collection';
              const pendingTask = tasks.find(t => t.type === taskType && t.status === 'pending');
              const simId = pendingTask ? pendingTask.id : (taskType === 'Delivery' ? 'ESA-012' : 'ESA-001');

              const nextStatus = taskType === 'Delivery' ? 'DELIVERED' : 'RECEIVED';

              if (nextStatus === 'RECEIVED') {
                setConditionPending({ id: simId, type: scanning });
              } else {
                const res = validateAndTransition(simId, 'partner', 'DELIVERED');
                if (res.success) {
                  alert(res.message);
                  setTasks(prev => prev.map(t => t.id === simId ? { ...t, status: 'completed' } : t));
                  setInventory(getInventory());
                } else {
                  alert(res.message);
                }
              }
              setScanning(null);
            }}
            className="mt-8 px-10 py-3 bg-orange-600/10 text-orange-400 border border-orange-500/30 rounded-2xl font-bold hover:bg-orange-600 hover:text-white transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            Simulate Success ({tasks.find(t => (scanning.includes('Delivery') ? t.type === 'Delivery' : t.type === 'Collection') && t.status === 'pending')?.id || (scanning.includes('Delivery') ? 'ESA-012' : 'ESA-001')})
          </button>

          <style dangerouslySetInnerHTML={{
            __html: `
            #reader { border: none !important; }
            #reader img { display: none !important; }
            #reader__dashboard_section_csr button {
              background: #f97316 !important;
              color: white !important;
              padding: 12px 24px !important;
              border-radius: 12px !important;
              font-weight: bold !important;
              border: none !important;
              margin: 10px 0 !important;
              cursor: pointer !important;
              font-size: 14px !important;
            }
            #reader__status_span { color: #64748b !important; font-size: 12px !important; }
            #reader video { border-radius: 20px !important; object-fit: cover !important; }
            #reader a { display: none !important; }
            #reader__dashboard_section_fsr { display: none !important; }
          `}} />
        </div>
      )}

      {/* Condition Selection Modal */}
      {conditionPending && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PackageIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Report Condition</h3>
              <p className="text-slate-500 text-sm">Please inspect Box <span className="font-mono font-bold text-orange-600">{conditionPending.id}</span> and report its current state.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleConditionSubmit('GOOD')}
                className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>
                  <span className="font-bold text-emerald-900">Perfect / Good</span>
                </div>
                <span className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>

              <button
                onClick={() => handleConditionSubmit('MINOR_DAMAGE')}
                className="w-full p-4 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-2xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">!</div>
                  <span className="font-bold text-amber-900">Minor Scratches</span>
                </div>
                <span className="text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>

              <button
                onClick={() => handleConditionSubmit('DAMAGED')}
                className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">×</div>
                  <span className="font-bold text-red-900">Damaged / Broken</span>
                </div>
                <span className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>

            <button
              onClick={() => setConditionPending(null)}
              className="w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel Report
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-orange-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-orange-600 p-2 hover:bg-orange-50 rounded-xl transition-colors"><TruckIcon /></button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800">ReBoxify Logistics</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{session.id} | {session.zone || 'General Zone'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live</span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-24">
        {activeTab === 'scan' ? (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-900/5 text-center transition-all hover:shadow-orange-900/10 border border-slate-50">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-orange-50">
                <QRIcon />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">QR Workflow</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Scan box QR at each stage to update the circular lifecycle.</p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleScan('Delivery Scan')}
                  className="group flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
                      <TruckIcon />
                    </div>
                    <span className="font-bold">Delivery Scan</span>
                  </div>
                  <span className="opacity-40 select-none transition-transform group-hover:translate-x-1">→</span>
                </button>
                <button
                  onClick={() => handleScan('Collection Scan')}
                  className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-lg active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-white/10 flex items-center justify-center text-slate-600 group-hover:text-white shadow-sm transition-transform group-hover:scale-110">
                      <QRIcon />
                    </div>
                    <div className="text-left">
                      <span className="font-bold block">Collection Scan</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 group-hover:text-emerald-300 transition-colors">Confirm Condition</span>
                    </div>
                  </div>
                  <span className="opacity-40 select-none transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white">
              <h4 className="font-bold mb-4 text-indigo-200 uppercase text-xs tracking-widest">Collection Alert</h4>
              <p className="text-sm mb-4">You have {tasks.filter(t => t.type === 'Collection' && t.status === 'pending').length} tasks pending in your sector. Priority action required.</p>
              <button
                onClick={() => setActiveTab('tasks')}
                className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm"
              >
                View Tasks
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-slate-800 px-2 flex justify-between items-center">
              Task Queue
              <span className="text-xs font-normal text-slate-400">{tasks.filter(t => t.status === 'completed').length}/{tasks.length} Done</span>
            </h3>
            {tasks.map((task, i) => (
              <div key={i} className={`p-5 rounded-3xl shadow-sm border transition-all ${task.status === 'completed' ? 'bg-slate-50 border-emerald-100 opacity-60' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${task.type === 'Collection' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {task.type}
                  </div>
                  {task.status === 'completed' ? (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      Verified
                    </span>
                  ) : (
                    task.day && <span className="text-xs font-bold text-red-500">Day {task.day} EXPIRED</span>
                  )}
                </div>
                <h4 className={`font-bold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.addr}</h4>
                <p className="text-xs text-slate-400 mt-1">Box ID: {task.id}</p>
                {task.boxToCollect && task.status === 'pending' && <div className="mt-3 p-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg text-center uppercase">Collect Old Box during Delivery</div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-100 px-6 py-4 flex justify-around z-40">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'scan' ? 'text-orange-600' : 'text-slate-400'}`}
        >
          <div className="w-6 h-6 flex items-center justify-center"><QRIcon /></div>
          <span className="text-[10px] font-bold uppercase">Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'text-orange-600' : 'text-slate-400'}`}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <TruckIcon />
            {tasks.some(t => t.status === 'pending') && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase">Tasks</span>
        </button>
      </nav>
    </div>
  );
};

export default DeliveryPartnerApp;
