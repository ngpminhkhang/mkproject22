import React, { useState } from 'react';
import { GitMerge, Globe2, Activity, ShieldCheck, ArrowDown, Crosshair, CheckCircle2, Zap, Scale, Plus, Trash2, Edit3, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AlphaEngine() {
    // --- STATE QUẢN LÝ HIẾN PHÁP (CRUD) ---
    const [rules, setRules] = useState([
        "Cấu trúc thị trường HTF đồng thuận (Cùng pha vĩ mô).",
        "Giá đã quét thanh khoản (Liquidity Sweep) tại vùng cản.",
        "Tỷ lệ Risk/Reward (R:R) tối thiểu đạt 1:2.",
        "Không có tin tức Đỏ (Tier 1) trong 2 giờ tới.",
        "Khối lượng lệnh không vượt quá hạn mức rủi ro ngày."
    ]);
    
    const [newRule, setNewRule] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState("");

    const handleAddRule = () => {
        if (!newRule.trim()) return;
        setRules([...rules, newRule]);
        setNewRule("");
        toast.success("Đã thêm điều luật mới!", { icon: '⚖️' });
    };

    const handleDeleteRule = (index: number) => {
        const updatedRules = rules.filter((_, i) => i !== index);
        setRules(updatedRules);
        toast("Đã bãi bỏ điều luật.", { icon: '🗑️' });
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
        toast.success("Cập nhật điều luật thành công!");
    };

    const handleSaveConfig = () => {
        toast.success("Đồng bộ Hiến pháp vào Database! Scenario Node đã cập nhật.", { style: { fontWeight: 'black', color: '#059669' } });
    };

    return (
        <div className="w-full h-full bg-slate-50 p-3 md:p-4 overflow-y-auto pb-20 antialiased">
            <Toaster position="top-right" />
            
            {/* HEADER */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5 flex flex-col md:flex-row justify-between items-center gap-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Zap size={28} className="text-blue-600" />
                    <div className="text-center md:text-left">
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">Alpha Node</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Logic & Trade Constitution</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest hidden md:inline">Status: Enforcement Active</span>
                    </div>
                    <button onClick={handleSaveConfig} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all active:scale-95">
                        <Save size={14} /> Master Save
                    </button>
                </div>
            </div>

            {/* SƠ ĐỒ KHỐI (FLOWCHART) */}
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-2 relative">
                
                {/* PHASE 1: VĨ MÔ */}
                <div className="w-full bg-white rounded-xl shadow-sm border-t-4 border-t-indigo-500 border border-slate-200 p-5 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <Globe2 className="text-indigo-500" size={20} />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Phase 1: Macro Regime Filter</h3>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                        Dòng tiền thông minh (Smart Money) điều hướng thị trường. Alpha Node quét thanh khoản toàn cầu để xác định khẩu vị rủi ro (Risk-On / Risk-Off) trước khi cấp phép giao dịch. Chống đánh ngược sóng vĩ mô.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center flex flex-col justify-center items-center">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1.5">Risk-On</span>
                            <span className="text-xs font-bold text-emerald-950">Long Equities / Short USD</span>
                        </div>
                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 text-center flex flex-col justify-center items-center">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1.5">Risk-Off</span>
                            <span className="text-xs font-bold text-rose-950">Long USD / Long Gold</span>
                        </div>
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center flex flex-col justify-center items-center">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1.5">Transition</span>
                            <span className="text-xs font-bold text-amber-950">Reduce Position Sizing</span>
                        </div>
                    </div>
                </div>

                <ArrowDown className="text-slate-300 my-1 md:my-2 animate-bounce" size={24} />

                {/* PHASE 2: KỸ THUẬT */}
                <div className="w-full bg-white rounded-xl shadow-sm border-t-4 border-t-blue-500 border border-slate-200 p-5 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <Crosshair className="text-blue-500" size={20} />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Phase 2: Tactical Liquidity Sieve</h3>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                        Cấu trúc giá chỉ là bề nổi. Lõi thuật toán săn tìm các điểm quét thanh khoản (Liquidity Sweeps) tại các vùng cung cầu cực trị (Extreme Supply/Demand). Tín hiệu nhiễu bị loại bỏ hoàn toàn.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-3 items-start p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                            <Activity className="text-blue-500 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black text-blue-900 uppercase">Trend Continuation</h4>
                                <p className="text-[10px] font-semibold text-blue-800/70 mt-1.5 leading-relaxed">Đồng thuận Higher Timeframe (HTF). Đợi giá kéo ngược (Pullback) về vùng Discount trước khi vào lệnh.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start p-4 bg-purple-50/40 rounded-xl border border-purple-100">
                            <GitMerge className="text-purple-500 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black text-purple-900 uppercase">Mean Reversion</h4>
                                <p className="text-[10px] font-semibold text-purple-800/70 mt-1.5 leading-relaxed">Giao dịch đảo chiều khi quét thanh khoản đỉnh/đáy kết hợp Phân kỳ động lượng (Momentum Divergence).</p>
                            </div>
                        </div>
                    </div>
                </div>

                <ArrowDown className="text-slate-300 my-1 md:my-2 animate-bounce" size={24} />

                {/* PHASE 3: HIẾN PHÁP (CONTROL CENTER CÓ CRUD) */}
                <div className="w-full bg-white rounded-xl shadow-sm border-t-4 border-t-emerald-500 border border-slate-200 p-5 md:p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={20} />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Phase 3: Pre-Trade Constitution</h3>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest border border-emerald-100">Live Sync</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-5">
                        Bộ luật tối cao. Mọi tín hiệu từ Phase 2 phải vượt qua các điều khoản kiểm duyệt này trước khi chuyển sang trạng thái Execution. Edit tại đây, tự động cập nhật bên Scenario Builder.
                    </p>
                    
                    {/* KHU VỰC THÊM RULE */}
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={newRule} 
                            onChange={(e) => setNewRule(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
                            placeholder="Nhập quy tắc giao dịch mới..." 
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium text-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                        />
                        <button onClick={handleAddRule} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-sm transition-all active:scale-95">
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    {/* DANH SÁCH RULE */}
                    <div className="space-y-2.5">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group">
                                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                                
                                {editingIndex === idx ? (
                                    <div className="flex-1 flex gap-2">
                                        <input 
                                            type="text" 
                                            value={editingText} 
                                            onChange={(e) => setEditingText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(idx)}
                                            className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded outline-none text-xs font-bold text-slate-800"
                                        />
                                        <button onClick={() => saveEdit(idx)} className="text-emerald-600 bg-emerald-50 px-2 rounded font-black text-[10px] uppercase border border-emerald-200">Save</button>
                                    </div>
                                ) : (
                                    <span className="flex-1 text-xs font-bold text-slate-700">{rule}</span>
                                )}

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(idx)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDeleteRule(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400">Không có điều luật nào. Lưới lọc đang tắt.</div>
                        )}
                    </div>
                </div>
                
                {/* CONCLUSION BOX */}
                <div className="w-full mt-4 p-5 md:p-6 bg-slate-900 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
                    <div className="flex items-center gap-3 text-center md:text-left">
                        <Scale className="text-amber-400 flex-shrink-0" size={28} />
                        <div>
                            <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Mathematical Edge</h4>
                            <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 italic">Discipline bridges the gap between gambling and investing.</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12}/> Alpha Generated
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}