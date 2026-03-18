import { useState, useEffect, useMemo } from "react";
import { Save, Globe, RotateCcw, Crosshair, Brain, Landmark, Zap, Send, Activity, Layers, Wand2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60000));
  return localDate.toISOString().split('T')[0];
};

export default function WeeklyForm({ accountId = 1, onSendToScenario }: { accountId?: number, onSendToScenario?: (signal: any) => void }) {
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [global, setGlobal] = useState<any>({ risk: 'Mixed', liquidity: 'Neutral', volatility: 'Normal', macro_phase: 'Slowdown' });
  const [banks, setBanks] = useState<any>({
    FED: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    ECB: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    BOE: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' },
    BOJ: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' }
  });
  const [pressures, setPressures] = useState<any>({ usd_structural: 'Neutral', commodity: 'Neutral', yield_bias: 'Neutral' });
  const [scores, setScores] = useState<Record<string, number>>({ USD: 0, EUR: 0, GBP: 0, JPY: 0, XAU: 0, SPX: 0 });
  
  const [finalBias, setFinalBias] = useState("NEUTRAL");
  const [scriptPlan, setScriptPlan] = useState("");
  const [taBias, setTaBias] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch(`https://mk-project19-1.onrender.com/api/outlook/?accountId=${accountId}&weekStart=${currentWeek}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.status === "ok") {
        setFinalBias(data.final_bias || "NEUTRAL");
        setScriptPlan(data.script_plan || "");
        setTaBias(data.ta_bias || "");
        
        try {
          const fa = JSON.parse(data.fa_bias || "{}");
          if (fa.global) setGlobal(fa.global);
          if (fa.banks) setBanks(fa.banks);
          if (fa.pressures) setPressures(fa.pressures);
          if (fa.scores) setScores(fa.scores);
        } catch {}
      } else {
        handleReset();
      }
    } catch (e) { toast.error("Database connection failed."); }
  };

  useEffect(() => { loadData(); }, [currentWeek, accountId]);

  const handleReset = () => {
    setGlobal({ risk: 'Mixed', liquidity: 'Neutral', volatility: 'Normal', macro_phase: 'Slowdown' });
    setBanks({ FED: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' }, ECB: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' }, BOE: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' }, BOJ: { stance: 'Hold', tone: 'Neutral', gap: 'Aligned' } });
    setPressures({ usd_structural: 'Neutral', commodity: 'Neutral', yield_bias: 'Neutral' });
    setScores({ USD: 0, EUR: 0, GBP: 0, JPY: 0, XAU: 0, SPX: 0 });
    setFinalBias("NEUTRAL"); setScriptPlan(""); setTaBias("");
  };

  const handleSave = async () => {
    const payload = {
      account_id: accountId,
      week_start_date: currentWeek,
      final_bias: finalBias,
      script_plan: scriptPlan,
      ta_bias: taBias,
      fa_bias: JSON.stringify({ global, banks, pressures, scores })
    };

    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/outlook/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) toast.success("Macro Outlook Synchronized.");
      else toast.error("Synchronization Failed.");
    } catch (e) { toast.error("API Error."); }
  };

  // ==========================================
  // MACRO ARBITRAGE ENGINE (Tính độ lệch)
  // ==========================================
  const generatedSignals = useMemo(() => {
    const sigs = [];
    const u = scores.USD || 0;
    
    // EURUSD (EUR vs USD)
    const e = scores.EUR || 0;
    if (e - u >= 3) sigs.push({ pair: "EURUSD", dir: "BUY", spread: e - u });
    if (u - e >= 3) sigs.push({ pair: "EURUSD", dir: "SELL", spread: u - e });
    
    // GBPUSD (GBP vs USD)
    const g = scores.GBP || 0;
    if (g - u >= 3) sigs.push({ pair: "GBPUSD", dir: "BUY", spread: g - u });
    if (u - g >= 3) sigs.push({ pair: "GBPUSD", dir: "SELL", spread: u - g });
    
    // XAUUSD (XAU vs USD)
    const x = scores.XAU || 0;
    if (x - u >= 3) sigs.push({ pair: "XAUUSD", dir: "BUY", spread: x - u });
    if (u - x >= 3) sigs.push({ pair: "XAUUSD", dir: "SELL", spread: u - x });
    
    // USDJPY (USD vs JPY) - Chú ý JPY nằm sau
    const j = scores.JPY || 0;
    if (u - j >= 3) sigs.push({ pair: "USDJPY", dir: "BUY", spread: u - j });
    if (j - u >= 3) sigs.push({ pair: "USDJPY", dir: "SELL", spread: j - u });

    // SPX (Đứng độc lập hoặc so với risk)
    const s = scores.SPX || 0;
    if (s >= 3) sigs.push({ pair: "US30", dir: "BUY", spread: s });
    if (s <= -3) sigs.push({ pair: "US30", dir: "SELL", spread: Math.abs(s) });

    return sigs.sort((a, b) => b.spread - a.spread);
  }, [scores]);

  const handleAutoPlan = () => {
    if (generatedSignals.length === 0) {
      setFinalBias("NEUTRAL");
      setScriptPlan(`[SYSTEM GENERATED SCRIPT]\nMacro Phase: ${global.macro_phase}\nNo significant quantitative divergence detected (Spread < 3). Maintain capital preservation.`);
      return toast.success("Quant Script Generated: NEUTRAL");
    }

    const topSignal = generatedSignals[0];
    setFinalBias(`${topSignal.dir} ${topSignal.pair}`);
    
    const plan = `[SYSTEM GENERATED SCRIPT]\nMacro Phase: ${global.macro_phase} | Risk Sentiment: ${global.risk}\nFED Posture: ${banks.FED.stance} (${banks.FED.tone})\n\nQUANTITATIVE DIRECTIVE:\n- Execute ${topSignal.dir} on ${topSignal.pair} (Spread Advantage: +${topSignal.spread}).\n- Monitor structural breaks on HTF.\n- Algorithmic clearance granted.`;
    setScriptPlan(plan);
    toast.success("Quantitative Script Generated.");
  };

  const launchScenario = (sig: any) => {
    if (!onSendToScenario) return toast.error("Routing engine disconnected.");
    
    // Đóng gói đạn dược ném sang Scenario
    onSendToScenario({
      pair: sig.pair,
      direction: sig.dir,
      reason: `Macro Arbitrage: Spread +${sig.spread}`,
      tags: ["Macro_Aligned", global.macro_phase]
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <Toaster position="top-right" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: 900 }}>MACROECONOMIC OUTLOOK & BIAS</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>TRADING WEEK:</span>
            <input type="date" value={currentWeek} onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setCurrentWeek(getMonday(d)); }} style={{ border: 'none', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', outline: 'none', cursor: 'pointer', color: '#334155' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleReset} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><RotateCcw size={16} /> RESET MATRIX</button>
          <button onClick={handleSave} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Save size={16} /> SYNC TO NODE</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* COL 1: FUNDAMENTAL MATRIX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><Globe size={18} color="#2563eb"/> 1. GLOBAL REGIME</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>RISK SENTIMENT</label><select value={global.risk} onChange={e => setGlobal({...global, risk: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}><option>Risk-On</option><option>Risk-Off</option><option>Mixed</option></select></div>
              <div><label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>MACRO PHASE</label><select value={global.macro_phase} onChange={e => setGlobal({...global, macro_phase: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}><option>Expansion</option><option>Slowdown</option><option>Recession</option><option>Recovery</option></select></div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><Landmark size={18} color="#dc2626"/> 2. CENTRAL BANK DIVERGENCE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['FED', 'ECB', 'BOE', 'BOJ'].map(cb => (
                <div key={cb} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 900, color: '#334155', marginBottom: '8px' }}>{cb}</div>
                  <select value={banks[cb].stance} onChange={e => setBanks({...banks, [cb]: {...banks[cb], stance: e.target.value}})} style={{ width: '100%', padding: '4px', fontSize: '11px', marginBottom: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}><option>Tightening</option><option>Hold</option><option>Easing</option></select>
                  <select value={banks[cb].tone} onChange={e => setBanks({...banks, [cb]: {...banks[cb], tone: e.target.value}})} style={{ width: '100%', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}><option>Hawkish</option><option>Neutral</option><option>Dovish</option></select>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #3b82f6', boxShadow: '0 4px 15px rgba(59,130,246,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><Brain size={18} /> 3. QUANTITATIVE SCORE MATRIX (-5 to +5)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {Object.keys(scores).map(asset => (
                <div key={asset} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontWeight: 900, fontSize: '14px', color: '#1e3a8a' }}>{asset}</span>
                  <input type="number" value={scores[asset]} onChange={e => setScores({...scores, [asset]: Number(e.target.value)})} style={{ width: '60px', textAlign: 'center', padding: '8px', fontSize: '18px', fontWeight: '900', border: 'none', background: 'transparent', color: scores[asset] > 0 ? '#16a34a' : (scores[asset] < 0 ? '#dc2626' : '#64748b'), outline: 'none' }} />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COL 2: EXECUTION PLAN & ARBITRAGE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* HỆ THỐNG PHÁT HIỆN CƠ HỘI */}
          <div style={{ background: generatedSignals.length > 0 ? '#f0fdf4' : 'white', padding: '20px', borderRadius: '12px', border: generatedSignals.length > 0 ? '2px solid #22c55e' : '1px solid #e2e8f0', transition: 'all 0.3s' }}>
            <h3 style={{ marginTop: 0, color: generatedSignals.length > 0 ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
              <Zap size={18} /> MACRO ARBITRAGE OPPORTUNITIES
            </h3>
            
            {generatedSignals.length === 0 ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No significant divergence detected (Spread &lt; 3). Adjust scores in Matrix to identify opportunities.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedSignals.map((sig, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '8px', border: '1px solid #bbf7d0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '12px', background: sig.dir === 'BUY' ? '#dcfce7' : '#fee2e2', color: sig.dir === 'BUY' ? '#166534' : '#991b1b' }}>{sig.dir}</span>
                      <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>{sig.pair}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>Spread +{sig.spread}</span>
                    </div>
                    <button onClick={() => launchScenario(sig)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      INITIALIZE <Send size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}><Layers size={18}/> FINAL EXECUTION PROTOCOL</h3>
              <button onClick={handleAutoPlan} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}><Wand2 size={14} /> ALGO-GENERATE</button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>VECTOR BIAS</label>
              <input value={finalBias} onChange={e => setFinalBias(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '16px', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', outline: 'none' }} placeholder="e.g., BULLISH XAUUSD" />
            </div>

            <div style={{ marginBottom: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>QUANTITATIVE SCRIPT</label>
              <textarea value={scriptPlan} onChange={e => setScriptPlan(e.target.value)} style={{ width: '100%', flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '13px', color: '#1e3a8a', fontFamily: 'monospace', resize: 'none', outline: 'none' }} placeholder="Execution parameters..." />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>TECHNICAL CONFLUENCE</label>
              <textarea value={taBias} onChange={e => setTaBias(e.target.value)} style={{ width: '100%', flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '13px', color: '#1e3a8a', fontFamily: 'inherit', resize: 'none', outline: 'none' }} placeholder="Price action parameters..." />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}