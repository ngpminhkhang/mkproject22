import { useState, useEffect } from "react";
import { ShieldCheck, Target, AlertTriangle, RefreshCw, History } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// --- ĐỊNH NGHĨA KHUNG XƯƠNG (INTERFACES) ---
interface RiskLog { id: number; ticker: string; decision: string; reason: string; timestamp: string; }
interface RadarData { name: string; value: number; percent: number; }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function WeeklyReviewHub({ accountId = 1 }: { accountId?: number }) {
    const [activeTab, setActiveTab] = useState("audit");
    const [riskLogs, setRiskLogs] = useState<RiskLog[]>([]);
    const [radarData, setRadarData] = useState<RadarData[]>([]);
    const [totalExposure, setTotalExposure] = useState(0);

    const loadData = async () => {
        try {
            // SẾP LƯU Ý: Đổi URL này thành localhost nếu đang chạy máy cá nhân!
            const baseUrl = "https://mk-project19-1.onrender.com/api"; 
            const tag = `t=${Date.now()}`;
            const [rLogs, rRadar] = await Promise.all([
                fetch(`${baseUrl}/risk_logs/?${tag}`),
                fetch(`${baseUrl}/exposure_radar/?${tag}`)
            ]);
            if (rLogs.ok) setRiskLogs(await rLogs.json());
            if (rRadar.ok) {
                const d = await rRadar.json();
                setRadarData(d.radar_scan || []);
                setTotalExposure(d.total_notional || 0);
            }
            toast.success("Radar đã quét xong!");
        } catch { toast.error("Mất kết nối vệ tinh!"); }
    };

    useEffect(() => { loadData(); }, []);

    const flatCard = { background: '#fff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' };

    return (
        <div style={{ padding: '12px', background: '#f8fafc', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'Inter, sans-serif' }}>
            <Toaster />
            <div style={{ ...flatCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>System Audit Hub</h1>
                <button onClick={loadData} style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><RefreshCw size={16}/></button>
            </div>

            <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '8px', width: 'fit-content' }}>
                {['fusion', 'audit', 'missed'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800, border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === t ? '#fff' : 'transparent' }}>{t.toUpperCase()}</button>
                ))}
            </div>

            {activeTab === 'audit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                        <div style={flatCard}>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', margin: '0 0 10px 0' }}>EXPOSURE RADAR</h3>
                            <div style={{ height: '160px' }}>
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={radarData} innerRadius={50} outerRadius={70} dataKey="value">
                                                {radarData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Exposure']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Chờ dữ liệu EXECUTED...</div>}
                            </div>
                        </div>

                        <div style={flatCard}>
                            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', margin: '0 0 10px 0' }}>RISK ADVISORY</h3>
                            {radarData.map(item => (
                                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px', background: '#f8fafc', borderRadius: '6px', borderLeft: `4px solid ${item.percent > 30 ? '#ef4444' : '#10b981'}` }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.name}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 900 }}>{item.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ ...flatCard, padding: 0 }}>
                        <div style={{ padding: '10px', fontWeight: 800, fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>ORDER AUDIT TRAIL</div>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ textAlign: 'left', color: '#64748b' }}><th style={{ padding: '10px' }}>TIME</th><th style={{ padding: '10px' }}>ASSET</th><th style={{ padding: '10px' }}>DECISION</th><th style={{ padding: '10px' }}>REASON</th></tr></thead>
                            <tbody>
                                {riskLogs.map(log => (
                                    <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px' }}>{log.timestamp}</td>
                                        <td style={{ padding: '10px', fontWeight: 800 }}>{log.ticker}</td>
                                        <td style={{ padding: '10px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontWeight: 900, background: log.decision === 'APPROVED' ? '#dcfce7' : '#fef2f2', color: log.decision === 'APPROVED' ? '#166534' : '#991b1b' }}>{log.decision}</span></td>
                                        <td style={{ padding: '10px', fontStyle: 'italic' }}>{log.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}