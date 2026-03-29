import React, { useState, useEffect } from "react";
import { 
  Target, ShieldCheck, Zap, Calculator, Send, Save, 
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Ban, Lock
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA ---
const MOCK_OUTLOOK = {
  bias: 'BUY',
  narrative: 'Dòng tiền đang rút khỏi USD. Tập trung Canh Mua EUR/USD tại các vùng thanh khoản.'
};

const RISK_PROFILES = [
  { id: 1, title: 'Standard (1.0%)', max_risk: 1.0 },
  { id: 2, title: 'Aggressive (2.0%)', max_risk: 2.0 },
  { id: 3, title: 'Conservative (0.5%)', max_risk: 0.5 },
];

const CONSTITUTION_RULES = [
  "Cấu trúc thị trường HTF đồng thuận (Cùng pha vĩ mô).",
  "Giá đã quét thanh khoản (Liquidity Sweep) tại vùng cản.",
  "Tỷ lệ Risk/Reward (R:R) tối thiểu đạt 1:2.",
  "Không có tin tức Đỏ (Tier 1) trong 2 giờ tới.",
  "Khối lượng lệnh không vượt quá hạn mức rủi ro ngày."
];

export default function ScenarioBuilder() {
  // --- FORM STATE ---
  const [pair, setPair] = useState('EURUSD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [prices, setPrices] = useState({ entry: 1.0850, sl: 1.0820, tp: 1.0940 });
  const [accountBalance, setAccountBalance] = useState(105420);
  const [selectedRisk, setSelectedRisk] = useState(RISK_PROFILES[0]);
  
  // --- CHECKLIST STATE (Hiến pháp) ---
  const [checks, setChecks] = useState<boolean[]>(new Array(CONSTITUTION_RULES.length).fill(false));

  // --- CALCULATIONS ---
  const [rr, setRr] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);
  const [lotSize, setLotSize] = useState(0);

  useEffect(() => {
    const riskPips = Math.abs(prices.entry - prices.sl);
    const rewardPips = Math.abs(prices.tp - prices.entry);
    const calcRr = riskPips > 0 ? (rewardPips / riskPips) : 0;
    
    const allowedRiskMoney = accountBalance * (selectedRisk.max_risk / 100);
    // Giả lập tính Lot (1 lot chuẩn = $10/pip)
    const estLot = riskPips > 0 ? (allowedRiskMoney / (riskPips * 10000)) : 0;

    setRr(calcRr);
    setRiskAmount(allowedRiskMoney);
    setLotSize(estLot);
  }, [prices, accountBalance, selectedRisk]);

  const checklistScore = checks.filter(Boolean).length;
  const isApproved = checklistScore === CONSTITUTION_RULES.length;

  const handleToggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const handleSavePlan = () => {
    toast.success("Đã lưu bản nháp Scenario!", { icon: '💾' });
  };

  const handleExecute = () => {
    if (!isApproved) {
      toast.error("Vi phạm Hiến pháp! Vui lòng hoàn thành Checklist.", { icon: '🛑' });
      return;
    }
    toast.success("Lệnh đã vượt qua Risk Engine & Bắn thẳng vào MQL5!", { style: { fontWeight: 'black', color: '#059669' } });
    setChecks(new Array(CONSTITUTION_RULES.length).fill(false));
  };

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-4 overflow-y-auto bg-slate-50 pb-20 antialiased">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Target size={24} className="text-blue-600" />
            <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Scenario Builder</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Pre-Trade Vetting & Execution Node</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* CỘT 1 & 2: THIẾT LẬP THÔNG SỐ */}
        <div className="xl:col-span-2 flex flex-col gap-4">
            
            {/* 1. Macro Context Overlay */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3 flex items-start gap-3 relative overflow-hidden">
                <ShieldCheck className="text-indigo-500 flex-shrink-0 mt-0.5 relative z-10" size={18} />
                <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Active Macro Bias</h4>
                    <p className="text-xs font-semibold text-indigo-950 italic leading-relaxed">{MOCK_OUTLOOK.narrative}</p>
                </div>
            </div>

            {/* 2. Trade Parameters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <Zap size={14} className="text-blue-500"/> Order Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Asset Pair</label>
                        <input type="text" value={pair} onChange={e => setPair(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-black text-slate-800 uppercase focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Direction</label>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1 border border-slate-200 shadow-inner">
                            <button onClick={() => setDirection('BUY')} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-colors ${direction === 'BUY' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>BUY</button>
                            <button onClick={() => setDirection('SELL')} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-colors ${direction === 'SELL' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>SELL</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entry Price</label>
                        <input type="number" value={prices.entry} onChange={e => setPrices({...prices, entry: parseFloat(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-800" step="0.0001" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-rose-600">Stop Loss</label>
                        <input type="number" value={prices.sl} onChange={e => setPrices({...prices, sl: parseFloat(e.target.value)})} className="w-full p-2.5 bg-rose-50 border border-rose-200 rounded-lg outline-none text-xs font-bold text-rose-700" step="0.0001" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-emerald-600">Take Profit</label>
                        <input type="number" value={prices.tp} onChange={e => setPrices({...prices, tp: parseFloat(e.target.value)})} className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg outline-none text-xs font-bold text-emerald-700" step="0.0001" />
                    </div>
                </div>
            </div>

            {/* --- 3. DYNAMIC RISK MATRIX (ĐÃ TẨY TRẮNG) --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-l-8 border-l-amber-400 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Calculator size={14} className="text-amber-500"/> Dynamic Risk Matrix
                    </h3>
                    <select 
                        value={selectedRisk.id} 
                        onChange={e => setSelectedRisk(RISK_PROFILES.find(r => r.id === parseInt(e.target.value)) || RISK_PROFILES[0])}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none text-slate-700 cursor-pointer shadow-sm hover:bg-slate-100 transition-colors"
                    >
                        {RISK_PROFILES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-between">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Est. R:R Ratio</div>
                        <div className={`text-2xl md:text-3xl font-black transition-colors ${rr >= 2 ? 'text-emerald-600' : 'text-rose-600'}`}>1 : {rr.toFixed(1)}</div>
                        <div className={`text-[8px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${rr >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {rr >= 2 ? 'Approved' : 'Sub-Optimal'}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-between">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Capital at Risk</div>
                        <div className="text-2xl md:text-3xl font-black text-rose-600 leading-none">${riskAmount.toFixed(2)}</div>
                        <p className="text-[9px] font-medium text-slate-500 mt-2">({selectedRisk.max_risk}% of AUM)</p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-between">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Position Sizing</div>
                        <div className="text-2xl md:text-3xl font-black text-blue-600 leading-none">{lotSize.toFixed(2)}</div>
                        <p className="text-[9px] font-black text-blue-900/50 uppercase mt-2 tracking-widest">Standard Lots</p>
                    </div>
                </div>
            </div>
        </div>

        {/* CỘT 3: BỘ HIẾN PHÁP & ACTIONS */}
        <div className="flex flex-col gap-4">
            
            <div className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col transition-all duration-300 ${isApproved ? 'border-emerald-400 shadow-emerald-100' : 'border-slate-200'}`}>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center justify-between mb-4 border-b border-slate-100 pb-2 gap-2">
                    <div className="flex items-center gap-2 flex-shrink-0"><Lock size={14} className="text-slate-500"/> Pre-Trade Vetting</div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black whitespace-nowrap ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        VETTED: {checklistScore}/{CONSTITUTION_RULES.length}
                    </span>
                </h3>

                <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-1">
                    {CONSTITUTION_RULES.map((rule, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleToggleCheck(idx)}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-95
                                ${checks[idx] ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                        >
                            <div className={`mt-0.5 flex-shrink-0 ${checks[idx] ? 'text-emerald-500' : 'text-slate-300'}`}>
                                {checks[idx] ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                            </div>
                            <span className={`text-[11px] md:text-xs font-bold leading-tight ${checks[idx] ? 'text-emerald-950' : 'text-slate-600'}`}>
                                {rule}
                            </span>
                        </div>
                    ))}
                </div>

                {/* HÀNG RÀO NÚT BẤM */}
                <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleSavePlan}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black tracking-widest uppercase flex justify-center items-center gap-2 transition-colors active:scale-95"
                    >
                        <Save size={14} /> Save Draft Scenario
                    </button>

                    <button 
                        onClick={handleExecute}
                        disabled={!isApproved}
                        className={`w-full py-3.5 rounded-xl text-xs font-black tracking-widest uppercase flex justify-center items-center gap-2 transition-all shadow-md active:scale-95
                            ${isApproved 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isApproved ? <Send size={16} /> : <Ban size={16} />} 
                        {isApproved ? 'EXECUTE ALPHA NODE' : 'VETTING INCOMPLETE'}
                    </button>
                    {!isApproved && (
                        <p className="text-center text-[9px] font-bold text-rose-500 uppercase mt-1.5 tracking-tighter">Complete constitution checklist to unlock execution path.</p>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}