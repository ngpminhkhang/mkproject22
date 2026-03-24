import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    // Lớp phủ mờ đen (Overlay)
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      
      {/* Hộp nội dung chính */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        width: "600px",
        maxWidth: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        position: "relative"
      }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
          <h3 style={{ margin: 0, color: "#334155" }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{
              background: "transparent", border: "none", fontSize: "1.2em", cursor: "pointer", color: "#94a3b8"
            }}
          >
            ✖
          </button>
        </div>

        {/* Body */}
        <div style={{ lineHeight: "1.6", color: "#475569" }}>
          {children}
        </div>

        {/* Footer (Nút đóng) */}
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button 
            onClick={onClose}
            style={{
              padding: "8px 16px", background: "#cbd5e1", color: "#334155", 
              border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}