import React, { useState } from 'react';
import { LayoutDashboard, Globe2, Activity, Target, BookOpen, Star } from 'lucide-react';
import AccountDashboard from './AccountDashboard';
import MacroOutlook from './MacroOutlook';
import MarketMonitor from './MarketMonitor';
import ScenarioBuilder from './ScenarioBuilder';
import TradeJournal from './TradeJournal'; // <--- NẠP ĐẠN JOURNAL
import WeeklyReview from './WeeklyReview'; // <--- NẠP ĐẠN REVIEW

// Chờ bơm máu từ các file tiếp theo


export default function ExecutionDesk() {
    const [activeSubTab, setActiveSubTab] = useState('dashboard');
    const [activeAccount, setActiveAccount] = useState('ACC_01');

    const subTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
        { id: 'outlook', label: 'Macro Outlook', icon: <Globe2 size={14} /> },
        { id: 'monitor', label: 'Market Monitor', icon: <Activity size={14} /> },
        { id: 'scenario', label: 'Scenario', icon: <Target size={14} /> },
        { id: 'journal', label: 'Journal', icon: <BookOpen size={14} /> },
        { id: 'review', label: 'Review', icon: <Star size={14} /> },
    ];

    const renderContent = () => {
        switch (activeSubTab) {
            case 'dashboard': return <AccountDashboard />;
            case 'outlook': return <MacroOutlook />;
            case 'monitor': return <MarketMonitor />;
            case 'scenario': return <ScenarioBuilder />;
            case 'journal': return <TradeJournal />;
            case 'review': return <WeeklyReview />;
            default: return <AccountDashboard />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-3 animate-fade-in pb-10">
            
            {/* THANH ĐIỀU KHIỂN ACCOUNT & SUB-MENU NGANG */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-40">
                
                {/* Chọn Account */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 w-full md:w-auto">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 whitespace-nowrap">Trading Node:</span>
                    <select 
                        value={activeAccount} 
                        onChange={(e) => setActiveAccount(e.target.value)}
                        className="bg-white border border-slate-200 text-blue-700 text-xs font-black rounded px-3 py-1.5 outline-none cursor-pointer shadow-sm w-full"
                    >
                        <option value="ACC_01">Account 1 (Aggressive)</option>
                        <option value="ACC_02">Account 2 (Balanced)</option>
                        <option value="ACC_03">Account 3 (Conservative)</option>
                    </select>
                </div>

                {/* Sub-menu Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto hide-scrollbar">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                                activeSubTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KHU VỰC HIỂN THỊ NỘI DUNG SUB-TAB */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                {renderContent()}
            </div>
        </div>
    );
}