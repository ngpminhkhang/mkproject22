import { useState } from "react";
import { Globe, ShieldAlert, Activity, Target, Power, TrendingUp, TrendingDown, Crosshair, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// --- DỮ LIỆU MOCK (DÙNG ĐỂ KHÈ HỘI ĐỒNG TUYỂN SINH) ---
const MOCK_METRICS = {
  total_equity: 1250450.75,
  mode: "NORMAL" as "NORMAL" | "REDUCED" | "HALT",
  accounts: [
    { id: 1, name: "FOREX ALPHA NODE", balance: 625225, allocation: 50, status: "ACTIVE", pnl: 12450.50, dd: 1.2, wr: 68 },
    { id: 2, name: "CRYPTO QUANT NODE", balance: 375135, allocation: 30, status: "CLAMPED", pnl: -4520.00, dd: 6.5, wr: 45 },
    { id: 3, name: "US EQUITIES NODE", balance: 250090, allocation: 20, status: "ACTIVE", pnl: 28400.25, dd: 0.5, wr: 72 },
  ]
};

export default function AUMTerminal() {
  const [mode, setMode] = useState(MOCK_METRICS.mode);

  const handleModeChange = (newMode: "NORMAL" | "REDUCED" | "HALT") => {
    if (confirm(`Kích hoạt giao thức ${newMode} trên toàn hệ thống?`)) {
      setMode(newMode);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-slate-950 font-sans text-slate-300 flex flex-col gap-6">
      
      {/* KHỐI 1: BẢNG ĐIỀU KHIỂN TRUNG TÂM (TOP HUD) */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Hiệu ứng radar ngầm */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* CỘT TÀI SẢN */}
        <div className="flex flex-col z-10 w-full md:w-auto">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
            <Globe size={14} className="text-blue-500" /> MASTER FUND EQUITY
          </span>
          <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md">
            ${MOCK_METRICS.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-2 py-1 rounded">
              <TrendingUp size={14} /> +$36,330.75 (Net)
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lợi nhuận ròng</span>
          </div>
        </div>

        {/* CÔNG TẮC NGUỒN (MASTER SWITCH) */}
        <div className="flex flex-col items-start md:items-end w-full md:w-auto z-10">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldAlert size={14} className={mode === "NORMAL" ? "text-emerald-500" : mode === "REDUCED" ? "text-amber-500" : "text-red-500"} /> 
            EXECUTION PROTOCOL
          </span>
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto shadow-inner">
            <button onClick={() => handleModeChange("NORMAL")} className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black rounded-lg transition-all ${mode === 'NORMAL' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-emerald-400'}`}>
              NORMAL
            </button>
            <button onClick={() => handleModeChange("REDUCED")} className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black rounded-lg transition-all ${mode === 'REDUCED' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-500 hover:text-amber-400'}`}>
              REDUCED
            </button>
            <button onClick={() => handleModeChange("HALT")} className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${mode === 'HALT' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-slate-500 hover:text-red-500'}`}>
              <Power size={12} /> HALT
            </button>
          </div>
        </div>
      </div>

      {/* KHỐI 2: MA TRẬN PHÂN BỔ VỐN (ALLOCATION MATRIX) */}
      <div className="flex flex-col gap-4">
        <h3 className="m-0 flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
          <Target size={18} className="text-blue-500" /> Capital Allocation Matrix
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {MOCK_METRICS.accounts.map((acc, index) => {
            const isFrozen = mode === "HALT";
            const isClamped = acc.status === "CLAMPED" || mode === "REDUCED";
            const borderColor = isFrozen ? "border-slate-800" : isClamped ? "border-amber-900/50" : "border-slate-800 hover:border-blue-500/50";
            const bgGradient = isFrozen ? "bg-slate-900" : isClamped ? "bg-gradient-to-b from-amber-950/20 to-slate-900" : "bg-gradient-to-b from-slate-800/50 to-slate-900";

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                key={acc.id} 
                className={`flex flex-col p-5 rounded-2xl border ${borderColor} ${bgGradient} transition-colors group relative overflow-hidden`}
              >
                
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-black text-lg m-0 leading-tight">{acc.name}</h4>
                    <span className="text-slate-500 text-[10px] font-bold">NODE ID: 00{acc.id}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest flex items-center gap-1 ${isFrozen ? 'bg-slate-800 text-slate-500' : isClamped ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {isFrozen ? "FROZEN" : isClamped ? "CLAMPED" : "ACTIVE"}
                  </div>
                </div>

                {/* Các chỉ số PnL, Winrate */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 font-bold mb-1">NET PNL</div>
                    <div className={`text-sm font-black ${acc.pnl >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                      {acc.pnl >= 0 ? '+' : ''}${Math.abs(acc.pnl).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 font-bold mb-1">WIN RATE</div>
                    <div className="text-sm font-black text-blue-400">{acc.wr}%</div>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 font-bold mb-1">DRAWDOWN</div>
                    <div className={`text-sm font-black ${acc.dd > 5 ? 'text-red-500' : 'text-amber-400'}`}>-{acc.dd}%</div>
                  </div>
                </div>

                {/* Thanh Progress Bar Phân Bổ */}
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-400 text-xs font-bold">Cấp vốn ({acc.allocation}%)</span>
                    <span className="text-white font-black text-lg">${acc.balance.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${acc.allocation}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${isFrozen ? "bg-slate-700" : isClamped ? "bg-amber-500" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"}`}
                    />
                  </div>
                </div>

                {/* Nút truy cập Tầng 2 */}
                <button className="mt-5 w-full bg-slate-950 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white transition-all py-3 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer">
                  <Crosshair size={14} /> TRUY CẬP NODE <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>

              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}