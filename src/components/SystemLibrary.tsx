import { useState, useEffect } from "react";
import { Target, ListPlus, Tag, FolderTree, Plus, Trash2, Edit3, Save, X, ShieldAlert, Settings, Code, CheckSquare } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface LibraryItem { id?: number; title: string; category: string; configuration: string; }

const CATEGORIES = [
    { id: "SETUP", label: "Entry Models (Setup)", icon: Target, color: "#2563eb", bg: "#eff6ff" },
    { id: "EXIT_STRAT", label: "Exit Strategies", icon: ListPlus, color: "#16a34a", bg: "#f0fdf4" },
    { id: "CONTEXT_TAG", label: "Context Tags", icon: Tag, color: "#d97706", bg: "#fffbeb" },
    { id: "SCENARIO_TYPE", label: "Scenario Types", icon: FolderTree, color: "#9333ea", bg: "#faf5ff" },
    { id: "RISK_MODEL", label: "Risk Profiles (Engine)", icon: ShieldAlert, color: "#dc2626", bg: "#fef2f2" }
];

const safeJSONParse = (str: string, fallback: any = {}) => {
    try { const p = JSON.parse(str); return typeof p === 'object' && p !== null ? p : fallback; } 
    catch { return fallback; }
};

export default function SystemLibrary() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // TRẠNG THÁI MODAL
    const [editingItem, setEditingItem] = useState<Partial<LibraryItem> | null>(null);
    const [configData, setConfigData] = useState<any>({});
    const [tempChecklistItem, setTempChecklistItem] = useState("");

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("https://mk-project19-1.onrender.com/api/library/");
            if (res.ok) setItems(await res.json());
        } catch (e) { toast.error("Đứt cáp quang: " + e); }
        setLoading(false);
    };

    useEffect(() => { loadItems(); }, []);

    const openEdit = (item: LibraryItem) => {
        setEditingItem(item);
        setConfigData(safeJSONParse(item.configuration, {}));
    };

    const openNew = (catId: string) => {
        setEditingItem({ category: catId, title: "", configuration: "{}" });
        if (catId === "RISK_MODEL") setConfigData({ type: "PERCENT", value: 1.0 });
        else if (catId === "SETUP") setConfigData({ checklist_items: [] });
        else setConfigData({});
    };

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.category) return toast.error("Tên vũ khí không được để trống!");
        
        const payload = { ...editingItem, configuration: JSON.stringify(configData) };
        const isUpdate = !!payload.id;
        const url = isUpdate ? `https://mk-project19-1.onrender.com/api/library/${payload.id}/update/` : "https://mk-project19-1.onrender.com/api/library/create/";
        
        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (res.ok) { toast.success("Đã đúc khuôn thành công!"); loadItems(); setEditingItem(null); } 
            else { toast.error("Lỗi xưởng đúc!"); }
        } catch (e) { toast.error("Mất kết nối: " + e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Sếp muốn ném vũ khí này vào lò nung?")) return;
        try {
            const res = await fetch(`https://mk-project19-1.onrender.com/api/library/${id}/delete/`, { method: "POST" });
            if (res.ok) { toast.success("Đã tiêu hủy!"); loadItems(); }
        } catch (e) { toast.error("Lỗi: " + e); }
    };

    const addChecklist = () => {
        if (!tempChecklistItem) return;
        const currentList = Array.isArray(configData.checklist_items) ? configData.checklist_items : [];
        setConfigData({ ...configData, checklist_items: [...currentList, tempChecklistItem] });
        setTempChecklistItem("");
    };

    const removeChecklist = (idx: number) => {
        const currentList = Array.isArray(configData.checklist_items) ? configData.checklist_items : [];
        setConfigData({ ...configData, checklist_items: currentList.filter((_, i) => i !== idx) });
    };

    const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', fontWeight: 600, color: '#0f172a', outline: 'none' };

    return (
        <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: '100%' }}>
            <Toaster position="top-right" />
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>SYSTEM LIBRARY</h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: 800 }}>Kho vũ khí & Lõi thuật toán rủi ro</p>
                </div>
            </div>

            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 900 }}>Đang mở kho vũ khí...</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100%' : '300px'}, 1fr))`, gap: '16px' }}>
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const catItems = items.filter(i => i.category === cat.id);
                        return (
                            <div key={cat.id} style={{ background: '#ffffff', borderRadius: '10px', border: `1px solid ${cat.color}40`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                <div style={{ background: cat.bg, padding: '12px 16px', borderBottom: `1px solid ${cat.color}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cat.color, fontWeight: 900, fontSize: '14px' }}>
                                        <Icon size={18} /> {cat.label}
                                    </div>
                                    <button onClick={() => openNew(cat.id)} style={{ background: cat.color, color: 'white', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                                    {catItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{item.title}</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => openEdit(item)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#2563eb' }}><Edit3 size={14}/></button>
                                                <button onClick={() => handleDelete(item.id!)} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {catItems.length === 0 && <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textAlign: 'center', padding: '20px 0' }}>Khoang chứa trống. Chờ nạp đạn.</div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* XƯỞNG ĐÚC KHUÔN (MODAL CẤU HÌNH THÔNG MINH) */}
            {editingItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={18} color="#2563eb" /> {editingItem.id ? "UPDATE MODULE" : "CREATE NEW MODULE"}
                            </h3>
                            <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '70vh' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '6px' }}>TÊN VŨ KHÍ / MODULE</label>
                                <input value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} style={inputStyle} placeholder="Ví dụ: Kelly 2% Risk, Smart Money Concept..." />
                            </div>

                            {/* BỘ ĐIỀU KHIỂN RỦI RO (RISK ENGINE CONFIGURATOR) */}
                            {editingItem.category === "RISK_MODEL" && (
                                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><ShieldAlert size={16} color="#dc2626"/><strong style={{ fontSize: '12px', color: '#991b1b' }}>THÔNG SỐ ĐỘNG CƠ RỦI RO</strong></div>
                                    <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#b91c1c', marginBottom: '4px' }}>CƠ CHẾ TÍNH (ENGINE TYPE)</label>
                                            <select value={configData.type || "PERCENT"} onChange={e => setConfigData({ ...configData, type: e.target.value })} style={{ ...inputStyle, borderColor: '#fca5a5', color: '#991b1b' }}>
                                                <option value="PERCENT">% Ký quỹ (Percent of Equity)</option>
                                                <option value="FIXED">Đô la cố định (Fixed USD)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#b91c1c', marginBottom: '4px' }}>THAM SỐ (VALUE)</label>
                                            <input type="number" step="any" value={configData.value || ""} onChange={e => setConfigData({ ...configData, value: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, borderColor: '#fca5a5', color: '#991b1b' }} placeholder="VD: 1.5 (%) hoặc 200 ($)" />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '12px', fontWeight: 600, fontStyle: 'italic' }}>*Hệ thống Execution Node sẽ đọc công thức này để tự động bóp cò chia Lot.</p>
                                </div>
                            )}

                            {/* BỘ TẠO CHECKLIST CHO SETUP (ENTRY MODEL) */}
                            {editingItem.category === "SETUP" && (
                                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><CheckSquare size={16} color="#2563eb"/><strong style={{ fontSize: '12px', color: '#1e40af' }}>LUẬT VÀO LỆNH (CHECKLIST)</strong></div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <input value={tempChecklistItem} onChange={e => setTempChecklistItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); }} style={{ ...inputStyle, borderColor: '#93c5fd' }} placeholder="Thêm điều kiện..." />
                                        <button onClick={addChecklist} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: 900, cursor: 'pointer' }}>ADD</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {(Array.isArray(configData.checklist_items) ? configData.checklist_items : []).map((item: string, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                                                <span>{idx + 1}. {item}</span>
                                                <button onClick={() => removeChecklist(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 900 }}>X</button>
                                            </div>
                                        ))}
                                        {(!configData.checklist_items || configData.checklist_items.length === 0) && <div style={{ fontSize: '11px', color: '#60a5fa', fontStyle: 'italic' }}>Chưa có điều kiện nào. Tướng sẽ được phép bắn bừa!</div>}
                                    </div>
                                </div>
                            )}

                            {/* HIỂN THỊ RAW JSON CHO CÁC MỤC KHÁC */}
                            {editingItem.category !== "RISK_MODEL" && editingItem.category !== "SETUP" && (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '6px' }}><Code size={14} /> RAW CONFIGURATION (JSON)</label>
                                    <textarea 
                                        value={JSON.stringify(configData, null, 2)} 
                                        onChange={e => { try { setConfigData(JSON.parse(e.target.value)); } catch { /* Ignore until valid JSON */ } }} 
                                        style={{ ...inputStyle, minHeight: '120px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }} 
                                        placeholder="{}"
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleSave} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                                <Save size={16} /> ĐÓNG MỘC & ĐƯA VÀO KHO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}