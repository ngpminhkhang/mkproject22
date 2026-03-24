import React, { useState, useEffect } from "react";
import { Save, Globe, RotateCcw, DollarSign, Brain, Landmark, ArrowRightCircle, Layers, CheckCircle2, Wand2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface GlobalRegime {
    risk: 'Risk-On' | 'Risk-Off' | 'Mixed';
    liquidity: 'Tightening' | 'Neutral' | 'Easing';
    volatility: 'Normal' | 'Elevated' | 'Extreme';
    macro_phase: 'Expansion' | 'Slowdown' | 'Recession' | 'Recovery';
}

interface CentralBank {
    id: string;
    stance: 'Tightening' | 'Hold' | 'Easing' | 'Neutral';
    tone: 'Hawkish' | 'Neutral' | 'Dovish';
    gap: 'Market Ahead' | 'Aligned' | 'CB Ahead';
}

interface MacroPressure {
    usd_structural: 'Bullish' | 'Neutral' | 'Bearish';
    commodity: 'Support FX' | 'Neutral' | 'Weighs FX';
    yield_bias: 'USD Advantage' | 'Neutral' | 'Non-USD Adv';
}

interface CurrencyScores { [key: string]: number; }

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'BTC'];
const BANKS = ['FED', 'ECB', 'BOJ', 'BOE', 'RBA', 'RBNZ', 'BOC', 'SNB'];

