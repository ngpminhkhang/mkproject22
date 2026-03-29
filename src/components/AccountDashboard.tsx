import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Activity, Target, Zap, 
  Wallet, AlertTriangle, RefreshCw, Loader2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA ---
const mockStats = {
  current_equity: 105420.50, net_pnl: 5420.50, pnl_percent: 5.4, max_drawdown: 2.1,
  profit_factor: 2.4, expectancy: 125.5, win_rate: 68.5, total_trades: 42,
  consecutive_losses: 2, avg_risk_per_trade: 1.2, long_ratio: 55,
  warn_pf: false, warn_dd: false, warn_risk: false
};

const mockCurve = [
  { date: 'Mon', equity: 100000 }, { date: 'Tue', equity: 101200 },
  { date: 'Wed', equity: 100800 }, { date: 'Thu', equity: 103500 },
  { date: 'Fri', equity: 105420 }
];

const mockRecentSetups = [
  { uuid: '1', pair: 'EURUSD', direction: 'BUY', status: 'CLOSED', pnl: 450, volume: 1.5 },
  { uuid: '2', pair: 'GBPUSD', direction: 'SELL', status: 'CLOSED', pnl: -120, volume: 2.0 },
  { uuid: '3', pair: 'XAUUSD', direction: 'BUY', status: 'EXECUTED', pnl: 890, volume: 0.5 },
  { uuid: '4', pair: 'USDJPY', direction: 'SELL', status: 'CLOSED', pnl: 320, volume: 1.0 },
];

const mockSetupPerformance = [
  { name: 'Trend Continuation', trades: 15, win_rate: 75, pnl: 3200 },
  { name: 'Mean Reversion', trades: 12, win_rate: 55, pnl: 850 },
  { name: 'Breakout', trades: 15, win_rate: 65, pnl: 1370 },
];

export default function AccountDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [curve, setCurve] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [perf, setPerf] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNodeData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStats(mockStats);
      setCurve(mockCurve);
      setRecent(mockRecentSetups);
      setPerf(mockSetupPerformance);
      setIsLoading(false);
      toast.success("Đồng bộ dữ liệu Node hoàn tất.", { style: { fontSize: '12px', fontWeight: 'bold' }});
    }, 600);
  };

  useEffect(() => {
    fetchNodeData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-10 min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
        <span className="text-xs font-black text-slate-500 tracking-widest uppercase">Fetching Node Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-3 md:gap-4 overflow-y-auto bg-slate-50">
      <Toaster position="top-right" />
      
      {/* 1. THANH TRẠNG THÁI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Equity</span>
            <Wallet size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">${stats.current_equity.toLocaleString()}</div>
          <div className={`text-xs font-bold mt-1 ${stats.net_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.net_pnl >= 0 ? '+' : ''}{stats.net_pnl.toLocaleString()} ({stats.pnl_percent}%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Win Rate</span>
            <Target size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.win_rate}%</div>
          <div className="text-xs font-bold text-slate-400 mt-1">{stats.total_trades} Trades Total</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profit Factor</span>
            <TrendingUp size={16} className={stats.warn_pf ? 'text-rose-500' : 'text-emerald-500'} />
          </div>
          <div className={`text-2xl font-black ${stats.warn_pf ? 'text-rose-600' : 'text-slate-900'}`}>{stats.profit_factor}</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Exp: ${stats.expectancy}/trade</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Drawdown</span>
            <Activity size={16} className={stats.warn_dd ? 'text-rose-500' : 'text-amber-500'} />
          </div>
          <div className={`text-2xl font-black ${stats.warn_dd ? 'text-rose-600' : 'text-slate-900'}`}>{stats.max_drawdown}%</div>
          <div className="text-xs font-bold text-slate-400 mt-1">Avg Risk: {stats.avg_risk_per_trade}%</div>
        </div>
      </div>

      {/* 2. KHU VỰC BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Equity Curve</h3>
            <button onClick={fetchNodeData} className="text-slate-400 hover:text-blue-600"><RefreshCw size={14}/></button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEq)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Zap size={14}/> Setup Performance</h3>
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Model</th>
                  <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Win</th>
                  <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {perf.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 text-xs font-bold text-slate-700">{s.name} <span className="text-[9px] text-slate-400 font-normal">({s.trades})</span></td>
                    <td className={`py-2 text-xs font-bold text-right ${s.win_rate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>{s.win_rate}%</td>
                    <td className={`py-2 text-xs font-black text-right ${s.pnl >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>${s.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. BẢNG GIAO DỊCH GẦN ĐÂY */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-[200px] flex flex-col">
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-black text-xs text-slate-700 tracking-widest uppercase flex items-center gap-2"><Target size={14}/> Recent Executions</span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase">Asset</th>
                <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase">Bias</th>
                <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase">Size</th>
                <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase text-right">PnL</th>
                <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase text-right pr-4">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map((trade) => (
                <tr key={trade.uuid} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-xs font-black text-slate-800">{trade.pair}</td>
                  <td className="p-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${trade.direction === 'BUY' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-500">{trade.volume} Lot</td>
                  <td className={`p-3 text-xs font-black text-right ${trade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                  </td>
                  <td className="p-3 text-right pr-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${trade.status === 'CLOSED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}