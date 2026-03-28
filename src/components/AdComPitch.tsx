import React, { useState } from 'react';
import { Shield, BarChart3, Brain } from 'lucide-react';

const AdComPitch = () => {
  const [activeTab, setActiveTab] = useState<'logic' | 'risk' | 'math'>('logic');

  // Hàm helper để định dạng nút Navigation (Tab) bằng Tailwind
  const TabButton = ({ id, label, Icon }: { id: 'logic' | 'risk' | 'math', label: string, Icon: any }) => {
    const isActive = activeTab === id;
    const baseClasses = "flex-1 flex flex-col items-center justify-center p-4 rounded-full transition-all duration-300 ease-out";
    
    // Màu sắc động dựa trên tab đang active
    const activeColors = {
      logic: 'bg-blue-600 text-white shadow-[0_5px_15px_-5px_rgba(37,99,235,0.4)]',
      risk: 'bg-rose-600 text-white shadow-[0_5px_15px_-5px_rgba(225,29,72,0.4)]',
      math: 'bg-emerald-600 text-white shadow-[0_5px_15px_-5px_rgba(16,185,129,0.4)]',
    };

    const inactiveColors = "text-slate-500 hover:text-slate-800 hover:bg-slate-100";

    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`${baseClasses} ${isActive ? activeColors[id] : inactiveColors}`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
        <span className={`text-[11px] font-extrabold mt-1 tracking-wider uppercase ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32 overflow-x-hidden">
      
      {/* Container chính: Đảm bảo giao diện nằm giữa và không quá rộng trên mobile lớn */}
      <div className="max-w-lg mx-auto p-6 md:p-8 space-y-10">
        
        {/* Header Thương Hiệu: Đập vào mắt là "MK QUANT" */}
        <header className="border-l-4 border-blue-600 pl-5 pt-1">
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-950">MK QUANT</h1>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">
            Institutional Risk Interface // Ver 1.0
          </p>
        </header>

        {/* Khu vực nội dung Tab */}
        <main className="transition-all duration-500 ease-out">
          
          {/* 01. CORE LOGIC TAB */}
          {activeTab === 'logic' && (
            <div className="animate-fade-in space-y-8 bg-white p-8 rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">// 01_THE_PILLAR</h2>
                <Brain className="text-blue-200" size={32} />
              </div>
              <p className="text-2xl font-black leading-tight text-slate-950 tracking-tight">
                Market is <span className="text-blue-600">probability distribution</span>. <br />
                My system maps the constraints. Gambling is for tourists.
              </p>
              <div className="space-y-4 pt-4">
                <div className="bg-slate-100 text-slate-700 text-center font-bold py-4 rounded-xl text-sm uppercase tracking-wide">MK Risk Engine Ver 1.0</div>
                <p className="text-sm text-slate-600 leading-relaxed pl-1">
                    Triggers stem exclusively from <span className='font-semibold text-slate-800'>macro liquidity constraints</span>, not lagging indicators. We map market structural flow before capital deployment. 
                </p>
              </div>
            </div>
          )}

          {/* 02. RISK CONTROLS TAB */}
          {activeTab === 'risk' && (
            <div className="animate-slide-in-right space-y-8 bg-white p-8 rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">// 02_RISK_ENFORCEMENT</h2>
                <Shield className="text-rose-200" size={32} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 text-center">
                  <span className="text-[10px] text-rose-900 font-extrabold uppercase tracking-widest">Hard Locks</span>
                  <span className="text-4xl font-black text-rose-700 block mt-1 tracking-tight">14 Events</span>
                </div>
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-widest">Current Mode</span>
                  <span className="text-2xl font-black text-blue-700 block mt-1 pt-1 uppercase tracking-tight">Protect</span>
                </div>
              </div>

              <blockquote className="border-l-4 border-rose-600 pl-5 py-1 text-slate-700 leading-relaxed font-medium italic">
                "Survival dictates growth. A dynamic Kelly Criterion sizing algorithm forces a hard 2.00% Max Drawdown limit across the entire portfolio."
              </blockquote>
            </div>
          )}

          {/* 03. MATH TAB */}
          {activeTab === 'math' && (
            <div className="animate-slide-in-bottom space-y-8 bg-white p-8 rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">// 03_POSITION_MATH</h2>
                <BarChart3 className="text-emerald-200" size={32} />
              </div>
              
              <div className="py-6 text-center">
                <div className="text-6xl font-serif text-slate-950 font-medium tracking-tight italic">
                  f* = <span className='text-emerald-600'>(bp-q) / b</span>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-5 pl-2">
                  Kelly Criterion Capital Allocation Implementation
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-6">
                Surgical distribution of AUM. Funds flow exclusively to high-conviction, asymmetrical risk-to-reward setups audited by the institutional system.
              </p>
            </div>
          )}

        </main>
      </div>

      {/* Institutional Navigation Bar: Cố định ở đáy, mờ nền,rounded full */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto bg-white/90 backdrop-blur-lg rounded-full shadow-[0_15px_50px_-5px_rgba(0,0,0,0.12)] border border-slate-100 p-2 flex items-center z-50">
        <TabButton id="logic" label="Logic" Icon={Brain} />
        <TabButton id="risk" label="Risk" Icon={Shield} />
        <TabButton id="math" label="Math" Icon={BarChart3} />
      </nav>

    </div>
  );
};

export default AdComPitch;