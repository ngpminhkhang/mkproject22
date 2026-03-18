import { useState, useEffect } from "react";
import { Target, ListPlus, Tag, FolderTree, Plus, Trash2, Edit3, Save, X, ShieldAlert } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface LibraryItem { id: number; title: string; category: string; configuration: string; }

const CATEGORIES = [
    { id: "SETUP", label: "Entry Models (Setup)", icon: Target, color: "#2563eb", bg: "#eff6ff" },
    { id: "EXIT_STRAT", label: "Exit Strategies", icon: ListPlus, color: "#16a34a", bg: "#f0fdf4" },
    { id: "CONTEXT_TAG", label: "Context Tags", icon: Tag, color: "#d97706", bg: "#fffbeb" },
    { id: "SCENARIO_TYPE", label: "Scenario Types", icon: FolderTree, color: "#9333ea", bg: "#faf5ff" },
    { id: "RISK_MODEL", label: "Risk Profiles (Kelly)", icon: ShieldAlert, color: "#dc2626", bg: "#fef2f2" }
];

export default function Library() {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<LibraryItem> | null>(null);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("https://mk-project19-1.onrender.com/api/library/");
            if (res.ok) setItems(await res.json());
        } catch (e) { toast.error("Network infrastructure compromised!"); }
        setLoading(false);
    };

    useEffect(() => { loadItems(); }, []);

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.category) return toast.error("Missing required parameters!");

        // Anti-stupid JSON Check: Ngăn chặn sếp gõ sai ngoặc kép
        if (editingItem.configuration) {
            try {
                JSON.parse(editingItem.configuration);
            } catch (error) {
                return toast.error("INVALID JSON: Use double quotes (\") for keys and string values.");
            }
        }

        try {
            const res = await fetch("https://mk-project19-1.onrender.com/api/library/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingItem)
            });
            if (res.ok) {
                toast.success("Protocol successfully compiled!");
                setEditingItem(null);
                loadItems();
            } else {
                const errText = await res.text();
                toast.error("SYSTEM FAULT: " + errText.substring(0, 80));
            }
        } catch (e) { toast.error("API Timeout: " + e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Authorize permanent deletion of this protocol?")) return;
        try {
            await fetch("https://mk-project19-1.onrender.com/api/library/", { 
                method: "DELETE", headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ id }) 
            });
            toast.success("Asset purged from database!"); 
            loadItems();
        } catch (e) { toast.error("API execution failed!"); }
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: 900 }}>ALGORITHMIC ARMORY</h2>
                <button onClick={() => setEditingItem({ title: "", category: "SETUP", configuration: "{}" })} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Plus size={18} /> INITIALIZE PROTOCOL
                </button>
            </div>

            {editingItem && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #3b82f6', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#1e40af' }}>{editingItem.id ? "MODIFY PROTOCOL" : "INITIALIZE PROTOCOL"}</h3>
                        <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>PROTOCOL DESIGNATION</label>
                            <input value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} placeholder="e.g., M15 BOS & Sweep" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>ASSET CLASSIFICATION</label>
                            <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}>
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>CORE PAYLOAD (Strict JSON)</label>
                            <textarea value={editingItem.configuration} onChange={e => setEditingItem({ ...editingItem, configuration: e.target.value })} style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontFamily: 'monospace' }} placeholder='{"type": "KELLY_HALF", "max_fraction": 0.25}' />
                        </div>
                    </div>
                    <button onClick={handleSave} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Save size={16}/> COMMIT TO LEDGER</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ background: cat.bg, padding: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <cat.icon size={20} color={cat.color} />
                            <h3 style={{ margin: 0, fontSize: '15px', color: cat.color }}>{cat.label}</h3>
                            <span style={{ marginLeft: 'auto', background: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: cat.color }}>
                                {items.filter(i => i.category === cat.id).length} units
                            </span>
                        </div>
                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {items.filter(i => i.category === cat.id).map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.title}</span>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => setEditingItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}><Edit3 size={16}/></button>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {items.filter(i => i.category === cat.id).length === 0 && <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Sector empty. Awaiting deployment.</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}