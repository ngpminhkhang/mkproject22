import React, { useState } from 'react';
import { 
    ShieldAlert, Calculator, Activity, Target, Save, 
    Plus, Trash2, Edit3, CheckCircle2, AlertOctagon, 
    TrendingUp, Ban, Radar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA: GLOBAL EXPOSURE ---
const exposureData = [
    { asset: 'XAU (Gold)', exposure: 28, limit: 30, color: '#f59e0b' },
    { asset: 'EUR', exposure: 15, limit: 30, color: '#3b82f6' },
    { asset: 'JPY', exposure: 32, limit: 30, color: '#ef4444' }, // Vượt rào
    { asset: 'GBP', exposure: 8, limit: 30, color: '#10b981' },
];

export default function RiskEngine() {
    // --- STATE QUẢN LÝ LUẬT RỦI RO (CRUD) ---
    const [rules, setRules] = useState([
        "Max Daily Drawdown: Ngắt kết nối toàn bộ Node nếu lỗ vượt 2.0% AUM.",
        "Global Exposure Limit: Cấm nhồi thêm lệnh nếu một nhóm tài sản chiếm >30% AUM.",
        "Correlation Block: Không vào quá 2 lệnh cùng chiều trên các cặp có độ tương quan > 0.8.",
        "Kelly Cap: Khối lượng tối đa không bao giờ vượt quá 1/4 Kelly Fraction.",
        "Overconfidence (OCI) Trigger: Cắt giảm 50% rủi ro khi chuỗi thắng > 5 lệnh liên tiếp."
    ]);
    
    const [newRule, setNewRule] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState("");

    const handleAddRule = () => {
        if (!newRule.trim()) return;
        setRules([...rules, newRule]);
        setNewRule("");
        toast.success("Đã thêm chốt chặn rủi ro mới!", { icon: '🛡️' });
    };

    const handleDeleteRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
        toast("Đã gỡ bỏ chốt chặn.", { icon: '🗑️' });
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditingText(rules[index]);
    };

    const saveEdit = (index: number) => {
        if (!editingText.trim()) return;
        const updatedRules = [...rules];
        updatedRules[index] = editingText;
        setRules(updatedRules);
        setEditingIndex(null);
        toast.success("Đã cập nhật chốt chặn rủi ro!");
    };

    const handleMasterSave = () => {
        toast.success("Đã khóa cấu hình rủi ro vào CSDL Quỹ. Áp dụng cho toàn bộ 3 Account!", { 
            style: { fontWeight: 'black', color: '#059669' } 
        });
    };

    return (
        <div className="w-full h-full bg-slate-50 p-3 md:p-4 overflow-y-auto pb-20 antialiased">
            <Toaster position="top-right" />
            
            {/* HEADER */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5 flex flex-col md:flex-row justify-between items-center gap-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={28} className="text-rose-600" />
                    <div className="text-center md:text-left">
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">Institutional Risk</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capital Preservation & Global Exposure</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></div>
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest hidden md:inline">Central Engine: ARMED</span>
                    </div>
                    <button onClick={handleMasterSave} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all active:scale-95">
                        <Save size={14} /> Master Save
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto flex flex-col gap-4">
                
                {/* TOÁN HỌC: KELLY & OCI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KELLY CRITERION */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-blue-500">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <Calculator className="text-blue-500" size={20} />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fractional Kelly Sizing</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                            Sử dụng công thức Kelly để tối ưu hóa lợi nhuận dài hạn. Tuy nhiên, Full Kelly có tính biến động quá cao (Drawdown lớn). Hệ thống ép buộc sử dụng <strong>Fractional Kelly</strong> để bảo vệ vốn quỹ.
                        </p>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-center">
                            <span className="text-sm font-black text-slate-800 italic">f* = (bp - q) / b</span>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">b: Win Odds | p: Win Prob | q: Loss Prob</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white border border-slate-200 p-2 rounded-lg text-center opacity-50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Full Kelly</span>
                                <span className="text-xs font-bold text-slate-400">100% f*</span>
                                <span className="text-[8px] block text-rose-500 font-bold mt-1 uppercase">Too Risky</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-center shadow-sm">
                                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block mb-1">Half Kelly</span>
                                <span className="text-xs font-bold text-blue-900">50% f*</span>
                                <span className="text-[8px] block text-blue-600 font-bold mt-1 uppercase">Balanced</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center shadow-sm">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">Quarter Kelly</span>
                                <span className="text-xs font-bold text-emerald-900">25% f*</span>
                                <span className="text-[8px] block text-emerald-600 font-bold mt-1 uppercase">Conservative</span>
                            </div>
                        </div>
                    </div>

                    {/* OVERCONFIDENCE INDEX (OCI) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-purple-500">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <Activity className="text-purple-500" size={20} />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Overconfidence Index (OCI)</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                            Thuật toán độc quyền đo lường trạng thái tâm lý hưng phấn. Khi chuỗi thắng kéo dài, con người có xu hướng đánh lớn hơn. OCI hoạt động như chiếc phanh tự động.
                        </p>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-center">
                            <span className="text-sm font-black text-slate-800 italic">OCI = (WinRate × 1.5) × AvgSize × Frequency</span>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Self-Correcting Algorithm</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                                <span className="text-xs font-bold text-slate-600">OCI &lt; 0.6</span>
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">Normal Operation</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-amber-50 border border-amber-100">
                                <span className="text-xs font-bold text-amber-800">OCI &gt; 0.6</span>
                                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase">Reduce Size 20%</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-rose-50 border border-rose-100">
                                <span className="text-xs font-bold text-rose-800">OCI &gt; 0.8</span>
                                <span className="text-[10px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded uppercase">Halt Execution</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GLOBAL EXPOSURE (30% RULE) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-amber-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-slate-100 pb-3 gap-3">
                        <div className="flex items-center gap-2">
                            <Radar className="text-amber-500" size={20} />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Exposure Radar (30% Rule)</h3>
                        </div>
                        <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-1 rounded uppercase tracking-widest">Cross-Account Sync</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                        Giám sát tổng rủi ro trên cả 3 Account. Lệnh đến trước sẽ được duyệt. Nếu tổng tỷ trọng của một tài sản (ví dụ: Vàng) chạm ngưỡng <strong className="text-rose-600">30% AUM</strong>, mọi lệnh Vàng đến sau từ bất kỳ Account nào đều bị Central Engine chặn đứng lập tức. Tránh cháy tài khoản cục bộ.
                    </p>

                    <div className="h-48 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={exposureData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 40]} hide />
                                <YAxis dataKey="asset" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight={800} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                <ReferenceLine x={30} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '30% HARD LIMIT', fill: '#ef4444', fontSize: 9, fontWeight: 900 }} />
                                <Bar dataKey="exposure" radius={[0, 4, 4, 0]} barSize={20}>
                                    {exposureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.exposure > 30 ? '#ef4444' : entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <AlertOctagon size={16} className="text-rose-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-rose-800">
                            <strong>System Alert:</strong> Lượng phơi nhiễm JPY đang đạt 32%. Central Engine đã tự động <strong className="uppercase">Reject</strong> lệnh BUY USD/JPY từ Account 2 (Balanced).
                        </span>
                    </div>
                </div>

                {/* RISK CONSTITUTION (CRUD CONTROL CENTER) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="text-emerald-500" size={20} />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Risk Management Constitution</h3>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                        Quản lý các chốt chặn (Hard Limits). Mọi thông số thiết lập tại đây là tối cao và ghi đè (override) lên mọi thuật toán của các Node con.
                    </p>
                    
                    {/* KHU VỰC THÊM RULE */}
                    <div className="flex gap-2 mb-5">
                        <input 
                            type="text" 
                            value={newRule} 
                            onChange={(e) => setNewRule(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
                            placeholder="Nhập chốt chặn rủi ro mới (VD: Cấm giao dịch thứ 6)..." 
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium text-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                        />
                        <button onClick={handleAddRule} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-sm transition-all active:scale-95">
                            <Plus size={16} /> Add Rule
                        </button>
                    </div>

                    {/* DANH SÁCH RULE */}
                    <div className="space-y-3">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group">
                                <Ban className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                                
                                {editingIndex === idx ? (
                                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            value={editingText} 
                                            onChange={(e) => setEditingText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(idx)}
                                            className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded outline-none text-xs font-bold text-slate-800"
                                        />
                                        <button onClick={() => saveEdit(idx)} className="text-emerald-600 bg-emerald-50 px-4 py-2 rounded font-black text-[10px] uppercase border border-emerald-200">Save</button>
                                    </div>
                                ) : (
                                    <span className="flex-1 text-xs font-bold text-slate-700 leading-relaxed">{rule}</span>
                                )}

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    <button onClick={() => startEdit(idx)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDeleteRule(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="text-center p-6 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400">Không có chốt chặn nào. Rủi ro hệ thống đang ở mức TỐI ĐA!</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}