export default function WeeklyForm({ accountId = 1 }: { accountId?: number }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getMondayLocal = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };

    const [date, setDate] = useState(getMondayLocal(new Date()));
    const [global, setGlobal] = useState<GlobalRegime>({ risk: 'Mixed', liquidity: 'Neutral', volatility: 'Normal', macro_phase: 'Slowdown' });
    const [banks, setBanks] = useState<Record<string, CentralBank>>(() => {
        const init: any = {};
        BANKS.forEach(b => init[b] = { id: b, stance: 'Hold', tone: 'Neutral', gap: 'Aligned' });
        return init;
    });
    const [macro, setMacro] = useState<MacroPressure>({ usd_structural: 'Neutral', commodity: 'Neutral', yield_bias: 'Neutral' });
    const [scores, setScores] = useState<CurrencyScores>({ USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, NZD: 0, CAD: 0, CHF: 0, BTC: 0 });
    const [plannedPairs, setPlannedPairs] = useState<string[]>([]);
    const [faNotes, setFaNotes] = useState("");
    const [scriptPlan, setScriptPlan] = useState("");

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const [y, m, d] = e.target.value.split('-').map(Number);
        const selected = new Date(y, m - 1, d);
        setDate(getMondayLocal(selected));
    };

    const loadData = async () => {
        try {
            const res = await fetch(`https://mk-project19-1.onrender.com/api/outlook/current/?week_start=${date}`);
            const data = await res.json();
            
            if (res.ok && !data.error) {
                try {
                    const fa = JSON.parse(data.fa_bias || "{}");
                    if (fa.global) setGlobal({ ...global, ...fa.global });
                    if (fa.banks) setBanks(fa.banks);
                    if (fa.macro) setMacro({ ...macro, ...fa.macro });
                    if (fa.scores) setScores(fa.scores);
                    if (fa.planned) setPlannedPairs(fa.planned);
                    setFaNotes(fa.notes || "");
                } catch (err) { console.error("JSON Parse Error:", err); }
                
                setScriptPlan(data.execution_script || "");
                toast.success("Hải Đăng đồng bộ thành công!");
            } else {
                handleReset(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { loadData(); }, [date, accountId]);

    const handleReset = (showToast = true) => {
        setGlobal({ risk: 'Mixed', liquidity: 'Neutral', volatility: 'Normal', macro_phase: 'Slowdown' });
        const initBanks: any = {};
        BANKS.forEach(b => initBanks[b] = { id: b, stance: 'Hold', tone: 'Neutral', gap: 'Aligned' });
        setBanks(initBanks);
        setMacro({ usd_structural: 'Neutral', commodity: 'Neutral', yield_bias: 'Neutral' });
        setScores({ USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, NZD: 0, CAD: 0, CHF: 0, BTC: 0 });
        setPlannedPairs([]);
        setFaNotes("");
        setScriptPlan("");
        if (showToast) toast.success("Đã Reset Form!");
    };

    const calculateMatrix = () => {
        const pairs = [
            { pair: 'EUR/USD', base: 'EUR', quote: 'USD' }, { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
            { pair: 'USD/JPY', base: 'USD', quote: 'JPY' }, { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
            { pair: 'USD/CAD', base: 'USD', quote: 'CAD' }, { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
            { pair: 'NZD/USD', base: 'NZD', quote: 'USD' }, { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
            { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY' }, { pair: 'XAU/USD', base: 'GOLD', quote: 'USD' },
            { pair: 'BITCOIN', base: 'BTC', quote: 'USD' }
        ];
        const goldScore = (global.risk === 'Risk-Off' ? 2 : 0) + (macro.yield_bias === 'Non-USD Adv' ? 1 : 0);
        const btcScore = (scores['BTC'] || 0) + (global.risk === 'Risk-On' ? 2 : 0) + (global.liquidity === 'Easing' ? 1 : 0);
        const currentScores: { [key: string]: number } = { ...scores, GOLD: goldScore, BTC: btcScore };
        return pairs.map(p => {
            const score = (currentScores[p.base] || 0) - (currentScores[p.quote] || 0);
            let bias = "Neutral";
            let color = "#64748b";
            let dir = "";
            if (score >= 2) { bias = "BUY"; color = "#16a34a"; dir = "Long"; }
            else if (score <= -2) { bias = "SELL"; color = "#dc2626"; dir = "Short"; }
            return { ...p, score, bias, color, dir };
        }).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    };

    const matrix = calculateMatrix();

    const togglePlan = (pair: string, dir: string, score: number) => {
        if (!dir) return;
        const key = `${pair}|${dir}|${score}`;
        let newPlan = [...plannedPairs];
        if (newPlan.some(p => p.startsWith(pair))) {
            newPlan = newPlan.filter(p => !p.startsWith(pair));
        } else {
            newPlan.push(key);
        }
        setPlannedPairs(newPlan);
    };

    const handleAutoPlan = () => {
        if (plannedPairs.length === 0) return toast.error("Chọn ít nhất 1 cặp trong Matrix để lên kế hoạch!");
        const biasLabel = global.risk === 'Risk-On' ? 'BULLISH (Risk-On)' : (global.risk === 'Risk-Off' ? 'BEARISH (Risk-Off)' : 'NEUTRAL (Mixed)');
        const usdStatus = macro.usd_structural;
        let text = `PLAN TUẦN: ${date}\n====================\n`;
        text += `TRẠNG THÁI: ${biasLabel}\nTHANH KHOẢN: ${global.liquidity} | USD: ${usdStatus}\n\nDANH SÁCH TRỌNG TÂM:\n`;
        plannedPairs.forEach(p => {
            const [pair, dir, score] = p.split('|');
            text += `- ${pair} : ${dir.toUpperCase()} (Score: ${score})\n Kế hoạch: [Chờ Pullback H4 / Breakout...]\n\n`;
        });
        text += `GHI CHÚ CHUNG:\n- Tập trung vào các cặp có điểm số tuyệt đối >= 2.\n- Cẩn thận tin tức từ NHTW có Gap "Market Ahead".`;
        setScriptPlan(text);
        toast.success("Đã tạo mẫu kế hoạch chuẩn!");
    };

    const handleSave = async () => {
        try {
            const payload = {
                week_start: date, 
                market_sentiment: global.risk,
                weekly_bias: global.risk === 'Risk-On' ? 'BULLISH' : (global.risk === 'Risk-Off' ? 'BEARISH' : 'NEUTRAL'),
                execution_script: scriptPlan,
                fa_bias: JSON.stringify({ global, banks, macro, scores, planned: plannedPairs, notes: faNotes })
            };
            const res = await fetch("https://mk-project19-1.onrender.com/api/outlook/sync/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) toast.success(`Đã khóa Két Sắt Tuần: ${date}`);
            else toast.error("Đứt cáp quang. Lưu thất bại.");
        } catch (e) { toast.error("Error: " + String(e)); }
    };

    const updateBank = (id: string, field: keyof CentralBank, val: string) => {
        setBanks(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    };

    const getColor = (val: string | undefined) => {
        if (!val) return '#334155';
        if (['Risk-On', 'Easing', 'Expansion', 'Recovery', 'Normal', 'Hawkish', 'Bullish', 'Support FX', 'USD Advantage', 'CB Ahead'].includes(val)) return '#16a34a';
        if (['Risk-Off', 'Tightening', 'Recession', 'Slowdown', 'Extreme', 'Dovish', 'Bearish', 'Weighs FX', 'Market Ahead', 'Non-USD Adv'].includes(val)) return '#dc2626';
        if (['Elevated', 'Mixed'].includes(val)) return '#d97706';
        return '#334155';
    };

    const cardStyle: React.CSSProperties = { padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '20px' };
    const headerStyle: React.CSSProperties = { margin: '0 0 15px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };

    return (
        <div style={{ padding: isMobile ? '16px 10px' : '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '20px', gap: '12px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>Weekly Outlook</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Institutional Regime & Matrix</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                    <input type="date" style={{ flex: isMobile ? 1 : 'none', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', outline: 'none' }} value={date} onChange={handleDateChange} />
                    <button onClick={() => handleReset(true)} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', outline: 'none' }}>
                        <RotateCcw size={18} /> {!isMobile && 'Reset'}
                    </button>
                    <button onClick={handleSave} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', outline: 'none' }}>
                        <Save size={18} /> {!isMobile && 'SYNC TO NODE'}
                    </button>
                </div>
            </div>

            {/* DÙNG LẠI CHUẨN GRID 1.3fr VÀ 1fr, TỰ ĐỘNG GẬP TRÊN MOBILE */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '25px', alignItems: 'start' }}>
                
                {/* CỘT TRÁI */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={cardStyle}>
                        <h3 style={{ ...headerStyle, color: '#2563eb' }}><Globe size={18} /> 1. Global Regime & Macro</h3>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', display: 'block' }}>Market Driver (Risk Sentiment)</label>
                            <select value={global.risk} onChange={e => setGlobal({ ...global, risk: e.target.value as any })} style={{ width: '100%', color: getColor(global.risk), fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.4rem', textAlign: 'center', height: '50px', border: `2px solid ${getColor(global.risk)}`, borderRadius: '8px', background: 'white', cursor: 'pointer', outline: 'none' }}>
                                <option>Risk-On</option><option>Mixed</option><option>Risk-Off</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Liquidity</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(global.liquidity), fontWeight: 'bold', outline: 'none' }} value={global.liquidity} onChange={e => setGlobal({ ...global, liquidity: e.target.value as any })}><option>Tightening</option><option>Neutral</option><option>Easing</option></select></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Volatility</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(global.volatility), fontWeight: 'bold', outline: 'none' }} value={global.volatility} onChange={e => setGlobal({ ...global, volatility: e.target.value as any })}><option>Normal</option><option>Elevated</option><option>Extreme</option></select></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Macro Phase</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(global.macro_phase), fontWeight: 'bold', outline: 'none' }} value={global.macro_phase} onChange={e => setGlobal({ ...global, macro_phase: e.target.value as any })}><option>Expansion</option><option>Slowdown</option><option>Recession</option><option>Recovery</option></select></div>
                            <div style={{ gridColumn: '1/-1', borderTop: '1px dashed #e2e8f0', margin: '5px 0' }}></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>USD Struct</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(macro.usd_structural), fontWeight: 'bold', outline: 'none' }} value={macro.usd_structural} onChange={e => setMacro({ ...macro, usd_structural: e.target.value as any })}><option>Bullish</option><option>Neutral</option><option>Bearish</option></select></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Yield Bias</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(macro.yield_bias), fontWeight: 'bold', outline: 'none' }} value={macro.yield_bias} onChange={e => setMacro({ ...macro, yield_bias: e.target.value as any })}><option>USD Advantage</option><option>Neutral</option><option>Non-USD Adv</option></select></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Commodity</label><select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: getColor(macro.commodity), fontWeight: 'bold', outline: 'none' }} value={macro.commodity} onChange={e => setMacro({ ...macro, commodity: e.target.value as any })}><option>Support FX</option><option>Neutral</option><option>Weighs FX</option></select></div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ ...headerStyle, color: '#0891b2' }}><Landmark size={18} /> 2. Central Bank Landscape</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '8px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold', borderBottom: '2px solid #f1f5f9', paddingBottom: '5px', marginBottom: '5px', color: '#64748b' }}>
                                <div>ID</div><div>Stance</div><div>Tone</div><div>Market Gap</div>
                            </div>
                            {BANKS.map(id => (
                                <div key={id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px dashed #f8fafc' }}>
                                    <div style={{ fontWeight: '900', color: '#334155', fontSize: '0.85rem' }}>{id}</div>
                                    <select style={{ padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: getColor(banks[id].stance), fontWeight: 'bold', outline: 'none' }} value={banks[id].stance} onChange={e => updateBank(id, 'stance', e.target.value)}><option>Tightening</option><option>Hold</option><option>Easing</option><option>Neutral</option></select>
                                    <select style={{ padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: getColor(banks[id].tone), fontWeight: 'bold', outline: 'none' }} value={banks[id].tone} onChange={e => updateBank(id, 'tone', e.target.value)}><option>Hawkish</option><option>Neutral</option><option>Dovish</option></select>
                                    <select style={{ padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: getColor(banks[id].gap), fontWeight: 'bold', outline: 'none' }} value={banks[id].gap} onChange={e => updateBank(id, 'gap', e.target.value)}><option>CB Ahead</option><option>Aligned</option><option>Market Ahead</option></select>
                                </div>
                            ))}
                        </div>
                        <textarea style={{ width: '100%', marginTop: '10px', height: '60px', fontSize: '0.85rem', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical' }} placeholder="Ghi chú: Sự phân kỳ chính sách (Divergence) ở đâu?..." value={faNotes} onChange={e => setFaNotes(e.target.value)} />
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ ...cardStyle, background: '#fff7ed', borderColor: '#fed7aa' }}>
                        <h3 style={{ ...headerStyle, color: '#c2410c' }}><DollarSign size={18} /> 3. Currency Scoreboard</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px 20px' }}>
                            {CURRENCIES.map(curr => (
                                <div key={curr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '35px' }}>{curr}</span>
                                    <input type="range" min="-3" max="3" step="1" value={scores[curr]} onChange={e => setScores({ ...scores, [curr]: Number(e.target.value) })} style={{ flex: 1, margin: '0 10px', height: '6px', cursor: 'pointer', accentColor: '#c2410c' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', width: '20px', textAlign: 'right', color: scores[curr] > 0 ? 'green' : (scores[curr] < 0 ? 'red' : '#64748b') }}>
                                        {scores[curr] > 0 ? `+${scores[curr]}` : scores[curr]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ ...cardStyle, background: '#f0fdf4', borderColor: '#bbf7d0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h3 style={{ ...headerStyle, margin: 0, color: '#15803d' }}><Brain size={18} /> 4. The Matrix</h3>
                            <span style={{ fontSize: '0.75rem', color: '#166534', fontStyle: 'italic' }}>Click to Plan</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #dcfce7', marginBottom: '5px' }}>
                            <div>PAIR</div><div>SCORE</div><div>BIAS</div><div>PLAN</div>
                        </div>
                        <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
                            {matrix.filter(m => Math.abs(m.score) >= 1).map(m => {
                                const isPlanned = plannedPairs.some(p => p.startsWith(m.pair));
                                return (
                                    <div key={m.pair} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr', alignItems: 'center', marginBottom: '6px', padding: '6px 10px', background: 'white', borderRadius: '6px', border: isPlanned ? '2px solid #22c55e' : '1px solid #dcfce7', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                        <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{m.pair}</div>
                                        <div style={{ fontWeight: 'bold', color: m.score > 0 ? 'green' : 'red', fontSize: '0.9rem' }}>{m.score > 0 ? '+' : ""}{m.score}</div>
                                        <div><span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'white', background: m.color, padding: '2px 6px', borderRadius: '4px' }}>{m.bias}</span></div>
                                        <div style={{ textAlign: 'right' }}>
                                            <button onClick={() => togglePlan(m.pair, m.dir, m.score)} title={isPlanned ? "Remove from Plan" : "Add to Scenario"} style={{ background: isPlanned ? '#22c55e' : '#f1f5f9', color: isPlanned ? 'white' : '#cbd5e1', width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                                                {isPlanned ? <CheckCircle2 size={16} /> : <ArrowRightCircle size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                            {matrix.filter(m => Math.abs(m.score) >= 1).length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>Thị trường đi ngang.</div>}
                        </div>
                    </div>

                    <div style={{ ...cardStyle, borderLeft: '4px solid #2563eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h3 style={{ ...headerStyle, margin: 0, color: '#1e40af' }}><Layers size={18} /> 5. Technical & Final Plan</h3>
                            <button onClick={handleAutoPlan} title="Auto-Write Plan based on Matrix" style={{ color: '#7c3aed', background: '#f3e8ff', border: 'none', borderRadius: '12px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', outline: 'none' }}>
                                <Wand2 size={14} /> Auto-Write
                            </button>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af' }}>Weekly Bias:</span>
                            <strong style={{ color: global.risk === 'Risk-On' ? 'green' : (global.risk === 'Risk-Off' ? 'red' : '#d97706') }}>
                                {global.risk === 'Risk-On' ? 'BULLISH' : (global.risk === 'Risk-Off' ? 'BEARISH' : 'NEUTRAL')}
                            </strong>
                        </div>
                        <textarea style={{ width: '100%', height: '150px', fontFamily: 'monospace', fontSize: '0.85rem', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} placeholder="Bấm nút đũa thần để tự động viết kế hoạch..." value={scriptPlan} onChange={e => setScriptPlan(e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );
}