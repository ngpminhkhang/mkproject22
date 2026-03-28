import React, { useState, useEffect } from "react";
import { 
    RefreshCw, Zap, Shield, Activity, Target, ChevronLeft, ChevronRight, 
    ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// Định nghĩa khung xương (Interface) để TypeScript khỏi sủa bậy
interface DashboardData {
    performanceData: { day: string, equity: number }[];
    enforcementHub: { systemLocks: number, macroViolations: number, accountMode: string };
    diagnostics: { oci: number, winRate: number, state: string };
    auditTrail: { id: number, date: string, event: string, desc: string, status: string }[];
}

const CORE_NODES = {
    BALANCED: { id: 1, name: "Balanced", color: "#3b82f6", icon: <Activity size={16} /> },
    AGGRESSIVE: { id: 2, name: "Aggressive", color: "#ef4444", icon: <Zap size={16} /> },
    CONSERVATIVE: { id: 3, name: "Conservative", color: "#22c55e", icon: <Shield size={16} /> }
};

type NodeKey = keyof typeof CORE_NODES;

export default function Dashboard() {
    const [selectedNodeKey, setSelectedNodeKey] = useState<NodeKey>("AGGRESSIVE");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showModal, setShowModal] = useState<string | null>(null);

    // STATE HÚT MÁU TỪ API
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // HÀM KÍCH HOẠT ĐỘNG CƠ (FETCH API)
    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Đổi port 8000 nếu Django của sếp chạy port khác
            const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/');
            if (!response.ok) throw new Error("Mất kết nối với lõi Django!");
            
            const result = await response.json();
            setData(result.data);
            toast.success("Đã đồng bộ dữ liệu Alpha Matrix", { icon: '🔥', style: { fontSize: '12px', fontWeight: 'bold' }});
        } catch (error) {
            console.error("Lỗi API:", error);
            toast.error("Radar nhiễu! Vui lòng kiểm tra kết nối Backend.");
        } finally {
            setIsLoading(false);
        }
    };

    // Tự động hút dữ liệu khi sếp mở trang
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // GIAO DIỆN CHỜ (LOADING STATE) - Khè hội đồng lúc đang tải
    if (isLoading || !data) {
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-black tracking-widest text-slate-800 uppercase">Establishing Handshake...</h2>
                <p className="text-xs text-slate-500 font-bold tracking-widest mt-2 uppercase">Syncing MQL5 Alpha Nodes</p>
            </div>
        );
    }

    // TÍNH TOÁN DỮ LIỆU SAU KHI HÚT XONG
    const totalPages = Math.ceil(data.auditTrail.length / itemsPerPage);
    const currentLogs = data.auditTrail.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const currentAUM = data.performanceData[data.performanceData.length - 1]?.equity || 0;

    return (
        <div className="w-full h-full bg-slate-50 text-slate-900 p-0 md:p-1 lg:p-2 font-sans overflow-x-hidden antialiased flex flex-col">
            <Toaster position="top-right" />
            
            {/* 1. HEADER */}
            <header className="bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 md:p-2 mb-1.5 md:mb-2.5 flex flex-col md:flex-row justify-between items-center md:items-center gap-1.5 transition-all">
                <div className="flex items-center gap-2">
                    <Target size={22} color={CORE_NODES[selectedNodeKey].color} className="md:size-[26px]"/>
                    <div className="text-center md:text-left">
                        <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase">AUM Terminal Ver 1.0</h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase -mt-1">Live Diagnostic Interface</p>
                    </div>
                </div>
                
                <div className="flex w-full md:w-auto gap-1.5">
                    <select 
                        value={selectedNodeKey} 
                        onChange={(e) => setSelectedNodeKey(e.target.value as NodeKey)}
                        className="flex-1 md:flex-none bg-slate-50 border border-slate-200 text-slate-800 text-[10px] md:text-xs font-bold rounded-lg px-2 py-1 md:px-3 md:py-1 outline-none cursor-pointer"
                    >
                        {Object.keys(CORE_NODES).map(key => (
                            <option key={key} value={key}>{CORE_NODES[key as NodeKey].name.toUpperCase()}</option>
                        ))}
                    </select>
                    <button onClick={fetchDashboardData} className="bg-slate-100 hover:bg-slate-200 p-1 rounded-lg transition-colors active:scale-95 group">
                        <RefreshCw size={14} className="text-slate-600 md:size-[18px] group-active:animate-spin"/>
                    </button>
                </div>
            </header>

            {/* 2. STRATEGY BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 mb-1.5 md:mb-2.5">
                {Object.entries(CORE_NODES).map(([key, node]) => (
                    <div 
                        key={key} 
                        onClick={() => setSelectedNodeKey(key as NodeKey)} 
                        className={`bg-white rounded-lg border border-slate-200 p-2 md:p-2.5 flex items-center gap-2 md:gap-3.5 cursor-pointer transition-all ${selectedNodeKey === key ? 'shadow-sm border-slate-300' : 'opacity-60 hover:opacity-100 hover:border-slate-300'}`}
                        style={{ borderLeftWidth: '5px', borderLeftColor: node.color }}
                    >
                        <div style={{ color: node.color }}>{node.icon}</div>
                        <span className="text-[11px] md:text-xs font-black text-slate-800 tracking-tight">{node.name} Growth Alpha</span>
                    </div>
                ))}
            </div>

            {/* 3. MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 mb-1.5 md:mb-2.5">
                
                {/* 3.1 Equity Curve */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 md:p-3 flex flex-col">
                    <h3 className="text-[9px] font-black text-slate-400 mb-1 tracking-widest uppercase">Institutional Equity Curve</h3>
                    <div className="h-44 md:h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.performanceData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" fontSize={9} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', padding: '6px' }} />
                                <Area type="monotone" dataKey="equity" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 md:mt-1.5">
                        <div className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">${currentAUM.toLocaleString()}</div>
                        <div className="text-[8px] md:text-[9px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase tracking-tighter">Current Liquidation Value (AUM)</div>
                    </div>
                </div>

                {/* 3.2 Enforcement Hub */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 md:p-3 flex flex-col">
                    <h3 className="text-[9px] font-black text-slate-400 mb-1.5 md:mb-3 tracking-widest uppercase">Risk Enforcement Hub</h3>
                    <div className="flex-1 flex flex-col justify-center gap-2 md:gap-3">
                        <div onClick={() => setShowModal('LOCKS')} className="bg-slate-50 border border-slate-100 border-l-4 border-l-rose-500 rounded p-2 md:p-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors active:scale-95">
                            <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase">System Locks</span>
                            <span className="text-sm font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded tracking-tighter">{data.enforcementHub.systemLocks} Event</span>
                        </div>
                        <div onClick={() => setShowModal('MACRO_A')} className="bg-rose-50 border border-rose-100 border-l-4 border-l-rose-600 rounded p-2 md:p-2.5 flex justify-between items-center cursor-pointer hover:bg-rose-100 transition-colors active:scale-95">
                            <span className="text-[10px] md:text-xs font-bold text-rose-800 uppercase leading-tight">Macro Breach</span>
                            <span className="text-sm font-black text-rose-700 bg-white/60 px-1.5 py-0.5 rounded tracking-tighter">{data.enforcementHub.macroViolations} Trigger</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 border-l-4 border-l-amber-500 rounded p-2 md:p-2.5 flex justify-between items-center">
                            <span className="text-[10px] md:text-xs font-bold text-amber-900 uppercase">Account Mode</span>
                            <span className="text-[11px] md:text-sm font-black text-amber-600 uppercase tracking-tight">{data.enforcementHub.accountMode}</span>
                        </div>
                    </div>
                </div>

                {/* 3.3 Behavioral Diagnostics */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 md:p-3 flex flex-col relative overflow-hidden h-auto">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full blur-2xl -mr-5 -mt-5 pointer-events-none"></div>
                    <h3 className="text-[9px] font-black text-blue-600 mb-2 md:mb-4 tracking-widest uppercase relative z-10">Diagnostics Ver 1.0</h3>
                    <div className="flex-1 flex flex-col justify-between relative z-10 gap-1.5 md:gap-3 pt-1">
                        <div onClick={() => setShowModal('OCI')} className="border-b border-slate-100 pb-1 md:pb-1.5 cursor-pointer hover:opacity-80 transition-opacity active:scale-95">
                            <div className="text-[8px] md:text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5 tracking-tighter">Overconfidence (OCI)</div>
                            <div className="text-2xl font-black text-blue-900 leading-tight">{data.diagnostics.oci} - HOT 🔥</div>
                        </div>
                        <div className="border-b border-slate-100 pb-1 md:pb-1.5">
                            <div className="text-[8px] md:text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5 tracking-tighter">Win Rate</div>
                            <div className="text-2xl font-black text-emerald-500 leading-tight">{data.diagnostics.winRate}%</div>
                        </div>
                        <div className="pt-0.5">
                            <div className="text-[8px] md:text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5 tracking-tighter">State</div>
                            <div className="text-base md:text-lg font-black text-rose-500 leading-snug tracking-tight">{data.diagnostics.state}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. EXECUTION LOGS */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-2 md:p-2.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-1.5 md:gap-3 transition-all">
                    <span className="font-black text-[9px] text-slate-500 tracking-widest uppercase">Live Audit Trail</span>
                    <div className="flex gap-1 items-center">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="bg-white border border-slate-200 p-1 md:p-1.5 rounded text-slate-500 disabled:opacity-50"><ChevronsLeft size={12} className="md:size-[14px]" /></button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="bg-white border border-slate-200 p-1 md:p-1.5 rounded text-slate-500 disabled:opacity-50"><ChevronLeft size={12} className="md:size-[14px]"/></button>
                        <span className="text-[9px] font-black text-slate-600 px-1 md:px-2 tracking-widest"> {currentPage} / {totalPages || 1}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="bg-white border border-slate-200 p-1 md:p-1.5 rounded text-slate-500 disabled:opacity-50"><ChevronRight size={12} className="md:size-[14px]"/></button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="bg-white border border-slate-200 p-1 md:p-1.5 rounded text-slate-500 disabled:opacity-50"><ChevronsRight size={12} className="md:size-[14px]" /></button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-white border-b border-slate-100">
                            <tr>
                                <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 tracking-widest uppercase">DATE</th>
                                <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 tracking-widest uppercase">EVENT</th>
                                <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 tracking-widest uppercase">DESCRIPTION</th>
                                <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 tracking-widest uppercase text-right">OUTCOME</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-2 py-1 md:py-1.5 text-[10px] md:text-xs font-bold text-slate-500 whitespace-nowrap leading-tight">{log.date}</td>
                                    <td className="px-2 py-1 md:py-1.5"><span className="text-[8px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded tracking-wide uppercase">{log.event}</span></td>
                                    <td className="px-2 py-1 md:py-1.5 text-[10px] md:text-xs font-medium italic text-slate-600 leading-snug">{log.desc}</td>
                                    <td className="px-2 py-1 md:py-1.5 text-right whitespace-nowrap">
                                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-[8px] font-black text-rose-800 tracking-widest uppercase">{log.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowModal(null)}>
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl border-t-8 border-rose-500 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-3">
                                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">Diagnostic Detail</h2>
                                <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-900 text-lg font-black transition-colors active:scale-95">✕</button>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic space-y-1.5">
                                {showModal === 'OCI' && <p><strong className="text-slate-950">Overconfidence (OCI):</strong> Mức độ tách biệt tâm lý giữa chuỗi thắng và quản trị rủi ro.</p>}
                                {showModal === 'MACRO_A' && <p><strong className="text-slate-950">Macro Breach:</strong> Vi phạm bộ lọc correlation spreads.</p>}
                                {showModal === 'LOCKS' && <p><strong className="text-slate-950">System Locks:</strong> Tổng số lần Central Risk Engine tự động can thiệp.</p>}
                            </div>
                            <button onClick={() => setShowModal(null)} className="w-full mt-1.5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors shadow-sm active:scale-98">Acknowledge</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}