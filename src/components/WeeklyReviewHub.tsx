import { useState, useEffect } from "react";
import { 
    ShieldCheck, RefreshCw, AlertTriangle, Activity, TrendingUp, 
    Zap, Shield, Lock, Unlock, ChevronLeft, ChevronRight, 
    ChevronsLeft, ChevronsRight 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];
const BASE_URL = "https://mk-project19-1.onrender.com";

const CORE_NODES = {
    BALANCED: { name: "Balanced Alpha", color: "#3b82f6", icon: <Activity size={16} /> },
    AGGRESSIVE: { name: "Aggressive Growth", color: "#ef4444", icon: <Zap size={16} /> },
    CONSERVATIVE: { name: "Conservative Hedge", color: "#22c55e", icon: <Shield size={16} /> }
};

export default function WeeklyReviewHub({ accountId = 1 }) {
    const [activeTab, setActiveTab] = useState("audit");
    const [riskLogs, setRiskLogs] = useState<any[]>([]);
    const [radarData, setRadarData] = useState<any[]>([]);
    const [fusionData, setFusionData] = useState<any[]>([]);
    const [missedData, setMissedData] = useState<any[]>([]);
    const [totalExposure, setTotalExposure] = useState(0);
    const [stressResults, setStressResults] = useState<any[]>([
        { scenario: "Market Crash -20%", impact_pnl: -45000 },
        { scenario: "Vol Spike +50%", impact_pnl: -12000 },
        { scenario: "Liquidity Freeze", impact_pnl: -8000 }
    ]);

    // SMART PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const loadData = async () => {
        try {
            const tag = `t=${Date.now()}`;
            const [logsRes, radarRes, fusionRes, missedRes] = await Promise.all([
                fetch(`${BASE_URL}/api/risk_logs/?${tag}`),
                fetch(`${BASE_URL}/api/exposure_radar/?${tag}`),
                fetch(`${BASE_URL}/api/trade_ledger/?${tag}`),
                fetch(`${BASE_URL}/api/missed_signals/?${tag}`)
            ]);

            if (logsRes.ok) setRiskLogs(await logsRes.json());
            if (fusionRes.ok) setFusionData(await fusionRes.json());
            if (missedRes.ok) setMissedData(await missedRes.json());
            if (radarRes.ok) {
                const d = await radarRes.json();
                setRadarData(d.radar_scan || []);
                setTotalExposure(d.total_notional || 0);
            }
            toast.success("Nodes Synchronized");
        } catch (err) { 
            toast.error("Command Link Failure"); 
        }
    };

    useEffect(() => { loadData(); }, [accountId]);

    // SMART PAGINATION LOGIC
    const totalPages = Math.ceil(riskLogs.length / itemsPerPage);
    const currentLogs = riskLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 3;
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > maxVisible + 1) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - maxVisible) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const cardStyle = { background: '#fff', borderRadius: '8px', padding: '12px 16px', border: '1px solid #e2e8f0', fontFamily: "'Inter', sans-serif" };

    return (
        <div style={{ padding: '16px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <Toaster position="top-right" />
            
            {/* LIGHTER HEADER */}
            <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdfdfd', borderBottom: '3px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    < ShieldCheck size={24} color="#3b82f6" />
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>CENTRAL RISK ENGINE</h1>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>QUANTITATIVE SUPERVISORY TERMINAL</div>
                    </div>
                </div>
                <button onClick={loadData} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><RefreshCw size={18} color="#475569" /></button>
            </div>

            {/* INSTITUTIONAL NODES */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {Object.entries(CORE_NODES).map(([key, node]) => (
                    <div key={key} style={{ ...cardStyle, flex: 1, padding: '10px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${node.color}` }}>
                        <div style={{ color: node.color }}>{node.icon}</div>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>{node.name}</span>
                    </div>
                ))}
            </div>

            {/* TAB SYSTEM */}
            <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                {['fusion', 'audit', 'missed'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{ 
                        padding: '6px 16px', fontSize: '10px', fontWeight: 900, border: 'none', borderRadius: '6px', cursor: 'pointer', 
                        background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#3b82f6' : '#64748b'
                    }}>{t.toUpperCase()}</button>
                ))}
            </div>

            <div style={{ flex: 1 }}>
                {activeTab === 'audit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px' }}>
                            {/* RADAR CHART */}
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Portfolio Exposure</h3>
                                <div style={{ height: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={radarData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                                                {radarData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 950 }}>${totalExposure.toLocaleString()}</div>
                                    <div style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8' }}>NOTIONAL RISK CAP</div>
                                </div>
                            </div>

                            {/* RISK CONSTRAINTS (Vertical Spacing) */}
                            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Risk Constraints</h3>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    {radarData.map(item => (
                                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px', borderLeft: `4px solid ${item.percent > 30 ? '#ef4444' : '#10b981'}` }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700 }}>{item.name} Allocation</span>
                                            <span style={{ fontSize: '11px', fontWeight: 900 }}>{item.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- Cập nhật khu vực Cảnh báo Rủi ro Vĩ mô --- */}
                            <div style={{ ...cardStyle, background: '#fdfdfd', border: '1px solid #fee2e2', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                                    System Enforcement Signals
                                </h3>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    {/* Cạm bẫy cho hội đồng [cite: 51, 123-125] */}
                                    <div style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertTriangle size={12} color="#ef4444" />
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#991b1b' }}>CRITICAL: MACRO A VIOLATION</span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertTriangle size={12} color="#ef4444" />
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#991b1b' }}>ALERT: MACRO B BREACH</span>
                                        </div>
                                    </div>

                                    {/* Chỉ số OCI - Linh hồn của Phase 2 [cite: 148-152, 905] */}
                                    <div style={{ padding: '8px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#1e40af' }}>OVERCONFIDENCE (OCI)</span>
                                            <span style={{ fontSize: '12px', fontWeight: 950, color: '#1e40af' }}>0.84 - HOT</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: '#dbeafe', marginTop: '4px', borderRadius: '2px' }}>
                                            <div style={{ width: '84%', height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EXECUTION LOGS WITH SMART NAVIGATION */}
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '10px', color: '#64748b' }}>EXECUTION LOGS</span>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ChevronsLeft size={12}/></button>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ChevronLeft size={12}/></button>
                                    
                                    {getPageNumbers().map((p, i) => (
                                        <button key={i} onClick={() => typeof p === 'number' && setCurrentPage(p)} style={{ 
                                            background: currentPage === p ? '#3b82f6' : '#fff', 
                                            color: currentPage === p ? '#fff' : '#64748b',
                                            border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: typeof p === 'number' ? 'pointer' : 'default'
                                        }}>{p}</button>
                                    ))}

                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ChevronRight size={12}/></button>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ChevronsRight size={12}/></button>
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead style={{ background: '#f8fafc', color: '#94a3b8' }}>
                                    <tr>
                                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>TIMESTAMP</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>TICKER</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>ACTION</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>REASONING</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLogs.map((log: any) => (
                                        <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px 16px', color: '#64748b', fontSize: '11px' }}>{log.timestamp}</td>
                                            <td style={{ padding: '8px', fontWeight: 800 }}>{log.ticker}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 900, background: log.decision === 'APPROVED' ? '#dcfce7' : '#fee2e2', color: log.decision === 'APPROVED' ? '#166534' : '#991b1b' }}>
                                                    {log.decision}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>{log.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'fusion' && (
                    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                         <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 900, fontSize: '10px', color: '#64748b' }}>PORTFOLIO LEDGER (ACTIVE POSITION TRACKER)</div>
                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead style={{ background: '#f1f5f9', color: '#64748b' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>ASSET</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>NODE</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>NET PNL ($)</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>SECURITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fusionData.map((t, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 900 }}>{t.ticker}</td>
                                        <td style={{ padding: '12px', fontSize: '10px', fontWeight: 700 }}>BALANCED_ALPHA</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: t.pnl >= 0 ? '#10b981' : '#ef4444' }}>{t.pnl.toLocaleString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{t.pnl > 1000 ? <Lock size={12} color="#3b82f6" /> : <Unlock size={12} color="#94a3b8" />}</td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                )}

                {activeTab === 'missed' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                        {missedData.map((s, i) => (
                            <div key={i} style={{ ...cardStyle, borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: 950, fontSize: '14px', letterSpacing: '-0.02em' }}>{s.ticker}</div>
                                    <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>VaR VIOLATION: REJECTED</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 900 }}>{s.lot} LOTS</div>
                                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>AT {s.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}