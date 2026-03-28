import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, Flame, Target, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BehavioralAnalytics() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/v1/behavioral-analytics/');
                if (!res.ok) throw new Error("Mất kết nối Analytics!");
                const result = await res.json();
                setData(result.data);
            } catch (error) {
                toast.error("Lỗi đồng bộ Diagnostics.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading || !data) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

    return (
        <div className="w-full h-full flex flex-col gap-1.5 md:gap-2.5 animate-fade-in">
            <header className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 md:p-3 flex items-center gap-3">
                <BarChart3 size={24} className="text-purple-600" />
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Behavioral Diagnostics</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Psychological Stress Auditor</p>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame size={16} className="text-rose-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OCI Score</span>
                    </div>
                    <div className="text-3xl font-black text-rose-600">{data.oci}</div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Overconfidence Warning</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discipline Index</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600">{data.discipline}</div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Rule Adherence</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-blue-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Streak</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600">{data.consecutiveWins} <span className="text-sm">Trades</span></div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Euphoria Risk Detected</p>
                </div>
            </div>

            <div className="bg-purple-50 rounded-lg border border-purple-100 shadow-sm flex-1 p-4 flex items-center justify-center text-center">
                 <div>
                     <h3 className="text-sm font-black text-purple-900 uppercase mb-2">Automated Intervention Armed</h3>
                     <p className="text-xs text-purple-700 font-medium max-w-sm mx-auto leading-relaxed">
                         System detects rising Overconfidence Index (OCI) correlating with current win streak. Position sizing has been clamped down by 20% to mitigate euphoria-induced tilt.
                     </p>
                 </div>
            </div>
        </div>
    );
}