import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"; // Cần cái này để hiển thị ảnh local

interface TradeData {
  id?: number; pair: string; direction: string; entry_price: number; sl_price: number; tp_price: number; quantity: number; entry_date: string; notes: string; scenario_id?: number | null;
  image_paths: string[]; // Đổi thành mảng string
  emotion_rating: number;
}

export default function TradeEntry() {
  const [form, setForm] = useState<TradeData>({
    pair: "", direction: "LONG", entry_price: 0, sl_price: 0, tp_price: 0, quantity: 0.1, entry_date: new Date().toISOString().slice(0, 16), notes: "", scenario_id: null,
    image_paths: [], emotion_rating: 5 
  });
  const [openTrades, setOpenTrades] = useState<TradeData[]>([]);
  // ... (Giữ nguyên state closingId, closeForm) ...
  const [closingId, setClosingId] = useState<number | null>(null);
  const [closeForm, setCloseForm] = useState({ exit_price: 0, outcome: "WIN", notes: "", pnl_realized: "", mistake_tag: "" });

  // ... (loadTrades giữ nguyên) ...
  const loadTrades = async () => {
    try {
      const data = await invoke<any[]>("get_open_trades"); // Dùng any tạm vì cấu trúc trả về Rust có thể khác chút
      // Parse image_paths từ JSON string sang mảng
      const parsedData = data.map(d => ({
          ...d,
          image_paths: d.image_paths ? JSON.parse(d.image_paths) : []
      }));
      setOpenTrades(parsedData);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { loadTrades(); }, []);

  // HÀM CHỌN ẢNH (GỌI RUST)
  const handlePickImages = async () => {
      try {
          const paths = await invoke<string[]>("pick_and_copy_images");
          if (paths.length > 0) {
              // Thêm vào danh sách hiện tại (tối đa 3)
              const newImages = [...form.image_paths, ...paths].slice(0, 3);
              setForm({ ...form, image_paths: newImages });
          }
      } catch (e) { alert("Lỗi chọn ảnh: " + e); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
       const payload = { 
           ...form, 
           entry_price: Number(form.entry_price), sl_price: Number(form.sl_price), tp_price: Number(form.tp_price), quantity: Number(form.quantity), emotion_rating: Number(form.emotion_rating),
           image_paths: JSON.stringify(form.image_paths) // Chuyển mảng thành chuỗi JSON để lưu DB
       };
       await invoke("create_trade", { data: payload });
       alert("✅ Đã vào lệnh!");
       setForm({ ...form, pair: "", entry_price: 0, sl_price: 0, tp_price: 0, notes: "", image_paths: [], emotion_rating: 5 });
       loadTrades();
    } catch (e) { alert("❌ Lỗi: " + e); }
  };

  // ... (handleCloseClick, confirmClose giữ nguyên) ...
  const handleCloseClick = (trade: TradeData) => {
    if (!trade.id) return;
    setClosingId(trade.id);
    setCloseForm({ exit_price: trade.tp_price || trade.entry_price, outcome: "WIN", notes: "", pnl_realized: "", mistake_tag: "" });
  };
  const confirmClose = async () => {
    if (!closingId) return;
    try {
        await invoke("close_trade", { 
            data: { trade_id: closingId, exit_price: Number(closeForm.exit_price), outcome: closeForm.outcome, notes: closeForm.notes, pnl_realized: Number(closeForm.pnl_realized), mistake_tag: closeForm.mistake_tag } 
        });
        alert("✅ Đã chốt sổ lệnh #" + closingId);
        setClosingId(null);
        loadTrades();
    } catch (e) { alert("❌ Lỗi: " + e); }
  };

  const inputStyle = { width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "4px", marginTop: "5px" };
  const labelStyle = { fontWeight: "bold", fontSize: "0.9em", color: "#334155" };

  return (
    <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", height: "fit-content" }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>🔫 Vào Lệnh (Multi-Image)</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* ... (Các input Pair, Direction, Entry, SL, TP giữ nguyên) ... */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Pair</label><input style={inputStyle} value={form.pair} onChange={e => setForm({...form, pair: e.target.value.toUpperCase()})} placeholder="VD: EURUSD" required /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Direction</label><select style={inputStyle} value={form.direction} onChange={e => setForm({...form, direction: e.target.value})}><option value="LONG">📈 Buy</option><option value="SHORT">📉 Sell</option></select></div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Entry</label><input type="number" step="any" style={inputStyle} value={form.entry_price} onChange={e => setForm({...form, entry_price: Number(e.target.value)})} required /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Lots</label><input type="number" step="0.01" style={inputStyle} value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} /></div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}><label style={{ ...labelStyle, color: "#ef4444" }}>Stop Loss</label><input type="number" step="any" style={{ ...inputStyle, borderColor: "#ef4444" }} value={form.sl_price} onChange={e => setForm({...form, sl_price: Number(e.target.value)})} required /></div>
            <div style={{ flex: 1 }}><label style={{ ...labelStyle, color: "#10b981" }}>Take Profit</label><input type="number" step="any" style={{ ...inputStyle, borderColor: "#10b981" }} value={form.tp_price} onChange={e => setForm({...form, tp_price: Number(e.target.value)})} /></div>
          </div>
          
          {/* --- PHẦN ẢNH LOCAL --- */}
          <div>
              <label style={labelStyle}>📸 Ảnh Chart ({form.image_paths.length}/3)</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
                  {form.image_paths.map((path, idx) => (
                      <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
                          <img src={convertFileSrc(path)} alt="chart" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", border: "1px solid #ccc" }} />
                          <button type="button" onClick={() => {
                              const newPaths = form.image_paths.filter((_, i) => i !== idx);
                              setForm({...form, image_paths: newPaths});
                          }} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", borderRadius: "50%", width: "20px", height: "20px", border: "none", cursor: "pointer", fontSize: "10px" }}>X</button>
                      </div>
                  ))}
                  {form.image_paths.length < 3 && (
                      <button type="button" onClick={handlePickImages} style={{ width: "80px", height: "80px", border: "2px dashed #cbd5e1", borderRadius: "4px", background: "#f8fafc", cursor: "pointer", color: "#64748b" }}>
                          + Thêm
                      </button>
                  )}
              </div>
          </div>

          <div>
              <label style={labelStyle}>🧠 Tâm Lý ({form.emotion_rating}/10)</label>
              <input type="range" min="1" max="10" value={form.emotion_rating} onChange={e => setForm({...form, emotion_rating: Number(e.target.value)})} style={{ width: "100%" }} />
          </div>

          <button type="submit" style={{ padding: "12px", background: "#0f172a", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>🔥 PLACE TRADE</button>
        </form>
      </div>

      {/* DANH SÁCH LỆNH (Update hiển thị ảnh) */}
      <div>
          <h3 style={{ marginTop: 0 }}>🚀 Lệnh Đang Chạy</h3>
          {/* Modal Đóng Lệnh giữ nguyên... */}
          {closingId && (
              <div style={{ background: "#fff7ed", padding: "15px", border: "2px solid #f97316", marginBottom: "20px", borderRadius: "8px" }}>
                  {/* ... Nội dung modal đóng lệnh (Copy lại từ bài trước nếu mất) ... */}
                  <h4 style={{ margin: "0 0 10px 0" }}>Chốt lệnh #{closingId}</h4>
                  <div style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
                      <input type="number" step="any" placeholder="Giá Exit" value={closeForm.exit_price} onChange={e=>setCloseForm({...closeForm, exit_price:Number(e.target.value)})} style={{flex:1, padding:"5px"}}/>
                      <input type="number" step="any" placeholder="PnL ($)" value={closeForm.pnl_realized} onChange={e=>setCloseForm({...closeForm, pnl_realized:e.target.value})} style={{flex:1, padding:"5px", border:"2px solid green"}}/>
                  </div>
                  <select value={closeForm.outcome} onChange={e=>setCloseForm({...closeForm, outcome:e.target.value})} style={{width:"100%", padding:"5px", marginBottom:"10px"}}><option value="WIN">WIN</option><option value="LOSS">LOSS</option><option value="BE">BE</option></select>
                  <input placeholder="Notes..." value={closeForm.notes} onChange={e=>setCloseForm({...closeForm, notes:e.target.value})} style={{width:"96%", padding:"5px", marginBottom:"10px"}}/>
                  <button onClick={confirmClose} style={{background:"#f97316", color:"white", border:"none", padding:"8px", cursor:"pointer"}}>Xác Nhận</button>
              </div>
          )}

          {openTrades.map((t, idx) => (
              <div key={idx} style={{ padding: "15px", background: "white", marginBottom: "10px", borderRadius: "8px", borderLeft: t.direction === "LONG" ? "5px solid #10b981" : "5px solid #ef4444", position: "relative" }}>
                  <button onClick={() => handleCloseClick(t)} style={{ position: "absolute", top: "15px", right: "15px", background: "#f1f5f9", padding: "5px 10px", border: "1px solid #ccc", borderRadius: "4px" }}>CLOSE ✖</button>
                  <div style={{ fontWeight: "bold" }}>{t.pair} <span style={{ fontSize: "0.8em", color: t.direction==="LONG"?"#10b981":"#ef4444" }}>{t.direction}</span></div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>Entry: {t.entry_price}</div>
                  
                  {/* Hiển thị ảnh nhỏ */}
                  {t.image_paths && t.image_paths.length > 0 && (
                      <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
                          {t.image_paths.map((p, i) => (
                              <img key={i} src={convertFileSrc(p)} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", cursor: "pointer", border: "1px solid #e2e8f0" }} onClick={() => alert("Mở ảnh to chức năng Journal sẽ có!")} />
                          ))}
                      </div>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
}