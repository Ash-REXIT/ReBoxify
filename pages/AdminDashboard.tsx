import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, TruckIcon, QRIcon } from '../components/Icons';
import { getInventory, validateAndTransition, Box } from '../utils/boxStore';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Box[]>([]);
  const [newBoxId, setNewBoxId] = useState('');

  const sessionString = localStorage.getItem('reboxify_session');
  const session = sessionString ? JSON.parse(sessionString) : null;

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  if (!session || session.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access.</div>;
  }

  const logout = () => {
    localStorage.removeItem('reboxify_session');
    localStorage.removeItem('reboxify_user_context');
    navigate('/');
  };

  const createBox = () => {
    if (!newBoxId) return;
    const current = getInventory();
    if (current.find(b => b.id === newBoxId)) {
      alert("Box ID already exists!");
      return;
    }
    const newBox: Box = { id: newBoxId, company: null, status: 'CREATED', uses: 0, condition: 'NEW' };
    const updated = [...current, newBox];
    localStorage.setItem('reboxify_inventory', JSON.stringify(updated));
    setInventory(updated);
    setNewBoxId('');
    alert(`Box ${newBoxId} created successfully!`);
  };

  const assignToMNC = (id: string, companyId: string) => {
    const res = validateAndTransition(id, 'admin', 'EXPORTED', { company: companyId });
    if (res.success) {
      setInventory(getInventory());
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-20">
      <header className="px-8 py-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold">R</div>
          <div>
            <h1 className="text-xl font-bold">ReBoxify Super Admin</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">System Governance active</p>
          </div>
        </div>
        <button onClick={logout} className="px-5 py-2.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-sm font-bold transition-all">Exit Control</button>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Global Inventory Overview */}
        <section className="grid lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Box Assets</span>
            <div className="text-4xl font-bold mt-2">{inventory.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Active in Loop</span>
            <div className="text-4xl font-bold mt-2 text-emerald-500">{inventory.filter(b => b.status !== 'CREATED' && b.status !== 'RETIRED').length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">MNC Partners</span>
            <div className="text-4xl font-bold mt-2">2</div>
          </div>
          <div className="bg-emerald-600/20 p-6 rounded-[2.5rem] border border-emerald-500/30">
            <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Plastic Waste Saved</span>
            <div className="text-4xl font-bold mt-2 text-white">420kg</div>
          </div>
        </section>

        {/* Create Box Section */}
        <section className="bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><QRIcon /> Asset Registration</h2>
          <div className="flex gap-4 max-w-md">
            <input
              value={newBoxId}
              onChange={(e) => setNewBoxId(e.target.value)}
              placeholder="Enter unique Box ID (e.g. RBX-101)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
            <button onClick={createBox} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-sm transition-all whitespace-nowrap">Register Box</button>
          </div>
        </section>

        {/* Detailed Inventory Management */}
        <section className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden">
          <div className="p-8 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Global Lifecycle Tracking</h2>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-slate-700 rounded-lg text-xs font-bold uppercase">Live Ops</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-700">
                  <th className="px-8 py-4">Box ID</th>
                  <th className="px-8 py-4">Current Status</th>
                  <th className="px-8 py-4">MNC / Assignment</th>
                  <th className="px-8 py-4">Condition</th>
                  <th className="px-8 py-4">Uses</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {inventory.map((box) => (
                  <tr key={box.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-8 py-5 font-bold font-mono text-emerald-400">{box.id}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${box.status === 'CREATED' ? 'bg-slate-700 text-slate-300' :
                          box.status === 'EXPORTED' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                            box.status === 'DISPATCHED' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                              box.status === 'DELIVERED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                        {box.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium">
                      {box.company ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center text-[10px]"><BuildingIcon /></div>
                          {box.company}
                        </div>
                      ) : 'Unassigned'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${box.condition === 'NEW' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                        {box.condition}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400">{box.uses}</td>
                    <td className="px-8 py-5 text-right">
                      {box.status === 'CREATED' || box.status === 'RETIRED' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => assignToMNC(box.id, 'MNC-AMZ')} className="px-3 py-1.5 bg-slate-700 hover:bg-amber-600 rounded-lg text-[10px] font-bold uppercase transition-all">Assign Amazon</button>
                          <button onClick={() => assignToMNC(box.id, 'MNC-FLK')} className="px-3 py-1.5 bg-slate-700 hover:bg-blue-600 rounded-lg text-[10px] font-bold uppercase transition-all">Assign Flipkart</button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase italic">In Logistics Loop</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
