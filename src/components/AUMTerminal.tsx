import { useState, useEffect } from "react";
import { 
  Globe, ShieldAlert, Target, Power, AlertTriangle, RefreshCcw, 
  Snowflake, Search, Activity
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioAccount { id: number; name: string; balance: number; allocation_percent: number; status: string; net_pnl: number; drawdown_percent: number; win_rate: number; }
interface PortfolioMetrics { total_equity: number; mode: "NORMAL" | "REDUCED" | "HALT"; max_daily_risk: number; accounts: PortfolioAccount[]; }

const EQUITY_HISTORY = [
  { time: 'T-6', equity: 1000000 }, { time: 'T-5', equity: 1025000 }, { time: 'T-4', equity: 1010000 },
  { time: 'T-3', equity: 1080000 }, { time: 'T-2', equity: 1150000 }, { time: 'T-1', equity: 1200000 },
  { time: 'Hiện tại', equity: 1250450 },
];

export default function AUMTerminal() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [inspectingAccount, setInspectingAccount] = useState<PortfolioAccount | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    setMetrics({
      total_equity: 1250450.75, mode: "NORMAL", max_daily_risk: 2,
      accounts: [
        { id: 1, name: "Forex Alpha Node", balance: 625225, allocation_percent: 50, status: "ACTIVE", net_pnl: 12450.50, drawdown_percent: 1.2, win_rate: 68 },
        { id: 2, name: "Crypto Quant Node", balance: 375135, allocation_percent: 30, status: "CLAMPED", net_pnl: -4520.00, drawdown_percent: 6.5, win_rate: 45 },
        { id: 3, name: "US Equities Node", balance: 250090, allocation_percent: 20, status: "ACTIVE", net_pnl: 28400.25, drawdown_percent: 0.5, win_rate: 72 },
      ]
    });
  };

  useEffect(() => { loadData(); }, [isRebalancing, inspectingAccount]);

  const changeMode = async (newMode: string) => {
    if (!confirm(`Xác nhận chuyển hệ thống sang chế độ: ${newMode}?`)) return;
    toast.success(`Đã kích hoạt chế độ ${newMode}`);
    loadData();
  };

  if (!metrics) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Đang tải dữ liệu quỹ...</div>;

  return (
    <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', overflowX: 'hidden' }}>
      <Toaster position="top-right" />

      {/* KHỐI 1: HEADER */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Globe size={14} color="#3b82f6" />
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>MASTER FUND EQUITY</span>
          </div>
          <span style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
            ${metrics.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ width: isMobile ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <ShieldAlert size={14} color={metrics.mode === "NORMAL" ? "#10b981" : metrics.mode === "REDUCED" ? "#f59e0b" : "#ef4444"} />
            <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>EXECUTION PROTOCOL</span>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid #e2e8f0', width: '100%' }}>
            <button onClick={() => changeMode("NORMAL")} style={{ flex: 1, padding: '8px 0', fontSize: '11px', fontWeight: 800, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: metrics.mode === 'NORMAL' ? '#10b981' : 'transparent', color: metrics.mode === 'NORMAL' ? '#fff' : '#64748b' }}>NORMAL</button>
            <button onClick={() => changeMode("REDUCED")} style={{ flex: 1, padding: '8px 0', fontSize: '11px', fontWeight: 800, borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: metrics.mode === 'REDUCED' ? '#f59e0b' : 'transparent', color: metrics.mode === 'REDUCED' ? '#fff' : '#64748b' }}>REDUCED</button>
            <button onClick={() => changeMode("HALT")} style={{ flex: 1, padding: '8px 0', fontSize: '11px', fontWeight: 800, borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', backgroundColor: metrics.mode === 'HALT' ? '#ef4444' : 'transparent', color: metrics.mode === 'HALT' ? '#fff' : '#64748b' }}><Power size={12} /> HALT</button>
          </div>
        </div>
      </div>

      {/* KHỐI 2: 4 THẺ TÓM TẮT */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>QUANTITATIVE PORTFOLIO OVERVIEW</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
              <span>Status: <strong style={{ color: '#10b981' }}>NORMAL</strong></span> | <span>Node: US-East</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1px solid #bbf7d0' }}>
            Encrypted
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '130px' : '200px'}, 1fr))`, gap: '8px' }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>AUM</div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: '#0f172a' }}>$1,000,012</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ef4444', marginTop: '2px' }}>-0.26 Realized PnL</div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>WIN RATE</div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: '#10b981' }}>20%</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>5 Settled Pos</div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>LIVE EXPOSURE</div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: '#0f172a' }}>0</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>0.00 Lots</div>
          </div>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>FLOATING PNL</div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: '#10b981' }}>$0.00</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>Mark-to-Market</div>
          </div>
        </div>
      </div>

      {/* KHỐI 3: BIỂU ĐỒ & RỦI RO */}
      <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Activity size={16} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>CAPITAL GROWTH PROJECTION</h3>
          </div>
          <div style={{ height: '220px', width: '100%', marginLeft: isMobile ? '-10px' : '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EQUITY_HISTORY} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} domain={['auto', 'auto']} width={45} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontWeight: 'bold' }} itemStyle={{ color: '#3b82f6' }} formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Equity']} />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>RISK PARAMETERS</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>MAX DRAWDOWN</div>
              <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#dc2626' }}>2.00%</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>SIZING ENGINE</div>
              <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 800, color: '#0f172a' }}>Kelly Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 4: MA TRẬN PHÂN BỔ VỐN - HÚT MỠ MOBILE */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>
            <Target size={16} color="#3b82f6" /> ALLOCATION MATRIX
          </h3>
          <button onClick={() => setIsRebalancing(true)} style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            <RefreshCcw size={12} /> SYNC
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {metrics.accounts.map(acc => {
            const isFrozen = acc.status === "FROZEN";
            const isClamped = acc.status === "CLAMPED";
            
            return (
              <div key={acc.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '10px' : '12px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${isFrozen ? '#cbd5e1' : isClamped ? '#fcd34d' : '#e2e8f0'}`, backgroundColor: isFrozen ? '#f8fafc' : isClamped ? '#fffbeb' : '#ffffff' }}>
                
                {/* Tên & Trạng thái */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start', width: isMobile ? '100%' : 'auto', gap: '4px', flex: isMobile ? 'none' : '1 1 180px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{acc.name} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>#{acc.id}</span></span>
                  <div style={{ display: 'flex' }}>
                    {!isFrozen && !isClamped && <span style={{ fontSize: '9px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>NORMAL</span>}
                    {isClamped && <span style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>CLAMPED</span>}
                    {isFrozen && <span style={{ fontSize: '9px', backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}><Snowflake size={10}/> FROZEN</span>}
                  </div>
                </div>

                {/* Chỉ số & Thanh tiến độ */}
                <div style={{ flex: isMobile ? 'none' : '2 1 200px', width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: acc.net_pnl >= 0 ? '#16a34a' : '#dc2626' }}>{acc.net_pnl >= 0 ? '+' : ''}${Math.abs(acc.net_pnl).toFixed(2)}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{acc.win_rate.toFixed(0)}% WR | <span style={{ color: '#ef4444' }}>-{acc.drawdown_percent.toFixed(1)}% DD</span></span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '8px', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: isFrozen ? '#94a3b8' : isClamped ? '#f59e0b' : '#3b82f6', width: `${acc.allocation_percent}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Số tiền & Nút View */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : '1 1 100px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>${(metrics.total_equity * (acc.allocation_percent / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <button onClick={() => setInspectingAccount(acc)} style={{ padding: '6px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#1d4ed8', fontWeight: 800, fontSize: '11px' }}>
                    <Search size={12} /> View
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}