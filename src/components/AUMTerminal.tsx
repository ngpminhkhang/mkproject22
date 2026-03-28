import { useState, useEffect } from "react";
import { 
  Globe, ShieldAlert, Target, Power, AlertTriangle, RefreshCcw, 
  Snowflake, Search, Activity, Zap, X
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- DATA STRUCTURES ---
interface PortfolioAccount { id: number; name: string; balance: number; allocation_percent: number; status: string; net_pnl: number;
drawdown_percent: number; win_rate: number; active_pairs?: string[]; }
interface PortfolioMetrics { total_equity: number; mode: "NORMAL" | "REDUCED" | "HALT"; max_daily_risk: number;
accounts: PortfolioAccount[]; }

const EQUITY_HISTORY = [
  { time: 'T-6', equity: 1000000 }, { time: 'T-5', equity: 1025000 }, { time: 'T-4', equity: 1010000 },
  { time: 'T-3', equity: 1080000 }, { time: 'T-2', equity: 1150000 }, { time: 'T-1', equity: 1200000 },
  { time: 'Hiện tại', equity: 1250450 },
];

export default function AUMTerminal() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [inspectingNode, setInspectingNode] = useState<PortfolioAccount | null>(null);
  const [events] = useState<string[]>([
    "[08:00] Master Node Initialization: OK",
    "[08:02] Liquidity Provider Connection: STABLE",
    "[08:05] Risk Engine Scan: No Tail Risks Detected",
    "[08:10] Syncing with Alpha Nodes..."
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    // Giả lập dữ liệu Quant Node chuyên nghiệp
    setMetrics({
      total_equity: 1250450.75, mode: "NORMAL", max_daily_risk: 2,
      accounts: [
        { id: 1, name: "Forex Alpha Node", balance: 625225, allocation_percent: 50, status: "ACTIVE", net_pnl: 12450.50, drawdown_percent: 1.2, win_rate: 68, active_pairs: ["EURUSD", "GBPUSD"] },
        { id: 2, name: "Crypto Quant Node", balance: 375135, allocation_percent: 30, status: "CLAMPED", net_pnl: -4520.00, drawdown_percent: 6.5, win_rate: 45, active_pairs: ["BTCUSD", "ETHUSD"] 
},
        { id: 3, name: "US Equities Node", balance: 250090, allocation_percent: 20, status: "ACTIVE", net_pnl: 28400.25, drawdown_percent: 0.5, win_rate: 72, active_pairs: ["AAPL", "NVDA"] },
      ]
    });
};

  useEffect(() => { loadData(); }, []);

  // Style card chuẩn hình 1 (ideal_ui.jpg)
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' };
  if (!metrics) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>SYNCING WITH MAINNET...</div>;
  
  return (
    <div style={{ 
      padding: isMobile ? '10px' : '16px', 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      fontFamily: "'Inter', sans-serif", 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px' 
    }}>
      <Toaster position="top-right" />

      {/* BLOCK 1: MASTER HEADER - Chuẩn hình 1 */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#3b82f6" />
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>MASTER FUND EQUITY</span>
          </div>
          <span style={{ fontSize: 
isMobile ? '24px' : '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>
            ${metrics.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid #e2e8f0' }}>
            {['NORMAL', 'REDUCED', 'HALT'].map(m => (
                <button key={m} style={{ 
                    padding: '6px 12px', fontSize: '10px', fontWeight: 800, borderRadius: '6px', border: 'none', cursor: 'pointer',
                    backgroundColor: metrics.mode === m ?
(m === 'HALT' ? '#ef4444' : m === 'REDUCED' ? '#f59e0b' : '#10b981') : 'transparent',
                    color: metrics.mode === m ?
'#fff' : '#64748b'
                }}>{m}</button>
            ))}
        </div>
      </div>

      {/* BLOCK 2: QUANTITATIVE OVERVIEW - Thanh ngang nguyên bản (Hình 1) */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>QUANTITATIVE PORTFOLIO OVERVIEW</h2>
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, border: '1px solid #bbf7d0' }}>Encrypted</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ?
'1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
            {[
                { label: 'AUM', value: '$1,000,012', sub: '-0.26 Realized PnL', color: '#0f172a' },
                { label: 'WIN RATE', value: '20%', sub: '5 Settled Pos', color: '#10b981' },
                { label: 'LIVE EXPOSURE', value: '0.00 Lots', sub: 'Active Risk', 
color: '#0f172a' },
                { label: 'FLOATING PNL', value: '$0.00', sub: 'Mark-to-Market', color: '#10b981' }
            ].map((item, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', 
marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>{item.sub}</div>
                </div>
            ))}
        </div>
      </div>

      {/* BLOCK 3: CHART & RISK GRID - Ép khung linh hoạt */}
      <div style={{ display: isMobile ?
'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '2fr 1fr', gap: '12px', flex: 1 }}>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={16} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>CAPITAL GROWTH PROJECTION</h3>
          </div>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EQUITY_HISTORY}>
                <defs><linearGradient id="pnl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide /><YAxis hide domain={['auto', 'auto']} 
/>
                <Tooltip formatter={(val: any) => `$${val.toLocaleString()}`}/>
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fill="url(#pnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'flex', flexDirection: 
'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>RISK PARAMETERS</h3>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#991b1b' }}>MAX DRAWDOWN</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626' }}>2.00%</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' 
}}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>SIZING ENGINE</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Kelly Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCK 4: ALLOCATION MATRIX & HEARTBEATS */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ?
'1fr' : '1.8fr 1fr', gap: '12px', flex: 1 }}>
        
        {/* ALLOCATION MATRIX */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800 }}>
                <Target size={16} color="#3b82f6" /> ALLOCATION MATRIX
            </h3>
            <button style={{ backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}><RefreshCcw size={12}/></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {metrics.accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: acc.status === 'CLAMPED' ?
'#fffbeb' : '#fff' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{acc.name}</div>
                  <div style={{ fontSize: '9px', color: acc.status === 'CLAMPED' ?
'#b45309' : '#166534', fontWeight: 800 }}>{acc.status}</div>
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
                      <span 
style={{ color: acc.net_pnl >= 0 ? '#16a34a' : '#dc2626' }}>${acc.net_pnl.toLocaleString()}</span>
                      <span>{acc.win_rate}% WR |
-{acc.drawdown_percent}% DD</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${acc.allocation_percent}%`, background: acc.status === 'CLAMPED' ?
'#f59e0b' : '#3b82f6' }} />
                  </div>
                </div>
                <button onClick={() => setInspectingNode(acc)} style={{ padding: '6px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', fontWeight: 800, color: '#1d4ed8' }}>View</button>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM HEARTBEATS */}
        <div style={{ backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '16px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
            <Zap size={16} color="#475569" />
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#475569' }}>SYSTEM HEARTBEATS</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
            {events.map((ev, i) => <div key={i} style={{ paddingBottom: '4px', borderBottom: '1px dashed #cbd5e1' }}>{ev}</div>)}
          </div>
          <div style={{ flexGrow: 1 }} /> 
        </div>
      </div>

      {/* MODAL DRILL-DOWN */}
      {inspectingNode && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '500px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '18px', fontWeight: 900 }}>{inspectingNode.name} Audit</h2>
               <button onClick={() => setInspectingNode(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>NODE BALANCE</div>
                  <div style={{ fontSize: '18px', fontWeight: 900 }}>${inspectingNode.balance.toLocaleString()}</div>
               </div>
               <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>DRAWDOWN</div>
                  <div style={{ fontSize: 
'18px', fontWeight: 900, color: '#ef4444' }}>{inspectingNode.drawdown_percent}%</div>
               </div>
               <div style={{ gridColumn: 'span 2', padding: '12px', background: '#eff6ff', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#1d4ed8', marginBottom: '8px' }}>ACTIVE ASSETS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 
'6px' }}>
                    {inspectingNode.active_pairs?.map(p => (
                      <span key={p} style={{ background: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, border: '1px solid #bfdbfe' }}>{p}</span>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}