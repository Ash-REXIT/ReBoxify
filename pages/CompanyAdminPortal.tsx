import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, PackageIcon, LeafIcon, QRIcon } from '../components/Icons';
import { getInventory, validateAndTransition, extractBoxId, getDepositAmount, Box, calculateNetImpact } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, updateIssueStatus, deleteIssue, Issue, IssueStatus } from '../utils/issueStore';

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
  const { session, logout } = useAuth();
  const { user } = session;
  const [data, setData] = useState<CompanyData | null>(null);
  const [inventory, setInventory] = useState<Box[]>([]);
  const [scanId, setScanId] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'company') {
      return;
    }

    const companyId = user.details?.companyId;
    setInventory(getInventory().filter(b => b.company === companyId));

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

    if (companyId && companyDatabase[companyId]) {
      setData(companyDatabase[companyId]);
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

    const refreshIssues = () => {
      const allIssues = getIssues();
      const companyId = user.details?.companyId;
      setIssues(allIssues.filter(i => i.companyId === companyId));
    };

    refreshIssues();
    const interval = setInterval(refreshIssues, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const [scanning, setScanning] = useState<'EXPORTED' | 'DISPATCHED' | null>(null);
  const [manualId, setManualId] = useState('');

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

          const resultId = extractBoxId(decodedText);

          if (!resultId) {
            alert(`Scan Error: No valid Box ID detected.\nPlease ensure the QR code follows the AAA-000 pattern.`);
            return;
          }

          const res = validateAndTransition(resultId, 'company', type, { company: user?.details?.companyId });
          if (res.success) {
            setInventory(getInventory().filter(b => b.company === user?.details?.companyId));
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

  // --- LIVE ESG CALCULATIONS ---

  const totalIssued = inventory.length;
  const reusedCount = inventory.filter(b => b.condition === 'GOOD' || b.condition === 'MINOR_DAMAGE').length;
  const recycledCount = inventory.filter(b => b.condition === 'DAMAGED').length;
  const circularityRate = totalIssued > 0
    ? ((reusedCount + recycledCount) / totalIssued) * 100
    : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyReuses = inventory
    .filter(b => {
      const d = b.createdAt ? new Date(b.createdAt) : new Date();
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, b) => acc + b.uses, 0);
  const plasticOffsetKg = monthlyReuses * 0.8;

  const totalReusesAllTime = inventory.reduce((acc, b) => acc + b.uses, 0);
  const carbonSavedTonnes = (totalReusesAllTime * 0.5) / 1000;

  let impactGrade = 'C';
  let gradeColor = 'text-slate-400 bg-slate-100';
  if (circularityRate >= 95) { impactGrade = 'A+'; gradeColor = 'text-emerald-700 bg-emerald-100'; }
  else if (circularityRate >= 90) { impactGrade = 'A'; gradeColor = 'text-emerald-600 bg-emerald-50'; }
  else if (circularityRate >= 80) { impactGrade = 'B'; gradeColor = 'text-blue-600 bg-blue-50'; }

  const downloadESGReport = () => {
    const timestamp = new Date().toLocaleString();
    const period = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const reportHtml = `
      <html>
        <head>
          <title>ESG Report - ${data.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }
            .report-card { max-width: 900px; margin: 0 auto; border: 1px solid #f1f5f9; padding: 60px; position: relative; overflow: hidden; }
            .watermark { position: absolute; top: -50px; right: -50px; font-size: 200px; font-weight: 900; color: #f8fafc; transform: rotate(-15deg); z-index: -1; }
            
            header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 30px; margin-bottom: 50px; }
            .logo-section h1 { font-size: 40px; font-weight: 900; margin: 0; color: #059669; }
            .logo-section p { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.2em; text-transform: uppercase; margin: 5px 0 0; }
            
            .meta-section { text-align: right; }
            .meta-section h2 { font-size: 18px; font-weight: 900; margin: 0; }
            .meta-section p { font-size: 12px; color: #64748b; margin: 5px 0; }
            
            .grade-badge { display: inline-block; padding: 10px 25px; border-radius: 15px; font-weight: 900; font-size: 24px; margin-top: 10px; }
            .grade-A-plus { background: #ecfdf5; color: #047857; border: 1px solid #10b981; }
            .grade-A { background: #f0fdf4; color: #166534; border: 1px solid #22c55e; }
            .grade-B { background: #eff6ff; color: #1d4ed8; border: 1px solid #3b82f6; }
            .grade-C { background: #f8fafc; color: #475569; border: 1px solid #94a3b8; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-bottom: 50px; }
            .kpi-item { background: #f8fafc; padding: 30px; border-radius: 25px; border-left: 5px solid #0f172a; }
            .kpi-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px; }
            .kpi-value { font-size: 32px; font-weight: 900; color: #0f172a; }
            .kpi-unit { font-size: 14px; font-weight: 700; color: #64748b; margin-left: 5px; }
            .narrative { line-height: 1.8; color: #334155; font-size: 15px; margin-bottom: 50px; }
            .methodology { font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 30px; }
            footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #f1f5f9; padding-top: 30px; }
            .stamp { width: 100px; height: 100px; border: 4px solid #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-10deg); color: #059669; font-weight: 900; text-align: center; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="report-card">
            <div class="watermark">CERTIFIED</div>
            <header>
              <div class="logo-section">
                <h1>ReBoxify</h1>
                <p>Circular Logistics Protocol</p>
                <div class="grade-badge grade-${impactGrade.replace('+', '-plus')}">GRADE ${impactGrade}</div>
              </div>
              <div class="meta-section">
                <p>OFFICIAL SUSTAINABILITY DISCLOSURE</p>
                <h2>${data.name}</h2>
                <p>Partner ID: <b>${data.brandCode}</b></p>
                <p>Period: <b>${period}</b></p>
              </div>
            </header>
            <div class="narrative">
              Environmental performance report for <b>${data.name}</b>. Through the ReBoxify Circular Protocol, your organization has significantly reduced scoping emissions.
            </div>
            <div class="kpi-grid">
              <div class="kpi-item">
                <span class="kpi-label">Circularity Performance</span>
                <span class="kpi-value">${circularityRate.toFixed(1)}</span><span class="kpi-unit">% Effectiveness</span>
              </div>
              <div class="kpi-item" style="border-left-color: #10b981;">
                <span class="kpi-label">Material Recovery</span>
                <span class="kpi-value">${plasticOffsetKg.toFixed(1)}</span><span class="kpi-unit">kg Plastic Avoided</span>
              </div>
            </div>
            <div class="methodology">
              <h4>Methodology</h4>
              Data derived from ReBoxify Real-time Inventory Ledger.
            </div>
            <footer>
              <div style="font-size: 11px; color: #64748b;">
                <p>&copy; 2026 ReBoxify Sustainable Systems Inc.</p>
              </div>
              <div class="stamp">ECOLOGICAL<br>VANGUARD<br>CERTIFIED</div>
            </footer>
          </div>
          <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
            <button onclick="window.print()" style="background: #0f172a; color: white; padding: 15px 30px; border-radius: 15px; font-weight: 900; cursor: pointer; border: none;">Print PDF</button>
          </div>
        </body>
      </html>
    `;

    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
    } else {
      alert("Please allow popups to view the professional report.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-700">
      {/* Scanner Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
            <h3 className="text-white font-black text-xl uppercase tracking-[0.3em]">{scanning === 'EXPORTED' ? 'Receipt Scan' : 'Dispatch Scan'}</h3>
            <button onClick={() => setScanning(null)} className="text-white/60 hover:text-white transition-colors bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="w-full max-w-sm overflow-hidden rounded-[3rem] shadow-2xl shadow-black/50 bg-white dark:bg-slate-800 border-8 border-white/10 dark:border-white/5">
            <div id="company-reader" className="w-full min-h-[300px]"></div>
          </div>
          <div className="mt-8 text-center px-8 space-y-4 w-full max-w-sm">
            <div className="flex gap-3 pt-6 border-t border-white/10">
              <input
                type="text"
                placeholder="Manual ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono"
              />
              <button
                onClick={() => {
                  if (!manualId.trim()) return;
                  const cleanId = extractBoxId(manualId);
                  const res = validateAndTransition(cleanId, 'company', scanning || 'EXPORTED', { company: user?.details?.companyId });
                  if (res.success) {
                    setInventory(getInventory().filter(b => b.company === user?.details?.companyId));
                    alert(res.message);
                    setScanning(null);
                    setManualId('');
                  } else {
                    alert(res.message);
                  }
                }}
                className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-black text-xs"
              >
                GO
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            #company-reader { border: none !important; }
            #company-reader video { border-radius: 24px !important; object-fit: cover !important; }
            #company-reader a { display: none !important; }
          `}} />
        </div>
      )}

      <header className="bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl border-b border-slate-200 dark:border-white/[0.05] px-6 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10 transition-all active:scale-90 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6">
                <BuildingIcon />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none group-hover:text-emerald-600 transition-colors">{data.name}</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">{data.brandCode} Authorized Portal</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/[0.02]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Fleet Prefix</p>
            <h3 className={`text-4xl font-black tracking-tighter ${data.themeColor}`}>RBX-{data.brandCode}</h3>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/[0.02]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Assigned Units</p>
            <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{inventory.length}</h3>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/[0.02]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Pending Returns</p>
            <h3 className="text-4xl font-black tracking-tighter text-orange-600">{inventory.filter(b => b.status === 'RECEIVED').length}</h3>
          </div>
          <div className="bg-emerald-600/5 dark:bg-emerald-600/10 p-8 rounded-[3rem] border border-emerald-500/20 shadow-2xl shadow-emerald-500/[0.05]">
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-2">Net Impact</p>
            <h3 className="text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-500">{calculateNetImpact(inventory).totalImpact.toFixed(1)}kg</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Hub Operations */}
            <div className="bg-amber-500/5 dark:bg-amber-500/10 p-10 rounded-[4rem] border border-amber-500/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                  <QRIcon />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Hub Operations</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => handleScanner('EXPORTED')} className="p-10 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[3rem] hover:bg-emerald-600 hover:text-white transition-all font-black text-xs uppercase tracking-widest">Confirm Receipt</button>
                <button onClick={() => handleScanner('DISPATCHED')} className="p-10 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[3rem] hover:bg-amber-600 hover:text-white transition-all font-black text-xs uppercase tracking-widest">Dispatch Loop</button>
              </div>
            </div>

            {/* Disruption Ledger */}
            <div className="bg-white dark:bg-white/[0.01] rounded-[4rem] shadow-2xl shadow-black/[0.02] p-10 border border-slate-200 dark:border-white/[0.05]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 font-bold">!</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Disruption Ledger</h2>
              </div>

              {issues.length === 0 ? (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-10">No disruptions reported.</p>
              ) : (
                <div className="space-y-4">
                  {issues.map(issue => (
                    <div key={issue.issueId} className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded uppercase">{issue.boxId}</span>
                          <span className="text-[9px] font-black text-indigo-500 uppercase">{issue.issueType}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
                      </div>
                      <select
                        value={issue.status}
                        onChange={(e) => {
                          updateIssueStatus(issue.issueId, e.target.value as IssueStatus);
                          setIssues(getIssues().filter(i => i.companyId === user?.details?.companyId));
                        }}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black outline-none"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm("Permanently archive this disruption?")) {
                            deleteIssue(issue.issueId);
                            setIssues(getIssues().filter(i => i.companyId === user?.details?.companyId));
                          }
                        }}
                        className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0"
                        title="Delete Disruption"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 0 0 1-2-2V6" /><path d="M8 6V4a2 0 0 1 2-2h4a2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fleet Ledger */}
            <div className="bg-white dark:bg-white/[0.01] rounded-[4rem] shadow-2xl shadow-black/[0.02] p-10 border border-slate-200 dark:border-white/[0.05]">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-10 uppercase">Fleet Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400">
                      <th className="pb-6">Asset ID</th>
                      <th className="pb-6">Phase</th>
                      <th className="pb-6 text-center">Loops</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(box => (
                      <tr key={box.id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="py-6 font-mono font-black text-slate-900 dark:text-white tracking-widest">{box.id}</td>
                        <td className="py-6 lowercase italic text-xs text-slate-500">{box.status}</td>
                        <td className="py-6 text-center font-black text-slate-900 dark:text-white">{box.uses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 dark:bg-white/[0.01] rounded-[4rem] p-10 text-white shadow-2xl border border-slate-800 dark:border-white/[0.05]">
              <h3 className="text-3xl font-black tracking-tighter mb-10">ESG Insights</h3>
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">Circularity</span>
                  <p className="text-3xl font-black">{circularityRate.toFixed(1)}%</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-[9px] font-black text-indigo-400 uppercase block mb-1">Plastic Avoided</span>
                  <p className="text-3xl font-black">{plasticOffsetKg.toFixed(1)}kg</p>
                </div>
              </div>
              <button onClick={downloadESGReport} className="w-full mt-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Audit Report</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyAdminPortal;
