import { useState, useEffect } from "react";
import { Zap, Volume2, VolumeX, Activity, Gauge, Skull, Crosshair } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

interface MarketSignal { symbol: string; direction: "BUY" | "SELL" | "NEUTRAL"; active_tags: string[]; is_alerting: boolean; score: number; timestamp: number; }
interface MonitorCardItem { symbol: string; bias: "BUY" | "SELL" | "NEUTRAL"; signal?: MarketSignal; lastUpdate: number; }
interface ActiveTrade { uuid: string; pair: string; direction: string; volume: number; entry_price: number; pnl: number; }

const ALL_TAGS_DEF = [
  { id: 'FIBO_GOLD', label: 'Fibo Golden (38-61)', group: 'MANUAL' },
  { id: 'ZONE_TOUCH', label: 'Price In Zone', group: 'MANUAL' },
  { id: 'STOCH_OB', label: 'Stoch > 70 (Sell)', group: 'OSCILLATOR' },
  { id: 'STOCH_OS', label: 'Stoch < 30 (Buy)', group: 'OSCILLATOR' },
  { id: 'MACD_CROSS_UP', label: 'MACD Cross Up', group: 'TREND' },
  { id: 'MACD_CROSS_DOWN', label: 'MACD Cross Down', group: 'TREND' }
];

const WATCHLIST = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "US30", "NAS100"];

export default function MarketMonitor({ onTradeNow }: { onTradeNow: (data: any) => void }) {
  const [cards, setCards] = useState<MonitorCardItem[]>(WATCHLIST.map(sym => ({ symbol: sym, bias: "NEUTRAL", lastUpdate: Date.now() })));
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const fetchData = async () => {
    try {
      const resSig = await fetch("/api/monitor/signals/");
      if (resSig.ok) {
        const liveSignals: MarketSignal[] = await resSig.json();
        setCards(prevCards => prevCards.map(card => {
          const sig = liveSignals.find(s => s.symbol === card.symbol);
          if (sig) return {...card, bias: sig.direction, signal: sig, lastUpdate: sig.timestamp };
          return {...card, bias: "NEUTRAL", signal: undefined, lastUpdate: Date.now() };
        }));
      }
      
      const resAct = await fetch("/api/monitor/active/");
      if (resAct.ok) {
        const liveTrades: ActiveTrade[] = await resAct.json();
        setActiveTrades(liveTrades);
      }
    } catch (e) { console.error("Data feed interrupted:", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); 
    return () => clearInterval(interval);
  }, []);

  const handleTradeClick = (item: MonitorCardItem) => {
    if(!item.signal) return toast.error("Signal threshold not met.");
    onTradeNow({ pair: item.symbol, direction: item.signal.direction, reason: `Algorithmic consensus score: ${item.signal.score}`, tags: item.signal.active_tags });
  };

  const handleKillSwitch = async (uuid: string, pair: string) => {
    if (!confirm(`Initiate emergency liquidation for ${pair}?`)) return;
    try {
      const res = await fetch("/api/monitor/kill/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid })
      });
      if (res.ok) toast.success(`Liquidation protocol initiated for ${pair}`);
    } catch (e) { toast.error("Execution engine API failure!"); }
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-right"/>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '18px', fontWeight: 800 }}>
          <Crosshair className="text-blue-600" /> TRADE DESK DASHBOARD
        </h2>
        <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: soundEnabled ? '#dcfce7' : '#f1f5f9', color: soundEnabled ? '#16a34a' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
          {soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>} Audio Alerts
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* RADAR PANES */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18}/> ALGORITHMIC RADAR</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
            {cards.map(item => {
              const hasSignal = item.bias !== "NEUTRAL";
              const activeTags = item.signal?.active_tags || [];
              const score = item.signal?.score || 0;
              const planColor = item.bias === 'BUY' ? '#16a34a' : (item.bias === 'SELL' ? '#dc2626' : '#cbd5e1');
              return (
                <div key={item.symbol} style={{ background: 'white', borderRadius: '12px', border: `2px solid ${hasSignal ? planColor : '#e2e8f0'}`, padding: '15px', boxShadow: hasSignal ? `0 4px 10px ${planColor}30` : 'none', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{item.symbol}</div>
                    <div style={{ padding: '2px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '10px', color: hasSignal ? 'white' : '#64748b', background: planColor }}>{item.bias}</div>
                  </div>
                  {hasSignal && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}>
                      <Gauge size={14} color={planColor}/>
                      <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '12px' }}>Score: <span style={{ color: planColor }}>{score}/100</span></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '60px', marginBottom: '10px' }}>
                    {ALL_TAGS_DEF.map(tagDef => {
                      const isActive = activeTags.includes(tagDef.id);
                      return (
                        <div key={tagDef.id} style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 700, borderRadius: '4px', background: isActive ? (item.bias === 'BUY' ? '#dcfce7' : '#fee2e2') : '#f8fafc', color: isActive ? (item.bias === 'BUY' ? '#166534' : '#991b1b') : '#94a3b8', border: `1px solid ${isActive ? (item.bias === 'BUY' ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}`, opacity: isActive ? 1 : 0.6 }}>
                          {tagDef.label}
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={() => handleTradeClick(item)} disabled={!hasSignal} style={{ width: '100%', padding: '8px', background: hasSignal ? planColor : '#f1f5f9', borderRadius: '6px', color: hasSignal ? 'white' : '#94a3b8', fontWeight: 'bold', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: hasSignal ? 'pointer' : 'not-allowed', fontSize: '12px' }}>
                    <Zap size={14} /> EXECUTE ORDER
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE EXPOSURE */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}><Skull size={18}/> ACTIVE EXPOSURE</h3>
          
          {activeTrades.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>No active positions. Capital is currently parked.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeTrades.map(trade => (
                <div key={trade.uuid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${trade.direction === 'BUY' ? '#16a34a' : '#dc2626'}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{trade.pair}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', background: trade.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: trade.direction === 'BUY' ? '#166534' : '#991b1b' }}>{trade.direction}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Vol: <b>{trade.volume}</b> | Entry: <b>{trade.entry_price}</b></div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: trade.pnl >= 0 ? '#16a34a' : '#dc2626' }}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}$
                    </div>
                    <button onClick={() => handleKillSwitch(trade.uuid, trade.pair)} style={{ marginTop: '5px', background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)' }}>
                      <Skull size={12}/> KILL SWITCH
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}