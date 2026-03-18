import { useState, useEffect } from "react";
import {
  Globe, ShieldAlert, Activity, Target, Power, AlertTriangle, RefreshCcw,
  Snowflake, Save, X, BarChart2, TrendingUp, TrendingDown, Crosshair, Layers, Search, Zap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Dashboard from "./Dashboard"; 

interface PortfolioAccount { id: number; name: string; balance: number; allocation_percent: number; status: string; net_pnl: number; drawdown_percent: number; win_rate: number; }
interface PortfolioMetrics { total_equity: number; mode: "NORMAL" | "REDUCED" | "HALT"; max_daily_risk: number; accounts: PortfolioAccount[]; }
interface StatMetrics { total_trades: number; wins: number; net_pnl: number; }
interface PerformanceAnalytics { by_score: Record<string, StatMetrics>; by_phase: Record<string, StatMetrics>; }

export default function AUMTerminal() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [draftAllocations, setDraftAllocations] = useState<PortfolioAccount[]>([]);
  const [inspectingAccount, setInspectingAccount] = useState<PortfolioAccount | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PerformanceAnalytics | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/portfolio/metrics/");
      if (!res.ok) throw new Error("API Endpoint Disconnected");
      const data = await res.json();
      setMetrics(data);
    } catch (e: any) { toast.error("Failed to load Portfolio data: " + e.message); }
  };

  useEffect(() => {
    loadData();
    const i = setInterval(() => { if (!isRebalancing && !inspectingAccount) loadData(); }, 5000);
    return () => clearInterval(i);
  }, [isRebalancing, inspectingAccount]);

  const changeMode = async (newMode: string) => {
    if (!confirm(`Confirm system-wide transition to mode: ${newMode}?`)) return;
    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/portfolio/mode/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: newMode }) });
      if (!res.ok) throw new Error("API Update Failure");
      toast.success(`System Mode switched to ${newMode}`);
      loadData();
    } catch (e: any) { toast.error("Error switching mode: " + e.message); }
  };

  const handleOpenRebalancePanel = () => {
    if (!metrics) return;
    setDraftAllocations(JSON.parse(JSON.stringify(metrics.accounts)));
    setIsRebalancing(true);
  };

  const handleApplyRebalance = async () => {
    try {
      const payload = draftAllocations.map(acc => ({ account_id: acc.id, weight_percent: Number(acc.allocation_percent), status: acc.status }));
      const res = await fetch("https://mk-project19-1.onrender.com/api/portfolio/rebalance/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload }) });
      if (!res.ok) throw new Error("Reallocation Protocol Failed");
      toast.success("REBALANCE EXECUTED: Capital allocation updated.");
      setIsRebalancing(false); loadData();
    } catch (e: any) { toast.error("Error: " + e.message); }
  };

  const handleInspectAnalytics = async (acc: PortfolioAccount) => {
    setInspectingAccount(acc); setAnalyticsData(null);
    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/portfolio/analytics/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: acc.id }) });
      if (!res.ok) throw new Error("Analytics Retrieval Failed");
      const data = await res.json(); setAnalyticsData(data);
    } catch (e: any) { toast.error("Inspection Error: " + e.message); }
  };

  const getWinRate = (wins: number, total: number) => { if (total === 0) return 0; return ((wins / total) * 100).toFixed(1); };

  const renderScoreCard = (title: string, data: StatMetrics, colorTheme: "green" | "blue" | "orange" | "red") => {
    const themes = {
      green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", icon: <Target size={20} className="text-green-600" /> },
      blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", icon: <Activity size={20} className="text-blue-600" /> },
      orange: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", icon: <AlertTriangle size={20} className="text-amber-600" /> },
      red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", icon: <Zap size={20} className="text-red-600" /> }
    };
    const theme = themes[colorTheme];
    const wr = getWinRate(data.wins, data.total_trades);

    return (
      <div className={`bg-white p-5 rounded-2xl border-2 ${theme.border} shadow-sm`}>
        <div className="flex justify-between items-center mb-4"><span className="text-sm font-extrabold text-slate-800">{title}</span><div className={`p-2 rounded-lg ${theme.bg}`}>{theme.icon}</div></div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200"><span className="text-xs text-slate-500 font-bold uppercase">Net PnL</span><span className={`text-xl font-black flex items-center gap-1 ${data.net_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.net_pnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}${Math.abs(data.net_pnl).toFixed(2)}</span></div>
          <div className="flex justify-between items-center"><span className="text-xs text-slate-500 font-bold">Win Rate: <span className={theme.text}>{wr}%</span></span><span className="text-xs text-slate-500 font-bold">Trades: <span className="text-slate-900">{data.total_trades}</span></span></div>
        </div>
      </div>
    );
  };

  if (!metrics) return <div className="p-10 text-center text-slate-500 font-bold">Aggregating Master Fund Data...</div>;

  return (
    <div className="p-6 font-sans bg-slate-50 min-h-screen relative flex flex-col gap-8">
      <Toaster position="top-right" />
      
      {/* THIẾT KẾ MỚI: BẢNG HUD ĐEN CHUẨN INSTITUTIONAL */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800">
        
        {/* AUM COLUMN */}
        <div className="flex flex-col w-full md:w-auto">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
            <Globe size={14} className="text-blue-500"/> MASTER FUND EQUITY
          </span>
          <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
            ${metrics.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* SYSTEM MODE PILL SWITCH */}
        <div className="flex flex-col items-start md:items-end w-full md:w-auto">
           <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
             <ShieldAlert size={14} className={metrics.mode === "NORMAL" ? "text-emerald-500" : metrics.mode === "REDUCED" ? "text-amber-500" : "text-red-500"}/> 
             EXECUTION PROTOCOL
           </span>
           <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto">
              <button onClick={() => changeMode("NORMAL")} className={`flex-1 md:flex-none px-6 py-2 text-xs font-black rounded-lg transition-all ${metrics.mode === 'NORMAL' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white cursor-pointer'}`}>
                NORMAL
              </button>
              <button onClick={() => changeMode("REDUCED")} className={`flex-1 md:flex-none px-6 py-2 text-xs font-black rounded-lg transition-all ${metrics.mode === 'REDUCED' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white cursor-pointer'}`}>
                REDUCED
              </button>
              <button onClick={() => changeMode("HALT")} className={`flex-1 md:flex-none px-6 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${metrics.mode === 'HALT' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white cursor-pointer'}`}>
                <Power size={12}/> HALT
              </button>
           </div>
        </div>
      </div>

      <div className="bg-slate-100/50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
        <Dashboard accountId={1} />
      </div>

      {/* KHỐI 3: PHÂN BỔ VỐN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="m-0 flex items-center gap-2 text-slate-900 text-lg font-bold">
            <Target size={20} className="text-blue-500" /> Capital Allocation Matrix
          </h3>
          <button onClick={handleOpenRebalancePanel} className="bg-slate-900 text-white border-none py-2 px-4 rounded-lg font-bold cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-800 transition">
            <RefreshCcw size={16} /> REBALANCE
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {metrics.accounts.map(acc => {
            const isFrozen = acc.status === "FROZEN";
            const isClamped = acc.status === "CLAMPED";
            
            return (
              <div key={acc.id} className={`flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 rounded-xl border ${isFrozen ? "bg-slate-50 border-dashed border-slate-300 opacity-70" : isClamped ? "bg-amber-50 border-dashed border-amber-500" : "bg-white border-slate-200"}`}>
                <div className="w-full lg:w-60 flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">{acc.name} <span className="text-[10px] text-slate-400 font-normal">(ID:{acc.id})</span></span>
                  <div className="flex gap-2">
                    {isFrozen && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold flex gap-1 items-center"><Snowflake size={10} /> FROZEN</span>}
                    {isClamped && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold flex gap-1 items-center"><AlertTriangle size={10} /> CLAMPED</span>}
                    {!isFrozen && !isClamped && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">NORMAL</span>}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className={`text-[11px] font-bold ${acc.net_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{acc.net_pnl >= 0 ? '+' : ''}${Math.abs(acc.net_pnl).toFixed(2)}</span>
                    <span className="text-[11px] font-bold text-slate-500">{acc.win_rate.toFixed(0)}% WR</span>
                    {acc.drawdown_percent > 0 && <span className="text-[11px] font-bold text-red-500">▼ {acc.drawdown_percent.toFixed(1)}% DD</span>}
                  </div>
                </div>

                <div className="flex-1 w-full bg-slate-100 h-6 rounded-full overflow-hidden relative">
                  <div className={`h-full transition-all duration-500 ${isFrozen ? "bg-slate-400" : isClamped ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-blue-700"}`} style={{ width: `${acc.allocation_percent}%` }} />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black ${acc.allocation_percent > 10 ? "text-white" : "text-slate-500"}`}>{acc.allocation_percent.toFixed(1)}%</span>
                </div>

                <div className="w-full lg:w-40 text-left lg:text-right flex flex-col">
                  <span className={`text-base font-extrabold ${isFrozen ? "text-slate-400" : "text-slate-900"}`}>Allocated: ${(metrics.total_equity * (acc.allocation_percent / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-[11px] text-slate-500">Real Bal: ${acc.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>

                <button onClick={() => handleInspectAnalytics(acc)} className="w-full lg:w-auto p-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer flex justify-center items-center gap-2 text-blue-700 font-bold text-xs hover:bg-blue-100 transition">
                  <Search size={14} /> View Analytics
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* REBALANCE MODAL */}
      {isRebalancing && (
        <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
              <h2 className="m-0 text-slate-900 flex items-center gap-2 text-xl font-bold"><Activity className="text-blue-500" /> Capital Rebalance</h2>
              <button onClick={() => setIsRebalancing(false)} className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-slate-800"><X size={24} /></button>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-5">
              <button onClick={() => setIsRebalancing(false)} className="flex-1 py-3 bg-slate-100 border-none rounded-lg font-bold text-slate-500 cursor-pointer hover:bg-slate-200">Discard</button>
              <button onClick={handleApplyRebalance} className="flex-[2] py-3 bg-slate-900 border-none rounded-lg font-bold text-white cursor-pointer flex justify-center items-center gap-2 hover:bg-slate-800">
                <Save size={18} /> COMMIT REBALANCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS MODAL */}
      {inspectingAccount && (
        <div className="fixed inset-0 bg-slate-900/85 z-[99999] flex justify-center items-center backdrop-blur-md p-4" onClick={() => setInspectingAccount(null)}>
          <div className="bg-slate-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-300 gap-4">
              <div>
                <h2 className="m-0 text-slate-900 flex items-center gap-2 text-xl md:text-2xl font-bold">
                  <BarChart2 className="text-blue-600" size={28} /> PERFORMANCE ENGINE: {inspectingAccount.name}
                </h2>
              </div>
              <button onClick={() => setInspectingAccount(null)} className="bg-white border border-slate-300 rounded-lg p-2 cursor-pointer text-slate-500 flex items-center gap-1 font-bold hover:bg-slate-100">
                <X size={18} /> Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}