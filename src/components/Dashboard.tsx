import React, { useState, useEffect } from "react";
import { 
    RefreshCw, Zap, Shield, Activity, Target, Loader2, Play, Square, Code2, Terminal, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const CORE_NODES = {
    BALANCED: { id: 1, name: "Balanced", color: "#3b82f6", icon: <Activity size={16} /> },
    AGGRESSIVE: { id: 2, name: "Aggressive", color: "#ef4444", icon: <Zap size={16} /> },
    CONSERVATIVE: { id: 3, name: "Conservative", color: "#22c55e", icon: <Shield size={16} /> }
};

type NodeKey = keyof typeof CORE_NODES;

const pythonCodeSnippet = `class BehavioralRiskEngine:
    """
    Central Risk Engine: Rút củi dưới đáy nồi.
    Trị dứt điểm căn bệnh hưng phấn và trả thù thị trường.
    """
    def __init__(self, account_id):
        self.base_risk_limit = 0.02 # Max 2% rủi ro/lệnh chuẩn

    def calculate_oci(self, win_rate, avg_size, trade_freq):
        """Tính toán Overconfidence Index (OCI)"""
        oci = (win_rate * 1.5) * avg_size * trade_freq
        return round(oci, 2)

    def adaptive_risk_dampening(self, current_streak, win_rate, oci):
        """Cơ chế tự động bóp nghẹt rủi ro (Self-Correcting)"""
        allowed_risk = self.base_risk_limit

        if current_streak >= 3 and oci > 0.6:
            allowed_risk *= 0.8 
            return allowed_risk, "RESTRICTED: Detected Euphoria"

        elif current_streak >= 5 and oci > 0.8:
            allowed_risk *= 0.5 
            return allowed_risk, "HALTED: Clamped 50% size"
            
        return allowed_risk, "NORMAL"`;

const showcaseTrades = [
    { id: 1, date: "2020-03-12", event: "MACRO BREACH", desc: "Phớt lờ VIX bùng nổ. Cố chấp nhồi lệnh BUY GBP/USD ngược sóng.", status: "-$12,500", isLoss: true },
    { id: 2, date: "2020-03-11", event: "OCI VIOLATION", desc: "Hưng phấn sau chuỗi thắng. Tăng đòn bẩy gấp 3 lần hạn mức cho phép.", status: "-$8,200", isLoss: true },
    { id: 3, date: "2020-03-11", event: "DRAWDOWN LIMIT", desc: "Chạm ngưỡng cắt lỗ ngày 1.5%. Central Engine cưỡng chế đóng lệnh.", status: "-$5,400", isLoss: true },
    { id: 4, date: "2020-03-10", event: "ALPHA NODE", desc: "Vào lệnh EUR/USD chuẩn mô hình thanh khoản. Risk/Reward 1:3.", status: "+$15,300", isLoss: false },
    { id: 5, date: "2020-03-09", event: "MEAN REVERSION", desc: "Khai thác điểm cạn kiệt thanh khoản (Liquidity Sweep) trên USD/JPY.", status: "+$11,200", isLoss: false },
    { id: 6, date: "2020-03-09", event: "TREND RIDE", desc: "Xác nhận xu hướng Vàng (XAU/USD). Nhồi lệnh thuận trend an toàn.", status: "+$9,800", isLoss: false }
];

const FALLBACK_FRAMES = [
    {
        performanceData: [ {day: "Mon", equity: 350000}, {day: "Tue", equity: 365000} ],
        enforcementHub: {systemLocks: 0, macroViolations: 0, accountMode: "NORMAL"},
        diagnostics: {oci: 0.45, winRate: 72, state: "STABLE"},
        aum: 365000
    },
    {
        performanceData: [ {day: "Mon", equity: 350000}, {day: "Tue", equity: 365000}, {day: "Wed", equity: 395000} ],
        enforcementHub: {systemLocks: 1, macroViolations: 0, accountMode: "WATCHLIST"},
        diagnostics: {oci: 0.88, winRate: 85, state: "EUPHORIC - HOT"},
        aum: 395000
    },
    {
        performanceData: [ {day: "Mon", equity: 350000}, {day: "Tue", equity: 365000}, {day: "Wed", equity: 395000}, {day: "Thu", equity: 372000} ],
        enforcementHub: {systemLocks: 12, macroViolations: 2, accountMode: "REDUCED_SIZE"},
        diagnostics: {oci: 0.95, winRate: 68, state: "CLAMPED"},
        aum: 372000
    },
    {
        performanceData: [ {day: "Mon", equity: 350000}, {day: "Tue", equity: 365000}, {day: "Wed", equity: 395000}, {day: "Thu", equity: 372000}, {day: "Fri", equity: 371500} ],
        enforcementHub: {systemLocks: 28, macroViolations: 5, accountMode: "HALTED"},
        diagnostics: {oci: 0.30, winRate: 65, state: "LOCKED"},
        aum: 371500
    }
];

export default function Dashboard() {
    const [selectedNodeKey, setSelectedNodeKey] = useState<NodeKey>("AGGRESSIVE");
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

    const fetchDashboardData = async (step: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/v1/dashboard/?step=${step}`);
            if (!response.ok) throw new Error("Django Offline");
            
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            setData(FALLBACK_FRAMES[step]);
        } finally {
            setIsLoading(false);
            if (step === 0) toast.success("Hệ thống ổn định.", {id: 'sim', style: { fontSize: '11px' }});
            if (step === 1) toast("Phát hiện hưng phấn.", { icon: '⚠️', id: 'sim', style: { fontSize: '11px' } });
            if (step === 2) toast.error("FLASH CRASH DETECTED!", {id: 'sim', style: { fontSize: '11px' }});
            if (step === 3) toast("Đã đóng băng danh mục.", { icon: '🛡️', id: 'sim', style: { fontSize: '11px' } });
        }
    };

    useEffect(() => {
        fetchDashboardData(currentStep);
    }, [currentStep]);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev >= 3) {
                        setIsPlaying(false);
                        return 3;
                    }
                    return prev + 1;
                });
            }, 3500); 
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const resetSimulation = () => {
        setIsPlaying(false);
        setCurrentStep(0);
    };

    if (isLoading && !data) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    const currentAUM = data?.aum || 0;

    return (
        /* VỎ NGOÀI: CHỈ LO CUỘN. KHÔNG DÙNG FLEX ĐỂ TRÁNH KẸT */
        <div className="w-full h-full overflow-y-auto bg-slate-50 text-slate-900 font-sans antialiased relative">
            
            {/* LÕI TRONG: LO ĐẨY NỘI DUNG VÀ PADDING NHỎ */}
            <div className="flex flex-col gap-1.5 md:gap-2 p-1.5 md:p-2 pb-24">
                
                <Toaster position="top-right" />
                
                {/* 1. THANH ĐIỀU KHIỂN PLAY/PAUSE */}
                <div className="bg-white rounded-xl p-1.5 md:p-2 flex items-center justify-between shadow-sm border-2 border-blue-100">
                    <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)} 
                            disabled={currentStep >= 3 && !isPlaying}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black tracking-widest uppercase transition-colors shadow-sm ${isPlaying ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'}`}
                        >
                            {isPlaying ? <Square size={12}/> : <Play size={12}/>}
                            {isPlaying ? 'PAUSE' : 'SIMULATE MAR-2020'}
                        </button>
                        <button onClick={resetSimulation} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                            <RefreshCw size={14} />
                        </button>
                        <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest hidden md:flex items-center border-l border-slate-200 pl-2 h-full">
                            Status: <span className={`ml-1 ${isPlaying ? 'text-rose-500 font-black animate-pulse' : 'text-blue-600 font-black'}`}>{isPlaying ? 'LIVE STRESS TEST' : 'STANDBY'}</span>
                        </div>
                        
                        <button 
                            onClick={() => setIsTerminalOpen(true)}
                            className="ml-auto md:ml-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black tracking-widest uppercase hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm active:scale-95">
                            <Code2 size={12} />
                            View Algorithm
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-1 ml-2 mr-2">
                        {[0, 1, 2, 3].map((step) => (
                            <div key={step} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step <= currentStep ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                        ))}
                    </div>
                </div>
                
                {/* 2. HEADER */}
                <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 md:p-2.5 flex flex-col md:flex-row justify-between items-center md:items-center gap-2 transition-all">
                    <div className="flex items-center gap-2">
                        <Target size={24} color={CORE_NODES[selectedNodeKey].color} />
                        <div className="text-center md:text-left">
                            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase leading-none">AUM Terminal</h1>
                            <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">Live Diagnostic Interface</p>
                        </div>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <select 
                            value={selectedNodeKey} 
                            onChange={(e) => setSelectedNodeKey(e.target.value as NodeKey)}
                            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 text-slate-800 text-[10px] md:text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                        >
                            {Object.keys(CORE_NODES).map(key => (
                                <option key={key} value={key}>{CORE_NODES[key as NodeKey].name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* 3. KHU VỰC THÔNG SỐ */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-1.5 md:gap-2">
                    <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border p-3 flex flex-col transition-all duration-500 ${currentStep >= 2 ? 'border-rose-400' : 'border-slate-200'}`}>
                        <h3 className="text-[9px] font-black text-slate-400 mb-1 tracking-widest uppercase">Institutional Equity Curve</h3>
                        <div className="h-40 md:h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.performanceData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" fontSize={9} fontWeight={800} axisLine={false} tickLine={false} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px' }} />
                                    <Area type="monotone" dataKey="equity" stroke={currentStep >= 2 ? "#ef4444" : "#3b82f6"} fillOpacity={0.1} fill={currentStep >= 2 ? "#ef4444" : "#3b82f6"} strokeWidth={2.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-1">
                            <div className={`text-2xl md:text-3xl font-black leading-tight transition-colors ${currentStep >= 2 ? 'text-rose-600' : 'text-slate-900'}`}>${currentAUM.toLocaleString()}</div>
                            <div className="text-[8px] md:text-[9px] font-bold text-slate-400 tracking-widest uppercase">Current Liquidation Value</div>
                        </div>
                    </div>

                    <div className={`bg-white rounded-xl shadow-sm border p-3 flex flex-col transition-all duration-500 ${data.enforcementHub.systemLocks > 0 ? 'border-amber-400' : 'border-slate-200'}`}>
                        <h3 className="text-[9px] font-black text-slate-400 mb-2 tracking-widest uppercase">Risk Enforcement</h3>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                            <div className="bg-slate-50 border border-slate-100 border-l-4 border-l-rose-500 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-700 uppercase">System Locks</span>
                                <span className="text-xs font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">{data.enforcementHub.systemLocks} Event</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 border-l-4 border-l-rose-600 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-rose-800 uppercase">Macro Breach</span>
                                <span className="text-xs font-black text-rose-700 bg-white/60 px-1.5 py-0.5 rounded">{data.enforcementHub.macroViolations} Trigger</span>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 border-l-4 border-l-amber-500 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-amber-900 uppercase">Account Mode</span>
                                <span className="text-[10px] md:text-xs font-black text-amber-600 uppercase">{data.enforcementHub.accountMode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none transition-colors ${currentStep >= 1 ? 'bg-rose-100' : 'bg-blue-50'}`}></div>
                        <h3 className="text-[9px] font-black text-blue-600 mb-2 tracking-widest uppercase relative z-10">Diagnostics Ver 1.0</h3>
                        <div className="flex-1 flex flex-col justify-between relative z-10 gap-1.5">
                            <div className="border-b border-slate-100 pb-1.5">
                                <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Overconfidence (OCI)</div>
                                <div className={`text-2xl font-black leading-none transition-colors ${data.diagnostics.oci > 0.8 ? 'text-rose-600' : 'text-blue-900'}`}>{data.diagnostics.oci} {data.diagnostics.oci > 0.8 && '🔥'}</div>
                            </div>
                            <div className="border-b border-slate-100 pb-1.5">
                                <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Win Rate</div>
                                <div className={`text-2xl font-black leading-none transition-colors ${currentStep >= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>{data.diagnostics.winRate}%</div>
                            </div>
                            <div className="pt-0.5">
                                <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">State</div>
                                <div className={`text-base font-black leading-none transition-colors ${currentStep >= 2 ? 'text-rose-700' : 'text-slate-700'}`}>{data.diagnostics.state}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. AUDIT TRAIL */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center">
                        <span className="font-black text-[10px] text-slate-700 tracking-widest uppercase">Live Audit Trail</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="p-2 pl-3 text-[9px] font-black text-slate-400 tracking-widest uppercase">DATE</th>
                                    <th className="p-2 text-[9px] font-black text-slate-400 tracking-widest uppercase">EVENT</th>
                                    <th className="p-2 text-[9px] font-black text-slate-400 tracking-widest uppercase">DESCRIPTION</th>
                                    <th className="p-2 pr-3 text-[9px] font-black text-slate-400 tracking-widest uppercase text-right">PNL OUTCOME</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {showcaseTrades.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2 pl-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">{log.date}</td>
                                        <td className="p-2">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase ${log.isLoss ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {log.event}
                                            </span>
                                        </td>
                                        <td className="p-2 text-[10px] font-medium italic text-slate-600 leading-tight">{log.desc}</td>
                                        <td className="p-2 pr-3 text-right whitespace-nowrap">
                                            <span className={`text-xs font-black tracking-tight ${log.isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* MODAL CODE PYTHON GIỮ NGUYÊN */}
            {isTerminalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 animate-fade-in" onClick={() => setIsTerminalOpen(false)}>
                    <div className="bg-[#1e1e1e] rounded-xl w-full max-w-3xl shadow-2xl border-t-8 border-slate-700 overflow-hidden font-mono text-xs text-[#d4d4d4] animate-slide-in-bottom flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-3 bg-[#252526] border-b border-[#333333]">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-slate-500" />
                                <span className="text-slate-300 font-bold tracking-wider text-[10px]">finance_dashboard / risk_engine.py</span>
                            </div>
                            <button onClick={() => setIsTerminalOpen(false)} className="text-slate-500 hover:text-white active:scale-95 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4 md:space-y-6">
                            <p className="text-emerald-400 bg-emerald-950/50 p-3 md:p-4 rounded-lg border border-emerald-900 font-bold italic text-xs md:text-sm leading-relaxed">
                                "Trade cá nhân từng giết chết tài khoản của tôi vì sự hưng phấn sau chuỗi thắng (Winning Euphoria). Tôi nhận ra con người không thể thắng nổi lòng tham khi OCI bùng nổ. Đoạn code này là xiềng xích tôi tự đeo vào chân mình: Nó tự động giảm khối lượng vị thế 50% khi 'cảm xúc' chạm ngưỡng đỏ. Tôi dùng toán học để tước đoạt quyền năng của cảm xúc."
                            </p>
                            
                            <pre className="text-[10px] md:text-xs leading-loose whitespace-pre-wrap md:whitespace-pre">
                                <code className="text-[#ce9178]">
                                    {pythonCodeSnippet}
                                </code>
                            </pre>
                        </div>

                        <div className="p-2 bg-[#007acc] text-white flex justify-between items-center px-4 md:px-6 text-[9px] font-black tracking-widest uppercase">
                            <span>MK QUANT CORE v1.0 // MODE: PROTECT</span>
                            <span>Ln 1, Col 1</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}