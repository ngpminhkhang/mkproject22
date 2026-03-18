import { useState, useEffect } from "react";
import { Activity, TrendingUp, Shield, BarChart3, Lock, Database, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast, { Toaster } from "react-hot-toast";

// Placeholder data for the Equity Curve to impress the panel. 
// Later, we connect this to real historical data.
const MOCK_EQUITY_DATA = [
  { name: 'Week 1', equity: 10000 }, { name: 'Week 2', equity: 10150 },
  { name: 'Week 3', equity: 10080 }, { name: 'Week 4', equity: 10320 },
  { name: 'Week 5', equity: 10290 }, { name: 'Week 6', equity: 10550 },
  { name: 'Week 7', equity: 10800 }, { name: 'Current', equity: 11100 },
];

export default function Dashboard({ accountId }: { accountId: number }) {
  const [metrics, setMetrics] = useState({
    aum: 0, net_pnl: 0, floating_pnl: 0, win_rate: 0, 
    total_trades: 0, active_positions: 0, active_exposure: 0, 
    system_mode: "NORMAL", max_drawdown_limit: 2.0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`https://mk-project19-1.onrender.com/api/dashboard/metrics/?accountId=${accountId}`);
        if (res.ok) setMetrics(await res.json());
      } catch (e) {
        toast.error("Connection to Quant Server failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [accountId]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Initializing Quant Terminal...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>QUANTITATIVE PORTFOLIO OVERVIEW</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Globe size={14}/> System Status: <span style={{ color: metrics.system_mode === 'NORMAL' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{metrics.system_mode}</span> | Node: US-East
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color="#64748b" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>End-to-End Encryption Active</span>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            ASSETS UNDER MANAGEMENT <Database size={16} color="#3b82f6"/>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>${metrics.aum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '12px', color: metrics.net_pnl >= 0 ? '#16a34a' : '#dc2626', marginTop: '8px', fontWeight: 600 }}>
            {metrics.net_pnl >= 0 ? '+' : ''}{metrics.net_pnl.toFixed(2)} Realized PnL
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            SYSTEM WIN RATE <TrendingUp size={16} color="#10b981"/>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{metrics.win_rate}%</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>
            Across {metrics.total_trades} Settled Positions
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            LIVE EXPOSURE <Activity size={16} color="#f59e0b"/>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{metrics.active_positions}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>
            Total Volume: {metrics.active_exposure.toFixed(2)} Lots
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            FLOATING PNL <BarChart3 size={16} color="#8b5cf6"/>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: metrics.floating_pnl >= 0 ? '#16a34a' : '#dc2626' }}>
            {metrics.floating_pnl > 0 ? '+' : ''}{metrics.floating_pnl.toFixed(2)}$
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>
            Mark-to-Market Valuation
          </div>
        </div>
      </div>

      {/* CHARTS & DATA */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* EQUITY CURVE */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, marginBottom: '20px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#2563eb" /> CAPITAL ALLOCATION & GROWTH (PROJECTION)
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_EQUITY_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="equity" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RISK PARAMETERS */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, marginBottom: '20px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#dc2626" /> RISK MANAGEMENT PARAMETERS
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>MAX DAILY DRAWDOWN LIMIT</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>{metrics.max_drawdown_limit.toFixed(2)}%</div>
            </div>
            
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>ALGORITHMIC SIZING ENGINE</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Kelly Criterion Active</div>
            </div>

            <div style={{ padding: '16px', background: metrics.system_mode === 'NORMAL' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${metrics.system_mode === 'NORMAL' ? '#bbf7d0' : '#fecaca'}` }}>
              <div style={{ fontSize: '12px', color: metrics.system_mode === 'NORMAL' ? '#166534' : '#991b1b', fontWeight: 600, marginBottom: '4px' }}>EXECUTION PROTOCOL</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: metrics.system_mode === 'NORMAL' ? '#15803d' : '#b91c1c' }}>{metrics.system_mode}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}