import React, { useState } from "react";
import { 
  BookOpen, Filter, Search, CheckCircle2, 
  XCircle, Save, Tag, PenTool
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const MOCK_TRADES = [
  { id: '1', date: '2026-03-20', pair: 'EURUSD', type: 'BUY', pnl: 450, status: 'WIN', notes: 'Vào lệnh chuẩn mô hình.' },
  { id: '2', date: '2026-03-19', pair: 'GBPUSD', type: 'SELL', pnl: -150, status: 'LOSS', notes: 'Bị quét SL do tin tức.' },
  { id: '3', date: '2026-03-18', pair: 'XAUUSD', type: 'BUY', pnl: 890, status: 'WIN', notes: 'Bắt đúng đáy thanh khoản.' },
];

const MISTAKES = ["FOMO", "Revenge", "Oversize", "No Plan", "Early Exit", "Moved SL"];

export default function TradeJournal() {
  const [selectedTrade, setSelectedTrade] = useState(MOCK_TRADES[0]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [lessons, setLessons] = useState("");

  const toggleMistake = (m: string) => {
    setMistakes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSave = () => {
    toast.success("Nhật ký đã được ghi sổ an toàn!", { icon: '📖' });
  };

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-4 overflow-y-auto bg-slate-50 pb-20 antialiased">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Trade Journal</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Ledger & Tagging</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase flex items-center gap-1.5"><Filter size={14}/> Filter</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
        {/* LỊCH SỬ LỆNH */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[500px]">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Recent Executions</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {MOCK_TRADES.map(trade => (
              <div 
                key={trade.id} onClick={() => setSelectedTrade(trade)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTrade.id === trade.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-slate-900">{trade.pair}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${trade.type === 'BUY' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{trade.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">{trade.date}</span>
                  <span className={`text-xs font-black ${trade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.pnl >= 0 ? '+' : ''}${trade.pnl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KHU VỰC GHI CHÉP & ĐÁNH GIÁ (TAGGING) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PenTool size={14} className="text-blue-500"/> Post-Trade Analytics</h3>
              <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${selectedTrade.status === 'WIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {selectedTrade.status} TRADE
              </span>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><Tag size={12}/> Behavioral Mistakes</label>
              <div className="flex flex-wrap gap-2">
                {MISTAKES.map(m => (
                  <button 
                    key={m} onClick={() => toggleMistake(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${mistakes.includes(m) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Lessons Learned & Narrative</label>
              <textarea 
                value={lessons} onChange={e => setLessons(e.target.value)}
                placeholder="Rút ra bài học gì từ lệnh này? OCI có đang tăng cao không?..."
                className="w-full flex-1 min-h-[150px] p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={handleSave} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 transition-all">
                <Save size={16}/> Sync to Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}