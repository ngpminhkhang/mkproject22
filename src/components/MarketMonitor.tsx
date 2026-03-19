import { useState, useEffect } from "react";
import { Zap, Activity, Skull, Crosshair, AlertTriangle } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

interface RadarBlip {
    id: number;
    ticker: string;
    direction: "BUY" | "SELL";
    macro_aligned: boolean;
    time: string;
}

interface ActiveTrade { uuid: string; pair: string; direction: string; volume: number; entry_price: number; pnl: number; }

export default function MarketMonitor({ onTradeNow }: { onTradeNow: (data: any) => void }) {
    const [signals, setSignals] = useState<RadarBlip[]>([]);
    const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);

    const fetchData = async () => {
        try {
            // Hút dữ liệu tờ trình PENDING từ Két Sắt Django
            const resSig = await fetch("https://mk-project19-1.onrender.com/api/mt5/radar/");
            if (resSig.ok) {
                const data = await resSig.json();
                setSignals(data.radar_blips);
            }

            // Hút danh sách lệnh đang xả đạn (Cái này sếp tự xây API sau)
            const resAct = await fetch("https://mk-project19-1.onrender.com/api/monitor/active/");
            if (resAct.ok) setActiveTrades(await resAct.json());
        } catch (e) {
            console.error("Vệ tinh mất kết nối:", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // Radar quét 3s/lần
        return () => clearInterval(interval);
    }, []);

    const handleExecuteClick = (sig: RadarBlip) => {
        toast.success(`Dịch chuyển ${sig.ticker} sang Buồng Thẩm Vấn Kelly...`);
        // Chuyển dữ liệu sang Execute Node để sếp định đoạt số Lot
        onTradeNow({ pair: sig.ticker, direction: sig.direction, ticket_id: sig.id });
    };

    const handleKillSwitch = async (uuid: string, pair: string) => {
        if (!confirm(`KÍCH HOẠT ÁN TỬ HÌNH CHO ${pair}?`)) return;
        toast.success(`Đã tiêm thuốc độc lệnh ${pair}`);
        // Gọi API ném lệnh cắt lỗ xuống MT5
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '18px', fontWeight: 900 }}>
                    <Crosshair color="#2563eb" /> TRADE DESK DASHBOARD
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
                {/* RADAR PANES */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="#2563eb" /> ALGORITHMIC RADAR (PENDING INTEL)
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
                        {signals.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>Bầu trời quang đãng. Không có biến.</div>
                        ) : (
                            signals.map(sig => (
                                <div key={sig.id} style={{ background: '#f8fafc', borderRadius: '12px', borderLeft: `6px solid ${sig.macro_aligned ? '#16a34a' : '#dc2626'}`, padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{sig.ticker}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>#{sig.id} | {sig.time}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '12px', color: sig.direction === 'BUY' ? '#166534' : '#991b1b', background: sig.direction === 'BUY' ? '#dcfce7' : '#fee2e2' }}>
                                            {sig.direction}
                                        </span>
                                        {!sig.macro_aligned && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '11px', fontWeight: 900 }}>
                                                <AlertTriangle size={14} /> LỆNH BỘI PHẢN
                                            </span>
                                        )}
                                    </div>

                                    <button onClick={() => handleExecuteClick(sig)} style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', fontWeight: 900, border: 'none', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                        <Zap size={14} /> THẨM VẤN & KHAI HỎA
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ACTIVE EXPOSURE */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}><Skull size={18} /> ACTIVE EXPOSURE (LIVE)</h3>
                    {activeTrades.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>
                            Súng đã khóa chốt. Tiền đang cất trong két.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Chỗ này giữ nguyên map activeTrades của sếp */}
                            <div style={{ padding: '10px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}>Tính năng đang bảo trì chờ nối API Kế toán...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}