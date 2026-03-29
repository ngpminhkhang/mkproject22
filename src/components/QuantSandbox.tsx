import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, ShieldAlert, BarChart3, Lock, AlertTriangle, 
  Settings2, Activity, Zap, Terminal, XOctagon, RefreshCcw 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- DANH SÁCH 10 KỊCH BẢN LỊCH SỬ ---
const ERAS = [
  "2008 Global Financial Crisis",
  "2010 Flash Crash",
  "2015 SNB Franc Shock",
  "2016 Brexit & US Election",
  "2018 VolMageddon",
  "2020 COVID-19 Liquidity Crisis",
  "2021 Crypto Boom & Bust",
  "2022 Inflation Shock & Rate Hikes",
  "2023 Tech Bull Run",
  "2024 AI Market Euphoria"
];

// --- THUẬT TOÁN HẠT GIỐNG ĐỘC QUYỀN (DETERMINISTIC RNG) ---
// Đảm bảo 100% ra cùng 1 kết quả với cùng 1 bộ thông số
function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  return hash;
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export default function QuantSandbox() {
  const [era, setEra] = useState(ERAS[5]);
  const [node, setNode] = useState('BETA');
  const [riskAlgo, setRiskAlgo] = useState('KELLY');
  const [capital, setCapital] = useState<number>(100000);
  
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [showDenied, setShowDenied] = useState(false);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);

  // Sinh dữ liệu giả lập nhưng KIÊN ĐỊNH (Không random láo)
  const runSimulation = () => {
    setStatus('RUNNING');
    setShowDenied(false);
    setChartData([]);
    setResults(null);

    // Băm các lựa chọn thành một hạt giống duy nhất
    const seedString = `${era}-${node}-${riskAlgo}-${capital}`;
    const seedNumber = hashString(seedString);
    const random = mulberry32(seedNumber);

    // Tính toán chỉ số tổng quan dựa trên hạt giống
    const winRate = 45 + (random() * 35); // 45% - 80%
    const maxDrawdown = 5 + (random() * 25); // 5% - 30%
    const pnlMultiplier = 0.5 + (random() * 4.5); // 0.5x đến 5.0x vốn
    const targetAUM = capital * (1 + pnlMultiplier);

    // Tạo đường cong Equity (100 điểm dữ liệu)
    let currentEquity = capital;
    const newChartData: { step: number, equity: number }[] = [];
    
    // Trend step: mỗi bước tăng/giảm bao nhiêu để đến đích
    const stepSize = (targetAUM - capital) / 100;

    for (let i = 0; i <= 100; i++) {
      // Thêm nhiễu loạn ngẫu nhiên nhưng có kiểm soát
      const noise = (random() - 0.5) * (capital * 0.05); 
      currentEquity = capital + (stepSize * i) + noise;
      // Không để âm vốn
      if (currentEquity < capital * 0.1) currentEquity = capital * 0.1;
      
      newChartData.push({
        step: i,
        equity: Math.round(currentEquity)
      });
    }

    // Hiệu ứng render dần dần (Playback)
    let currentStep = 0;
    const interval = setInterval(() => {
      setChartData(newChartData.slice(0, currentStep + 1));
      currentStep += 2; // Tốc độ x2 cho gay cấn
      
      if (currentStep > 100) {
        clearInterval(interval);
        setChartData(newChartData);
        setResults({
          finalAum: newChartData[100].equity,
          roi: ((newChartData[100].equity - capital) / capital * 100).toFixed(1),
          winRate: winRate.toFixed(1),
          drawdown: maxDrawdown.toFixed(1)
        });
        setStatus('FINISHED');
      }
    }, 50); // Mất khoảng 2.5s để chạy xong
  };

  const handleDeploy = () => {
    setShowDenied(true);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="w-full h-full bg-slate-50 p-3 md:p-4 overflow-y-auto pb-20 antialiased relative">
      
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <Terminal size={28} className="text-slate-800" />
            <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Quant Sandbox</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical Stress-Test Matrix</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* CỘT TRÁI: BUỒNG LÁI (FORM) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <Settings2 size={16} className="text-blue-600"/> Simulation Parameters
            </h3>

            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Historical Era</label>
                <select value={era} onChange={(e)=>setEra(e.target.value)} disabled={status === 'RUNNING'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-800 focus:border-blue-400 focus:ring-1 transition-all">
                    {ERAS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Operational Node</label>
                <select value={node} onChange={(e)=>setNode(e.target.value)} disabled={status === 'RUNNING'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-black text-slate-800 focus:border-blue-400 focus:ring-1 transition-all">
                    <option value="ALPHA">Node Alpha (Vanguard) - 80% Curr / 10% Eq / 10% Cmd</option>
                    <option value="BETA">Node Beta (Aggressive) - 50% Curr / 40% Eq / 10% Cmd</option>
                    <option value="GAMMA">Node Gamma (Fortress) - 10% Curr / 70% Eq / 20% Cmd</option>
                </select>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Risk Algorithm</label>
                <select value={riskAlgo} onChange={(e)=>setRiskAlgo(e.target.value)} disabled={status === 'RUNNING'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-800 focus:border-blue-400 focus:ring-1 transition-all">
                    <option value="KELLY">Fractional Kelly (Dynamic Sizing)</option>
                    <option value="OCI">OCI Cap (Behavioral Constraint)</option>
                    <option value="FIXED">Fixed 2% AUM (Standard)</option>
                </select>
            </div>

            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Initial Capital (USD)</label>
                <input type="number" value={capital} onChange={(e)=>setCapital(Number(e.target.value))} disabled={status === 'RUNNING'} className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg outline-none text-sm font-black text-emerald-800 focus:border-emerald-400 focus:ring-1 transition-all" />
            </div>

            <button 
                onClick={runSimulation}
                disabled={status === 'RUNNING'}
                className="w-full mt-auto py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-md transition-all active:scale-95 disabled:bg-slate-300"
            >
                {status === 'RUNNING' ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                {status === 'RUNNING' ? 'SIMULATING...' : 'RUN SIMULATION'}
            </button>
        </div>

        {/* CỘT PHẢI: RẠP CHIẾU PHIM (CHART & RESULTS) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-blue-500"/> Projected Equity Curve
                    </h3>
                    {status === 'RUNNING' && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase animate-pulse">Processing tick data...</span>}
                </div>

                <div className="flex-1 min-h-[250px] w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden relative">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="equity" stroke="#2563eb" fillOpacity={1} fill="url(#colorEq)" strokeWidth={3} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                            <BarChart3 size={48} strokeWidth={1} />
                            <span className="text-xs font-black uppercase mt-2">Awaiting Parameters</span>
                        </div>
                    )}
                </div>

                {/* TICKER TAPE TÀI SẢN */}
                <div className="mt-4 flex gap-3 overflow-x-hidden p-2 bg-slate-900 rounded-lg">
                    {['EUR/USD', 'GBP/USD', 'EUR/JPY', 'NVDA', 'MSFT', 'BAC', 'XAU'].map((sym, i) => (
                        <div key={sym} className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${i % 2 === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {sym} {i%2===0 ? '▲' : '▼'}
                        </div>
                    ))}
                </div>
            </div>

            {/* BẢNG KẾT QUẢ & NÚT BÓP CÒ */}
            {status === 'FINISHED' && results && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-slide-in-bottom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Final AUM</span>
                            <span className="text-lg font-black text-slate-900">{formatMoney(results.finalAum)}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Net ROI</span>
                            <span className={`text-lg font-black ${Number(results.roi) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{results.roi}%</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Win Rate</span>
                            <span className="text-lg font-black text-blue-600">{results.winRate}%</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Max Drawdown</span>
                            <span className="text-lg font-black text-rose-500">-{results.drawdown}%</span>
                        </div>
                    </div>
                    
                    <button onClick={handleDeploy} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 animate-pulse">
                        <Zap size={18} fill="currentColor" /> ALLOCATE CAPITAL / DEPLOY FUND
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* HONEYPOT MODAL - CÚ TÁT TỪ CHỐI */}
      {showDenied && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowDenied(false)}>
              <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border-t-8 border-rose-600 p-6 text-center animate-slide-in-bottom" onClick={e => e.stopPropagation()}>
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XOctagon size={40} className="text-rose-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">ACCESS DENIED</h2>
                  <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded mb-4">
                      GUEST CLEARANCE DETECTED
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
                      Mô hình Định lượng đã được xác thực thành công. Tuy nhiên, quyền cấp vốn thực tế yêu cầu mã định danh cấp C-Level. Vui lòng liên hệ <strong className="text-slate-900">Chief Risk Officer</strong> để ký quỹ và triển khai hệ thống.
                  </p>
                  <button onClick={() => setShowDenied(false)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                      Acknowledge
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}