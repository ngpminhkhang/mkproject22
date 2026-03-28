import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Cpu, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlphaEngine() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/v1/alpha-engine/');
                if (!res.ok) throw new Error("Mất kết nối Alpha!");
                const result = await res.json();
                setData(result.data);
            } catch (error) {
                toast.error("Lỗi đồng bộ Alpha Engine.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading || !data) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className="w-full h-full flex flex-col gap-1.5 md:gap-2.5 animate-fade-in">
            <header className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 md:p-3 flex items-center gap-3">
                <Terminal size={24} className="text-blue-600" />
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Alpha Execution Engine</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MQL5 Bridge Active</p>
                </div>
            </header>

            <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
                <div className="bg-white p-2.5 md:p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Latency</p>
                        <p className="text-xl font-black text-emerald-500">{data.latency}</p>
                    </div>
                    <Globe className="text-emerald-100" size={24} />
                </div>
                <div className="bg-white p-2.5 md:p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Nodes</p>
                        <p className="text-xl font-black text-blue-600">{data.activeNodes}</p>
                    </div>
                    <Cpu className="text-blue-100" size={24} />
                </div>
                <div className="bg-white p-2.5 md:p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Uptime</p>
                        <p className="text-xl font-black text-slate-800">{data.uptime}</p>
                    </div>
                    <Activity className="text-slate-200" size={24} />
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-2 md:p-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Signal Feed</h3>
                </div>
                <div className="overflow-x-auto p-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="p-2 text-[9px] font-black text-slate-400 uppercase">Timestamp</th>
                                <th className="p-2 text-[9px] font-black text-slate-400 uppercase">Asset</th>
                                <th className="p-2 text-[9px] font-black text-slate-400 uppercase">Action</th>
                                <th className="p-2 text-[9px] font-black text-slate-400 uppercase">Size</th>
                                <th className="p-2 text-[9px] font-black text-slate-400 uppercase text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.liveFeed.map((feed: any) => (
                                <tr key={feed.id} className="hover:bg-slate-50">
                                    <td className="p-2 text-xs font-bold text-slate-500">{feed.time}</td>
                                    <td className="p-2 text-xs font-black text-slate-800">{feed.pair}</td>
                                    <td className="p-2 text-[10px] font-bold text-blue-600 bg-blue-50 rounded px-2">{feed.action}</td>
                                    <td className="p-2 text-xs font-bold text-slate-600">{feed.size}</td>
                                    <td className="p-2 text-right">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${feed.status === 'FILLED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{feed.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}