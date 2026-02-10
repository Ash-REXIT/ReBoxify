import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, QRIcon, PackageIcon } from '../components/Icons';
import { getInventory, validateAndTransition, Box } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';
import { saveIssue } from '../utils/issueStore';
// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Custom Icons ---
const partnerIcon = new L.DivIcon({
  className: 'custom-partner-icon',
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); position: relative;">
            <div style="position: absolute; top: -30px; left: -18px; background: white; padding: 2px 6px; border-radius: 8px; font-weight: bold; font-size: 10px; color: #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap;">You</div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const collectionIcon = new L.DivIcon({
  className: 'custom-collection-icon',
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const DeliveryPartnerApp: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scan' | 'tasks'>('scan');
  const [scanning, setScanning] = useState<string | null>(null);

  // Added View Mode State
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');

  // Link to the Real Backend Inventory
  const [inventory, setInventory] = useState<Box[]>(getInventory());
  const [tasks, setTasks] = useState<any[]>([]);

  const [conditionPending, setConditionPending] = useState<{ id: string, type: string } | null>(null);

  // Map Data
  const [currentPos] = useState<[number, number]>([13.0827, 80.2707]);
  const [collectionPoints] = useState(() => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      points.push([
        13.0827 + (Math.random() - 0.5) * 0.04,
        80.2707 + (Math.random() - 0.5) * 0.04
      ] as [number, number]);
    }
    return points;
  });

  // Use Auth Hook
  const { session, awardTokens } = useAuth();
  const user = session?.user;

  useEffect(() => {
    if (!session.isAuthenticated || user?.role !== 'partner') {
      navigate('/partner-login');
      return;
    }
    // Generate tasks based on real inventory state
    const currentInv = getInventory();
    const activeTasks = currentInv.filter(b => b.status === 'DISPATCHED' || b.status === 'DELIVERED').map(b => ({
      id: b.id,
      addr: 'Demo Address ' + b.id.split('-')[1],
      type: b.status === 'DISPATCHED' ? 'Delivery' : 'Collection',
      status: 'pending',
      day: b.deadline ? Math.ceil((new Date(b.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      boxToCollect: b.status === 'DELIVERED'
    }));
    setTasks(activeTasks);
    setInventory(currentInv);
  }, [navigate, session, user]);

  if (!session.isAuthenticated || user?.role !== 'partner') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Authenticating Agent...</div>;

  const handleConditionSubmit = (condition: 'GOOD' | 'MINOR_DAMAGE' | 'DAMAGED') => {
    if (!conditionPending) return;

    const { id, type } = conditionPending;
    const res = validateAndTransition(id, 'partner', 'RECEIVED', { condition });

    if (res.success && res.box) {
      // Award Green Tokens based on condition
      let points = 0;
      if (condition === 'GOOD') points = 5;
      else if (condition === 'MINOR_DAMAGE') points = 3;

      if (points > 0 && res.box.customer_id) {
        awardTokens(res.box.customer_id, points);
      } else if (condition === 'DAMAGED') {
        // Auto-report issue to Global Anomaly Registry
        saveIssue({
          boxId: id,
          customerId: res.box.customer_id || 'Unknown',
          companyId: res.box.company || 'Unknown',
          issueType: 'Box damaged on delivery',
          description: `Significant damage reported by Partner ${user?.id} during collection scan. Flagged for auto-resolution.`
        });
      }

      const rewardMsg = points > 0 ? `\nUser rewarded with +${points} Green Tokens!` : '\nNo tokens awarded due to damage. Incident logged.';
      alert(`Collection Successful!${rewardMsg}\nBox ${id} is now in RECEIVED state.`);

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
            // Immediate delivery transition - Assign to Demo User for seamless flow
            const res = validateAndTransition(resultId, 'partner', 'DELIVERED', { customer_id: 'user@demo.com' });
            if (res.success) {
              alert(`Delivery Successful!\nBox ${resultId} handed over to user@demo.com.\n\nTask updated to Collection Phase.`);
              setInventory(getInventory());
              // Update local task state: Transition from Delivery -> Collection immediately
              setTasks(prev => prev.map(t => t.id === resultId ? { ...t, type: 'Collection', status: 'pending', boxToCollect: true } : t));
            } else {
              alert(`Error: ${res.message}`);
            }
          }
        },
        () => { }
      );
    }, 500);
  };


  // --- MAP VIEW RENDER ---
  if (viewMode === 'map') {
    return (
      <div className="h-screen w-full bg-slate-50 relative overflow-hidden flex flex-col font-sans">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-[1000]">
          <button
            onClick={() => setViewMode('dashboard')}
            className="flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-xl text-slate-700 font-bold hover:bg-white transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to Dashboard
          </button>
        </div>

        {/* MAP VIEW - Read Only */}
        <div className="flex-1 relative z-0">
          <MapContainer
            center={currentPos}
            zoom={13}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />

            {/* Delivery Partner (You) */}
            <Marker position={currentPos} icon={partnerIcon}>
              <Popup>You (Delivery Partner)</Popup>
            </Marker>

            {/* Collection Bots */}
            {collectionPoints.map((pos, i) => (
              <Marker key={i} position={pos} icon={collectionIcon}>
                <Popup>Collection Task #{i + 1}</Popup>
              </Marker>
            ))}

          </MapContainer>
        </div>
      </div>
    );
  }

  // --- DASHBOARD RENDER ---
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
            <p className="text-slate-400 text-sm leading-relaxed">System updates only the specific tasks assigned for {user?.zone || 'your zone'}.</p>
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
                const res = validateAndTransition(simId, 'partner', 'DELIVERED', { customer_id: 'user@demo.com' });
                if (res.success) {
                  alert(res.message + "\nAssigned to user@demo.com\n\nProceeding to Collection Phase.");
                  setTasks(prev => prev.map(t => t.id === simId ? { ...t, type: 'Collection', status: 'pending', boxToCollect: true } : t));
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.id} | {user?.zone || 'General Zone'}</span>
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
            {/* Added MAP VIEW CARD */}
            <div
              onClick={() => setViewMode('map')}
              className="w-full h-32 rounded-[2rem] bg-slate-800 relative overflow-hidden cursor-pointer group shadow-xl shadow-slate-900/10 border-2 border-white"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-between p-8 text-white relative z-10">
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">Live Map View</h3>
                  <p className="text-xs text-slate-400">Track {tasks.filter(t => t.type === 'Collection').length} nearby pickup points</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-slate-900 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-900/5 text-center transition-all hover:shadow-orange-900/10 border border-slate-50">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-orange-50">
                <QRIcon />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">QR Workflow</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Scan box QR at each stage to update the circular lifecycle.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleScan('Delivery Scan')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <TruckIcon />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest text-center">Delivery Scan</span>
                  <span className="text-[10px] opacity-60 mt-1 uppercase text-center">Handover Box</span>
                </button>

                <button
                  onClick={() => handleScan('Collection Scan')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <QRIcon />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest text-center">Collection</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 group-hover:text-emerald-300 mt-1 transition-colors text-center">Confirm Condition</span>
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
