import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core"; // Cần cái này để load ảnh local
import Modal from "./Modal";

interface HistoryData {
  id: number;
  pair: string;
  direction: string;
  outcome: string;
  r_multiple: number;
  pnl_realized: number;
  exit_date: string;
  notes?: string;
  image_paths?: string; // Dữ liệu thô là chuỗi JSON (VD: '["C:/..."]')
  emotion_rating?: number;
  mistake_tag?: string;
}

export default function Journal() {
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<HistoryData | null>(null);

  const loadHistory = async () => {
    try {
      const data = await invoke<HistoryData[]>("get_history_list");
      setHistory(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadHistory(); }, []);

  const openDetail = (trade: HistoryData) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  // Hàm tiện ích để parse chuỗi JSON ảnh thành mảng
  const getImages = (jsonStr?: string): string[] => {
      if (!jsonStr) return [];
      try {
          return JSON.parse(jsonStr);
      } catch {
          return [];
      }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, color: "#475569" }}>📔 Trading Journal</h2>
        <button onClick={loadHistory} style={{ padding: "8px 15px", cursor: "pointer", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px" }}>🔄 Refresh</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: "8px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", fontSize: "0.9em", borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ padding: "12px" }}>ID</th>
            <th style={{ padding: "12px" }}>Date</th>
            <th style={{ padding: "12px" }}>Pair</th>
            <th style={{ padding: "12px" }}>Dir</th>
            <th style={{ padding: "12px" }}>Result</th>
            <th style={{ padding: "12px" }}>PnL ($)</th>
            <th style={{ padding: "12px" }}>Tag</th>
            <th style={{ padding: "12px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>Chưa có dữ liệu.</td></tr>
          ) : (
            history.map((h) => (
              <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px", color: "#94a3b8" }}>#{h.id}</td>
                <td style={{ padding: "12px", fontSize: "0.85em" }}>{h.exit_date?.substring(0, 10)}</td>
                <td style={{ padding: "12px", fontWeight: "bold" }}>{h.pair}</td>
                <td style={{ padding: "12px", color: h.direction==="LONG"?"#10b981":"#ef4444", fontWeight:"bold" }}>{h.direction}</td>
                <td style={{ padding: "12px" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8em", color: "white", fontWeight: "bold", background: h.outcome==="WIN"?"#10b981":h.outcome==="LOSS"?"#ef4444":"#94a3b8" }}>{h.outcome}</span>
                </td>
                <td style={{ padding: "12px", fontWeight: "bold", color: h.pnl_realized>0?"#16a34a":"#dc2626" }}>${h.pnl_realized}</td>
                <td style={{ padding: "12px" }}>{h.mistake_tag ? <span style={{background:"#fee2e2", color:"#b91c1c", padding:"2px 6px", borderRadius:"4px", fontSize:"0.8em"}}>{h.mistake_tag}</span> : "-"}</td>
                <td style={{ padding: "12px" }}>
                    <button onClick={() => openDetail(h)} style={{ padding: "5px 10px", background: "transparent", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "0.8em" }}>🔍 Xem</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- MODAL CHI TIẾT --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedTrade ? `Chi tiết lệnh #${selectedTrade.id}` : ""}>
        {selectedTrade && (
            <div>
                {/* 1. Header Stats */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "#f8fafc", padding: "15px", borderRadius: "8px" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "0.8em", color: "#64748b" }}>Cặp tiền</div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>{selectedTrade.pair} <span style={{color: selectedTrade.direction==="LONG"?"green":"red"}}>({selectedTrade.direction})</span></div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "0.8em", color: "#64748b" }}>Kết quả</div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1em", color: selectedTrade.outcome==="WIN"?"green":selectedTrade.outcome==="LOSS"?"red":"gray" }}>{selectedTrade.outcome}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "0.8em", color: "#64748b" }}>PnL</div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1em", color: selectedTrade.pnl_realized>0?"green":"red" }}>${selectedTrade.pnl_realized}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "0.8em", color: "#64748b" }}>Tâm lý</div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>{selectedTrade.emotion_rating || "-"}/10</div>
                    </div>
                </div>

                {/* 2. Ảnh Chart (QUAN TRỌNG) */}
                {getImages(selectedTrade.image_paths).length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#334155" }}>📸 Bằng chứng thép (Chart):</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                            {getImages(selectedTrade.image_paths).map((path, idx) => (
                                <img 
                                    key={idx} 
                                    src={convertFileSrc(path)} 
                                    alt={`chart-${idx}`} 
                                    style={{ width: "100%", borderRadius: "8px", border: "1px solid #e2e8f0" }} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Notes & Mistake */}
                <div>
                    <h4 style={{ margin: "0 0 5px 0", color: "#334155" }}>📝 Nhật ký & Bài học:</h4>
                    {selectedTrade.mistake_tag && (
                        <div style={{ marginBottom: "10px", color: "#b91c1c", fontWeight: "bold" }}>
                            ⚠️ Lỗi vi phạm: {selectedTrade.mistake_tag}
                        </div>
                    )}
                    <p style={{ background: "#fff7ed", padding: "15px", borderRadius: "5px", border: "1px dashed #fdba74", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                        {selectedTrade.notes || "Không có ghi chú."}
                    </p>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}