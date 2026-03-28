import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RiskEngine() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/v1/risk-engine/');
                if (!res.ok) throw new Error("Mất kết nối Risk Engine!");
                const result = await res.json();
                setData(result.data);
            } catch (error) {
                toast.error("Lỗi đồng bộ Risk.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading || !data) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-rose-600" size={32} /></div>;

    return (
        <div className="w-full h-full flex flex-col gap-1.5 md:gap-2.5 animate-fade-in">
            <header className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 md:p-3 flex items-center gap-3">
                <ShieldAlert size={24} className="text-rose-600" />
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Institutional Risk Engine</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Capital Preservation Matrix</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2.5">
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">Portfolio Max Drawdown</h3>
                    <div className="text-4xl font-black text-rose-600 tracking-tighter">{data.maxDrawdown}</div>
                    <div className="mt-4 flex items-center justify-between bg-white/60 p-2 rounded">
                        <span className="text-[10px] font-bold text-rose-900 uppercase">Current DD</span>
                        <span className="text-sm font-black text-emerald-600">{data.currentDrawdown}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dynamic Sizing Algorithm</h3>
                        <div className="text-2xl font-serif font-medium italic text-slate-800">{data.kellyFraction}</div>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed bg-slate-50 p-2 rounded mt-2">
                        Position sizing is strictly regulated by fractional Kelly. Manual overrides are disabled.
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 p-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3 border-b border-slate-100 pb-2">Active Hard Locks</h3>
                <div className="space-y-2">
                    {data.hardLocks.map((lock: any) => (
                        <div key={lock.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Lock size={14} className="text-slate-500" />
                                <span className="text-xs font-bold text-slate-700">{lock.trigger}</span>
                            </div>
                            <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded tracking-widest uppercase">{lock.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}