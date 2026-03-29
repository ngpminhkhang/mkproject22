import React, { useState } from "react";
import { 
  Star, Brain, Activity, Target, Save
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function WeeklyReview() {
  const [habits, setHabits] = useState({ sleep: true, meditate: false, workout: true, rules: false });
  const [notes, setNotes] = useState("");

  const toggleHabit = (key: keyof typeof habits) => {
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    toast.success("Đã khóa sổ báo cáo tuần!", { icon: '🔒' });
  };

  return (
    <div className="p-3 md:p-4 w-full h-full flex flex-col gap-4 overflow-y-auto bg-slate-50 pb-20 antialiased">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Star size={24} className="text-purple-600" />
            <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Weekly Review</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Psychology & Performance Audit</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* CỘT 1: THÓI QUEN & TÂM LÝ */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-emerald-400">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> Core Habits Tracker</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(habits).map(([key, val]) => (
                <button 
                  key={key} onClick={() => toggleHabit(key as keyof typeof habits)}
                  className={`p-3 rounded-lg border text-xs font-black uppercase tracking-widest transition-all ${val ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                >
                  {key} {val && '✓'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-4 flex-1">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Brain size={14} className="text-purple-400"/> Mental Coach AI</h3>
            <p className="text-sm font-medium text-slate-400 italic leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
              "Tuần này OCI duy trì ở mức an toàn (0.45). Sự kiên nhẫn khi chờ thanh khoản đã mang lại Winrate 68%. Tuy nhiên, bạn đã bỏ lỡ 2 setup vì thiếu ngủ. Kỷ luật cá nhân là nền tảng của quản trị quỹ."
            </p>
          </div>
        </div>

        {/* CỘT 2: TỰ SỰ & KHÓA SỔ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Weekly Narrative</h3>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Tổng kết tuần. Điểm mạnh, điểm yếu, kế hoạch tuần sau..."
              className="w-full flex-1 min-h-[200px] p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium text-slate-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none mb-4"
            />
            <button onClick={handleSave} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-md active:scale-95 transition-all">
              <Save size={16}/> Lock Weekly Audit
            </button>
        </div>
      </div>
    </div>
  );
}