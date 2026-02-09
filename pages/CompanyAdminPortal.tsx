import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, PackageIcon, LeafIcon, QRIcon } from '../components/Icons';
import { getInventory, validateAndTransition, Box } from '../utils/boxStore';

interface CompanyData {
  name: string;
  brandCode: string;
  subscription: string;
  totalBoxFleet: number;
  inCirculation: number;
  recyclingPhase: number;
  impactGrade: string;
  themeColor: string;
}

const CompanyAdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CompanyData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [inventory, setInventory] = useState<Box[]>([]);
  const [scanId, setScanId] = useState('');

  useEffect(() => {
    const userContextStr = localStorage.getItem('reboxify_session');
    if (!userContextStr) {
      navigate('/company-login');
      return;
    }

    const userContext = JSON.parse(userContextStr);
    if (userContext.role !== 'company') {
      navigate('/company-login');
      return;
    }
    setSession(userContext);
    setInventory(getInventory().filter(b => b.company === userContext.companyId));

    const companyDatabase: Record<string, CompanyData> = {
      'MNC-AMZ': {
        name: "Amazon India",
        brandCode: "AMZ-IN",
        subscription: "Enterprise Circular",
        totalBoxFleet: 15400,
        inCirculation: 12450,
        recyclingPhase: 420,
        impactGrade: "A++",
        themeColor: "text-amber-600"
      },
      'MNC-FLK': {
        name: "Flipkart Logistics",
        brandCode: "FLK-RT",
        subscription: "Standard Circular",
        totalBoxFleet: 8200,
        inCirculation: 6100,
        recyclingPhase: 150,
        impactGrade: "A",
        themeColor: "text-amber-600"
      }
    };

    if (userContext.companyId && companyDatabase[userContext.companyId]) {
      setData(companyDatabase[userContext.companyId]);
    } else {
      setData({
        name: "Unknown Company",
        brandCode: "N/A",
        subscription: "Unknown",
        totalBoxFleet: 0,
        inCirculation: 0,
        recyclingPhase: 0,
        impactGrade: "-",
        themeColor: "text-slate-600"
      });
    }
  }, [navigate]);

  const handleDispatchScan = () => {
    if (!scanId) return;
    const res = validateAndTransition(scanId, 'company', 'DISPATCHED', { company: session.companyId });
    if (res.success) {
      setInventory(getInventory().filter(b => b.company === session.companyId));
      setScanId('');
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  if (!data) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Portal...</div>;

  return (
    <div className="min-h-screen bg-yellow-50/20">
      <header className="bg-white border-b border-yellow-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-amber-600 font-bold p-2"><BuildingIcon /></button>
            <h1 className="text-xl font-bold text-slate-800">{data.name} <span className="text-amber-400 font-medium">| {data.brandCode}</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 ${data.impactGrade.includes('++') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} text-xs font-bold rounded-full`}>FLEET OPTIMAL</div>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">{data.brandCode.substring(0, 2)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="grid lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fleet ID Prefix</p>
            <h3 className={`text-2xl font-bold ${data.themeColor}`}>RBX-{data.brandCode}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MNC Assigned Units</p>
            <h3 className="text-2xl font-bold text-slate-900">{inventory.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ready to Dispatch</p>
            <h3 className="text-2xl font-bold text-emerald-600">{inventory.filter(b => b.status === 'EXPORTED').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Outbound</p>
            <h3 className="text-2xl font-bold text-amber-900">{inventory.filter(b => b.status === 'DISPATCHED').length}</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Packaging Scan Section */}
            <div className="bg-amber-100/50 p-8 rounded-[2.5rem] border border-amber-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><QRIcon /> Packaging Unit: Scan to Dispatch</h2>
              <div className="flex gap-4">
                <input
                  value={scanId}
                  onChange={(e) => setScanId(e.target.value)}
                  placeholder="Scan Box ID at Dispatch line"
                  className="flex-1 px-6 py-4 rounded-2xl bg-white border border-amber-200 font-bold focus:outline-amber-500"
                />
                <button onClick={handleDispatchScan} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all">Dispatch</button>
              </div>
              <p className="mt-3 text-[10px] text-amber-700 font-bold uppercase tracking-widest">Only boxes assigned to {data.name} in EXPORTED state can be dispatched.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-yellow-900/5 p-8 border border-slate-100 transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex justify-between items-center">
                MNC Inventory Table
                <span className="text-xs font-normal text-slate-400">Showing {inventory.length} boxes</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                      <th className="pb-4">Box ID</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Cycles</th>
                      <th className="pb-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.map(box => (
                      <tr key={box.id}>
                        <td className="py-4 font-mono font-bold text-slate-700">{box.id}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${box.status === 'EXPORTED' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {box.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-500">{box.uses}</td>
                        <td className="py-4 text-xs font-bold text-amber-600">Track Logistics</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-yellow-900/20">
              <h3 className="text-xl font-bold mb-4">ESG Impact Grade</h3>
              <p className="text-amber-200 text-sm mb-6">Your current circularity rate is <strong>98.2%</strong>. This month you offset <strong>240kg</strong> of single-use plastic.</p>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <span className="text-[10px] font-bold text-white/50 uppercase block mb-1">Carbon Saved</span>
                <p className="text-xl font-bold tracking-tight">1.2 Tonnes CO2e</p>
              </div>
              <button className="w-full mt-6 py-4 bg-white text-amber-900 rounded-2xl font-bold hover:bg-amber-50 transition-colors">Download ESG Report</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyAdminPortal;
