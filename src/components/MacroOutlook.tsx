import React, { useState, useEffect } from "react";
import { 
  Save, Globe2, Landmark, TrendingUp, Layers, 
  Wand2, RefreshCw, Loader2, Target 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function MacroOutlook() {
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE QUẢN LÝ VĨ MÔ ---
  const [regime, setRegime] = useState({
    risk: 'Risk-On', liquidity: 'Neutral', volatility: 'Normal', phase: 'Slowdown'
  });

  const [banks, setBanks] = useState([
    { id: 'FED', stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    { id: 'ECB', stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    { id: 'BOJ', stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    { id: 'BOE', stance: 'Hold', tone: 'Neutral', gap: 'Aligned' }
  ]);

  // --- SCOREBOARD TIỀN TỆ (-5 đến +5) ---
  const [scores, setScores] = useState<Record<string, number>>({
    USD: -3, EUR: 2, GBP: 0, JPY: 0, AUD: 0, NZD: 0, CAD: 0, CHF: 0, BTC: 0
  });

  const [narrative, setNarrative] = useState("");

  // TÍNH TOÁN MA TRẬN TỰ ĐỘNG
  const matrixPairs = [
    { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
    { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
    { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
    { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
    { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
    { pair: 'BITCOIN', base: 'BTC', quote: 'USD' } // Coi USD là quote cho Crypto
  ];

  const handleScoreChange = (currency: string, val: number) => {
    setScores(prev => ({ ...prev, [currency]: val }));
  };

  const handleBankChange = (id: string, field: string, val: string) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Đã đồng bộ tầm nhìn Vĩ mô lên Server!", { style: { fontWeight: 'bold' }});
    }, 800);
  };

  const handleAutoPlan = () => {
    toast("Đang gọi AI phân tích Matrix...", { icon: '🤖' });
    setTimeout(() => {
      setNarrative("Dòng tiền đang rút khỏi USD chuyển sang tài sản rủi ro (Risk-On). ECB giữ nguyên lãi suất nhưng tone giọng Hawkish hỗ trợ EUR. Setup chủ đạo tuần này: CANH MUA EUR/USD và BÁN USD/JPY tại các vùng thanh khoản quan trọng.");
      toast.success("AI đã viết xong kịch bản!");
    }, 1500);
  };

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-4 overflow-y-auto bg-slate-50 pb-20">
      <Toaster position="top-right" />

      {/* HEADER RỰC RỠ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Globe2 size={24} className="text-indigo-600" />
            <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Weekly Outlook</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Institutional Regime & Matrix</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                <RefreshCw size={14} /> Reset
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                Save Analysis
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* CỘT TRÁI: VĨ MÔ & NGÂN HÀNG TRUNG ƯƠNG */}
        <div className="flex flex-col gap-4">
            
            {/* 1. Global Regime */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-indigo-500">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Globe2 size={16} className="text-indigo-500"/> 1. Global Regime & Macro</h3>
                
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Market Driver (Risk Sentiment)</label>
                    <select 
                        value={regime.risk} 
                        onChange={e => setRegime({...regime, risk: e.target.value})}
                        className={`w-full p-2.5 rounded-lg border font-black text-center uppercase outline-none cursor-pointer text-sm
                            ${regime.risk === 'Risk-On' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                              regime.risk === 'Risk-Off' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                              'bg-amber-50 border-amber-200 text-amber-700'}`}
                    >
                        <option value="Risk-On">Risk-On (Tài sản rủi ro bay)</option>
                        <option value="Risk-Off">Risk-Off (Trú ẩn an toàn)</option>
                        <option value="Mixed">Mixed (Phân hóa)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Liquidity</label>
                        <select value={regime.liquidity} onChange={e => setRegime({...regime, liquidity: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-bold text-slate-700">
                            <option value="Tightening">Tightening</option><option value="Neutral">Neutral</option><option value="Easing">Easing</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Macro Phase</label>
                        <select value={regime.phase} onChange={e => setRegime({...regime, phase: e.target.value})} className="w-full p-2 bg-rose-50 border border-rose-200 rounded outline-none text-xs font-bold text-rose-700">
                            <option value="Expansion">Expansion</option><option value="Slowdown">Slowdown</option><option value="Recession">Recession</option><option value="Recovery">Recovery</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Central Bank Landscape */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-cyan-500">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Landmark size={16} className="text-cyan-500"/> 2. Central Bank Landscape</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pb-2 text-[10px] font-black text-slate-400 uppercase">Bank</th>
                                <th className="pb-2 text-[10px] font-black text-slate-400 uppercase">Stance</th>
                                <th className="pb-2 text-[10px] font-black text-slate-400 uppercase">Tone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {banks.map(bank => (
                                <tr key={bank.id}>
                                    <td className="py-2 font-black text-slate-800 text-sm">{bank.id}</td>
                                    <td className="py-2 pr-2">
                                        <select value={bank.stance} onChange={e => handleBankChange(bank.id, 'stance', e.target.value)} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-bold text-slate-700">
                                            <option value="Tightening">Tightening</option><option value="Hold">Hold</option><option value="Easing">Easing</option>
                                        </select>
                                    </td>
                                    <td className="py-2">
                                        <select value={bank.tone} onChange={e => handleBankChange(bank.id, 'tone', e.target.value)} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded outline-none text-xs font-bold text-slate-700">
                                            <option value="Hawkish">Hawkish</option><option value="Neutral">Neutral</option><option value="Dovish">Dovish</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* CỘT PHẢI: SCOREBOARD & MATRIX */}
        <div className="flex flex-col gap-4">
            
            {/* 3. Currency Scoreboard */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-amber-500">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-amber-500"/> 3. Currency Scoreboard (-5 to +5)</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {Object.keys(scores).map(currency => (
                        <div key={currency} className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700 w-8">{currency}</span>
                            <input 
                                type="range" min="-5" max="5" 
                                value={scores[currency]} 
                                onChange={(e) => handleScoreChange(currency, parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className={`text-xs font-black w-4 text-right ${scores[currency] > 0 ? 'text-emerald-600' : scores[currency] < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {scores[currency] > 0 ? `+${scores[currency]}` : scores[currency]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. The Matrix Results */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-emerald-500 flex-1 flex flex-col">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Target size={16} className="text-emerald-500"/> 4. The Action Matrix</h3>
                
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-2 mb-4">
                    {matrixPairs.map((item, idx) => {
                        const score = scores[item.base] - scores[item.quote];
                        const bias = score >= 3 ? 'BUY' : score <= -3 ? 'SELL' : 'NEUTRAL';
                        return (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0 px-2">
                                <span className="text-sm font-black text-slate-800">{item.pair}</span>
                                <span className={`text-xs font-black w-8 text-center ${score > 0 ? 'text-emerald-600' : score < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {score > 0 ? `+${score}` : score}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-1 rounded w-16 text-center uppercase tracking-widest
                                    ${bias === 'BUY' ? 'bg-emerald-100 text-emerald-700' : bias === 'SELL' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {bias}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* AI Auto-Writer */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Weekly Narrative</span>
                        <button onClick={handleAutoPlan} className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-black uppercase flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                            <Wand2 size={12}/> Auto-Draft
                        </button>
                    </div>
                    <textarea 
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder="Phân tích Vĩ mô và kịch bản giao dịch tuần này..."
                        className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none leading-relaxed"
                    />
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}