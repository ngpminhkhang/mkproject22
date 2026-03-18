import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";

interface MissedTradeData {
  id?: number;
  pair: string;
  direction: string;
  setup_type: string;
  entry_price: number;
  sl_price: number;
  tp_price: number;
  missed_date: string;
  reason: string;
  notes: string;
}

export default function MissedTrades() {
  const [list, setList] = useState<MissedTradeData[]>([]);
  const [form, setForm] = useState<MissedTradeData>({
    pair: "", direction: "LONG", setup_type: "", entry_price: 0, sl_price: 0, tp_price: 0,
    missed_date: new Date().toISOString().slice(0, 16), reason: "Hesitation", notes: ""
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MissedTradeData | null>(null);

  const loadList = async () => {
    try {
      const data = await invoke<MissedTradeData[]>("get_missed_trades");
      setList(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadList(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
        const payload = { ...form, entry_price: Number(form.entry_price), sl_price: Number(form.sl_price), tp_price: Number(form.tp_price) };
        await invoke("create_missed_trade", { data: payload });
        alert("📝 Đã ghi nhận bài học!");
        setForm({ ...form, pair: "", notes: "", setup_type: "" });
        loadList();
    } catch (e) { alert("❌ Lỗi: " + e); }
  };

  const openDetail = (item: MissedTradeData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const truncate = (str: string, n: number) => (str.length > n) ? str.slice(0, n - 1) + "..." : str;

  return (
    <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
      
      {/* FORM NHẬP (Giữ nguyên) */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", height: "fit-content" }}>
        <h2 style={{ marginTop: 0, color: "#64748b" }}>🚫 Missed Opportunities</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
                <input style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.pair} onChange={e => setForm({...form, pair: e.target.value.toUpperCase()})} placeholder="Pair (e.g. GBPJPY)" required />
                <select style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.direction} onChange={e => setForm({...form, direction: e.target.value})}>
                    <option value="LONG">Long</option><option value="SHORT">Short</option>
                </select>
            </div>
            <input style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.setup_type} onChange={e => setForm({...form, setup_type: e.target.value})} placeholder="Setup Type (e.g. Breakout)" />
            <div style={{ display: "flex", gap: "10px" }}>
                <input type="number" step="any" style={{ flex:1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.entry_price} onChange={e => setForm({...form, entry_price: Number(e.target.value)})} placeholder="Price" />
                <input type="number" step="any" style={{ flex:1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.tp_price} onChange={e => setForm({...form, tp_price: Number(e.target.value)})} placeholder="TP" />
            </div>
            <select style={{ width: "100%", padding: "8px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "4px" }} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
                <option value="Hesitation">😰 Do dự / Sợ hãi</option>
                <option value="Away">🏃 Ra ngoài / Không ngồi máy</option>
                <option value="Spread">📊 Spread quá cao</option>
                <option value="News">📰 Sợ tin tức (News)</option>
                <option value="Sleep">😴 Ngủ quên</option>
                <option value="Other">Khác</option>
            </select>
            <textarea style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Bài học: Lần sau phải đặt chuông báo..." />
            <button type="submit" style={{ padding: "10px", background: "#64748b", color: "white", border: "none", cursor: "pointer", borderRadius: "5px", fontWeight: "bold" }}>Lưu lại để nhớ</button>
        </form>
      </div>

      {/* DANH SÁCH (CÓ MODAL) */}
      <div>
        <h3 style={{ marginTop: 0 }}>Danh sách tiếc nuối ({list.length})</h3>
        {list.map((item, idx) => (
            <div 
                key={idx} 
                onClick={() => openDetail(item)} // Click mở Modal
                style={{ 
                    background: "white", padding: "15px", borderRadius: "8px", marginBottom: "10px", 
                    borderLeft: "4px solid #94a3b8", cursor: "pointer", transition: "transform 0.1s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.01)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                    <span>{item.pair} ({item.direction})</span>
                    <span style={{ color: "#ef4444", fontSize: "0.9em" }}>{item.reason}</span>
                </div>
                <div style={{ fontSize: "0.9em", color: "#666", marginTop: "5px" }}>
                    {item.missed_date.replace("T", " ")} | Setup: {item.setup_type}
                </div>
                <div style={{ marginTop: "5px", fontStyle: "italic", color: "#475569" }}>
                    " {truncate(item.notes, 50)} "
                </div>
            </div>
        ))}
      </div>

      {/* MODAL CHI TIẾT */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Chi tiết Kèo Bỏ Lỡ">
        {selectedItem && (
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                    <h2 style={{ margin: 0 }}>{selectedItem.pair}</h2>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", background: selectedItem.direction==="LONG"?"#dcfce7":"#fee2e2", color: selectedItem.direction==="LONG"?"#16a34a":"#dc2626", fontWeight: "bold" }}>
                        {selectedItem.direction}
                    </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f1f5f9", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
                    <div><strong>Setup:</strong> {selectedItem.setup_type}</div>
                    <div><strong>Date:</strong> {selectedItem.missed_date.replace("T", " ")}</div>
                    <div><strong>Entry (Plan):</strong> {selectedItem.entry_price}</div>
                    <div><strong>TP (Plan):</strong> {selectedItem.tp_price}</div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <h4 style={{ margin: "0 0 5px 0", color: "#b91c1c" }}>Lý do bỏ lỡ:</h4>
                    <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>{selectedItem.reason}</div>
                </div>

                <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "#334155" }}>📝 Bài học / Ghi chú:</h4>
                    <p style={{ background: "#fff7ed", padding: "15px", borderRadius: "5px", whiteSpace: "pre-wrap", border: "1px dashed #fdba74" }}>
                        {selectedItem.notes}
                    </p>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
}