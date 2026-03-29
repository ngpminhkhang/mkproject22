import React, { useState, useEffect } from "react";
import { 
  Radar, Zap, Clock, Activity, Target, Crosshair, Loader2
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA: Giả lập lũ EA đang bơm tín hiệu ---
const initialSignals = [
  { id: '1', symbol: 'EURUSD', bias: 'BUY', tags: ['ZONE_TOUCH', 'STOCH_OS'], score: 85, alerting: true },
  { id: '2', symbol: 'GBPUSD', bias: 'NEUTRAL', tags: ['WAITING_STRUCTURE'], score: 40, alerting: false },
  { id: '3', symbol: 'USDJPY', bias: 'SELL', tags: ['FIBO_GOLD', 'RSI_DIV'], score: 92, alerting: true },
  { id: '4', symbol: 'XAUUSD', bias: 'BUY', tags: ['LIQUIDITY_SWEEP'], score: 75, alerting: false },
  { id: '5', symbol: 'AUDUSD', bias: 'NEUTRAL', tags: ['CONSOLIDATION'], score: 50, alerting: false },
  { id: '6', symbol: 'USDCAD', bias: 'SELL', tags: ['STOCH_OB'], score: 80, alerting: false },
];

export default function MarketMonitor() {
  const [signals, setSignals] = useState(initialSignals);
  const [isScanning, setIsScanning] = useState(true);

  // Giả lập radar quét liên tục
  useEffect(() => {
    const interval = setInterval(() => {
      // Đảo lộn ngẫu nhiên 1 tí cho nó có cảm giác live
      setSignals(prev => [...prev].map(sig => ({
        ...sig,
        score: sig.alerting ? Math.min(100, sig.score + Math.floor(Math.random() * 5)) : sig.score
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = (symbol: string, bias: string) => {
    toast(`Đã khóa mục tiêu ${symbol} - Đẩy sang Scenario Builder!`, { icon: '🎯', style: { fontWeight: 'bold' }});
  };

  const handleScanToggle = () => {
    setIsScanning(!isScanning);
    if (!isScanning) toast.success("Radar Array Online!");
    else toast("Radar Array Offline", { icon: '🛑' });
  };

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-4 overflow-y-auto bg-slate-50 pb-20">
      <Toaster position="top-right" />

      {/* HEADER RADAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isScanning ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                <Radar size={24} />
            </div>
            <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Market Monitor</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    EA Signal Intercept <Activity size={10} className={isScanning ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
                </p>
            </div>
        </div>
        <button 
            onClick={handleScanToggle}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm
            ${isScanning ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
            {isScanning ? <Clock size={14} /> : <Zap size={14} />} 
            {isScanning ? 'HALT SCAN' : 'START SCAN'}
        </button>
      </div>

      {/* GRID THẺ TÍN HIỆU */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {signals.map((item) => (
          <div key={item.id} className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-4 transition-all duration-300
            ${item.alerting ? (item.bias === 'BUY' ? 'border-emerald-400 shadow-emerald-100' : 'border-rose-400 shadow-rose-100') : 'border-slate-200'}`}>
            
            {/* Thẻ Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-slate-400" />
                    <span className="text-lg font-black text-slate-900">{item.symbol}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest
                        ${item.bias === 'BUY' ? 'bg-emerald-100 text-emerald-700' : item.bias === 'SELL' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.bias}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Score: {item.score}/100</span>
                </div>
            </div>

            {/* Thẻ Tags (Lý do vào lệnh) */}
            <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Crosshair size={10}/> Active Triggers</p>
                <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Nút Execute Bóp Cò */}
            <button 
                onClick={() => handleExecute(item.symbol, item.bias)}
                disabled={!item.alerting}
                className={`w-full py-2.5 rounded-lg text-xs font-black tracking-widest uppercase flex justify-center items-center gap-2 transition-all
                    ${item.alerting 
                        ? (item.bias === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md animate-pulse' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md animate-pulse') 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
                {item.alerting ? <Zap size={14} fill="currentColor" /> : <Clock size={14} />}
                {item.alerting ? `TRADE ${item.bias} NOW` : 'WAITING SIGNAL...'}
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}