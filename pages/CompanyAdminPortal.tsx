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

  const [scanning, setScanning] = useState<'EXPORTED' | 'DISPATCHED' | null>(null);

  const handleScanner = (type: 'EXPORTED' | 'DISPATCHED') => {
    setScanning(type);

    setTimeout(() => {
      if (!(window as any).Html5QrcodeScanner) {
        alert("Scanner library failed to load.");
        setScanning(null);
        return;
      }

      const scanner = new (window as any).Html5QrcodeScanner(
        "company-reader",
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

          const res = validateAndTransition(resultId, 'company', type, { company: session.companyId });
          if (res.success) {
            setInventory(getInventory().filter(b => b.company === session.companyId));
            alert(res.message);
          } else {
            alert(res.message);
          }
        },
        () => { }
      );
    }, 500);
  };

  if (!data) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Portal...</div>;

  return (
    <div className="min-h-screen bg-yellow-50/20">
      {/* Scanner Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6">
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
            <h3 className="text-white font-bold text-lg uppercase tracking-widest">{scanning === 'EXPORTED' ? 'Receipt Scan' : 'Dispatch Scan'}</h3>
            <button onClick={() => setScanning(null)} className="text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div className="w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black/50 bg-white border border-slate-700/50">
            <div id="company-reader" className="w-full min-h-[300px]"></div>
          </div>

          <div className="mt-8 text-center px-8 space-y-2">
            <p className="text-white font-medium">Scan Official ReBoxify QR</p>
            <p className="text-slate-400 text-sm leading-relaxed">Processing hub-side logistics for {data.name}.</p>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            #company-reader { border: none !important; }
            #company-reader img { display: none !important; }
            #company-reader__dashboard_section_csr button {
              background: #f59e0b !important;
              color: white !important;
              padding: 12px 24px !important;
              border-radius: 12px !important;
              font-weight: bold !important;
              border: none !important;
              margin: 10px 0 !important;
              cursor: pointer !important;
            }
            #company-reader video { border-radius: 20px !important; object-fit: cover !important; }
            #company-reader a { display: none !important; }
          `}} />
        </div>
      )}

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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Returns</p>
            <h3 className="text-2xl font-bold text-orange-600">{inventory.filter(b => b.status === 'RECEIVED').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Outbound</p>
            <h3 className="text-2xl font-bold text-amber-900">{inventory.filter(b => b.status === 'DISPATCHED').length}</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Hub Scanning Section */}
            <div className="bg-amber-100/50 p-8 rounded-[2.5rem] border border-amber-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><QRIcon /> Hub Operations: Camera Scanning</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleScanner('EXPORTED')}
                  className="flex flex-col items-center justify-center p-8 bg-white border border-amber-200 rounded-[2rem] hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <PackageIcon />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest">Confirm Receipt</span>
                  <span className="text-[10px] opacity-60 mt-1 uppercase">Ready for Reuse</span>
                </button>

                <button
                  onClick={() => handleScanner('DISPATCHED')}
                  className="flex flex-col items-center justify-center p-8 bg-white border border-amber-200 rounded-[2rem] hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95 group"
                >
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <LeafIcon />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest">Dispatch Now</span>
                  <span className="text-[10px] opacity-60 mt-1 uppercase">Finalize Outbound</span>
                </button>
              </div>
              <p className="mt-6 text-[10px] text-amber-700 font-bold uppercase tracking-widest text-center">
                Launch camera to process box lifecycle stages instantly.
              </p>
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${box.status === 'EXPORTED' ? 'bg-indigo-100 text-indigo-700' :
                            box.status === 'RECEIVED' ? 'bg-orange-100 text-orange-700' :
                              box.status === 'DISPATCHED' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
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
