import React, { useState } from 'react';
import { 
    DatabaseZap, ShieldAlert, CheckCircle2, XCircle, 
    AlertTriangle, Wallet, Activity, Target, ShieldCheck, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA: TRẠNG THÁI 3 ACCOUNT ---
const nodeStats = [
    { 
        id: 'ACC_01', name: 'Aggressive Node', balance: 125400, pnl: '+12.4%', 
        discipline: 72, dd: 4.5, status: 'WARNING', 
        desc: 'Hiệu suất cao nhưng hay vi phạm OCI do hưng phấn.' 
    },
    { 
        id: 'ACC_02', name: 'Balanced Node', balance: 345000, pnl: '+5.4%', 
        discipline: 95, dd: 1.2, status: 'EXCELLENT', 
        desc: 'Tuân thủ kỷ luật tuyệt đối. Tăng trưởng ổn định.' 
    },
    { 
        id: 'ACC_03', name: 'Conservative Node', balance: 850000, pnl: '+2.1%', 
        discipline: 100, dd: 0.5, status: 'OPTIMAL', 
        desc: 'Phòng thủ bê tông. Không có bất kỳ vi phạm nào.' 
    }
];

// --- MOCK DATA: BIỂU ĐỒ KỶ LUẬT ---
const chartData = [
    { name: 'ACC_01', discipline: 72, drawDown: 4.5 },
    { name: 'ACC_02', discipline: 95, drawDown: 1.2 },
    { name: 'ACC_03', discipline: 100, drawDown: 0.5 },
];

// --- MOCK DATA: NHẬT KÝ THANH TRA ---
const auditLogs = [
    { id: 1, date: '2026-03-22 14:30', node: 'ACC_01', type: 'VIOLATION', event: 'Oversize Position', desc: 'Vào lệnh khối lượng gấp đôi mức cho phép của Kelly.', action: 'Cảnh cáo & Giảm đòn bẩy 50%' },
    { id: 2, date: '2026-03-21 09:15', node: 'ACC_02', type: 'COMPLIANCE', event: 'Perfect Execution', desc: 'Setup EUR/USD đạt 5/5 tiêu chí Hiến pháp.', action: 'Ghi nhận tích cực' },
    { id: 3, date: '2026-03-20 20:00', node: 'ACC_01', type: 'SYSTEM_HALT', event: 'OCI Breach', desc: 'Overconfidence Index chạm 0.85 sau chuỗi 5 lệnh thắng.', action: 'Khóa giao dịch 24h' },
    { id: 4, date: '2026-03-19 15:45', node: 'ACC_03', type: 'COMPLIANCE', event: 'Drawdown Protection', desc: 'Tự động đóng vị thế khi TT biến động mạnh.', action: 'Bảo toàn vốn thành công' },
    { id: 5, date: '2026-03-18 10:10', node: 'ACC_01', type: 'VIOLATION', event: 'News Trading', desc: 'Vào lệnh trước thềm tin Non-Farm (Tier 1).', action: 'Hủy lệnh cưỡng chế' },
];

export default function BehavioralAnalytics() {
    const [filter, setFilter] = useState('ALL');

    const filteredLogs = filter === 'ALL' 
        ? auditLogs 
        : auditLogs.filter(log => log.type === filter);

    const handleExport = () => {
        toast.success("Đã xuất báo cáo kiểm toán ra PDF!", { icon: '📄' });
    };

    return (
        <div className="w-full h-full bg-slate-50 p-3 md:p-4 overflow-y-auto pb-20 antialiased">
            <Toaster position="top-right" />
            
            {/* HEADER */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5 flex flex-col md:flex-row justify-between items-center gap-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <DatabaseZap size={28} className="text-slate-700" />
                    <div className="text-center md:text-left">
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">Audit Ledger</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cross-Node Compliance & Supervision</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all active:scale-95">
                        Export Report
                    </button>
                </div>
            </div>

            {/* TỔNG QUAN 3 ACCOUNT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                {nodeStats.map((node) => (
                    <div key={node.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md
                        ${node.status === 'WARNING' ? 'border-t-4 border-t-amber-500' : 
                          node.status === 'EXCELLENT' ? 'border-t-4 border-t-blue-500' : 'border-t-4 border-t-emerald-500'}`}>
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase">{node.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{node.id}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest
                                ${node.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 
                                  node.status === 'EXCELLENT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {node.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">AUM</span>
                                <span className="text-sm font-black text-slate-800">${node.balance.toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Growth</span>
                                <span className="text-sm font-black text-emerald-600">{node.pnl}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discipline Score</span>
                            <span className={`text-lg font-black ${node.discipline < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{node.discipline}/100</span>
                        </div>
                        {/* Thanh tiến trình kỷ luật */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                            <div className={`h-1.5 rounded-full ${node.discipline < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${node.discipline}%` }}></div>
                        </div>

                        <p className="text-xs font-medium text-slate-500 italic">"{node.desc}"</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* BIỂU ĐỒ TƯƠNG QUAN KỶ LUẬT VÀ RỦI RO */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 xl:col-span-1">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Activity size={14} className="text-indigo-500"/> Discipline vs Drawdown
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" orientation="left" stroke="#10b981" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                <Bar yAxisId="left" dataKey="discipline" name="Discipline Score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar yAxisId="right" dataKey="drawDown" name="Max Drawdown (%)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed text-center">
                            Thống kê chứng minh: Điểm Kỷ luật (Discipline) tỷ lệ nghịch tuyệt đối với Mức sụt giảm (Drawdown).
                        </p>
                    </div>
                </div>

                {/* SỔ CÁI THANH TRA (AUDIT TRAIL) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 xl:col-span-2 flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} className="text-slate-500"/> Global Audit Logs
                        </h3>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>All</button>
                            <button onClick={() => setFilter('COMPLIANCE')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'COMPLIANCE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Compliant</button>
                            <button onClick={() => setFilter('VIOLATION')} className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'VIOLATION' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Violations</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto flex-1 p-2">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100">Date</th>
                                    <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100">Node</th>
                                    <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100">Event</th>
                                    <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100">Description</th>
                                    <th className="p-3 text-[10px] font-black text-slate-400 tracking-widest uppercase border-b border-slate-100 text-right">Enforcement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-xs font-bold text-slate-500 whitespace-nowrap">{log.date}</td>
                                        <td className="p-3 text-xs font-black text-slate-800">{log.node}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5">
                                                {log.type === 'VIOLATION' && <XCircle size={14} className="text-rose-500"/>}
                                                {log.type === 'COMPLIANCE' && <CheckCircle2 size={14} className="text-emerald-500"/>}
                                                {log.type === 'SYSTEM_HALT' && <AlertTriangle size={14} className="text-amber-500"/>}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    log.type === 'VIOLATION' ? 'text-rose-600' : 
                                                    log.type === 'COMPLIANCE' ? 'text-emerald-600' : 'text-amber-600'
                                                }`}>{log.event}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-[11px] font-medium text-slate-600 leading-snug max-w-xs">{log.desc}</td>
                                        <td className="p-3 text-right">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                                                log.type === 'COMPLIANCE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                                'bg-rose-50 text-rose-700 border border-rose-100'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLogs.length === 0 && (
                            <div className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                Không tìm thấy dữ liệu.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}