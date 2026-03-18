import { useState, useEffect, useMemo } from "react";
import {
  Save, RefreshCw, Plus, Trash2, Camera, Search, X, Brain, Edit3, Lightbulb, AlertTriangle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_HABITS = { sleep: false, meditate: false, checklist: false, workout: false };
const DEFAULT_DETAILS = { stress: 5, focus: 5, discipline: 5, journal_narrative: "", habits: DEFAULT_HABITS, psy_notes: [] };
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function SafeImage({ path, onClick, style }: any) {
  if (!path || path === "[]" || path === '""') return <div style={{ ...style, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#cbd5e1' }}>No Img</div>;
  return <img src={path} style={style} onClick={onClick} alt="img" />;
}

const safeJSONParse = (str: string, fallback: any) => {
  if (!str) return fallback;
  try { return JSON.parse(str) || fallback; } catch (e) { return fallback; }
};

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

export default function WeeklyReviewHub({ accountId }: { accountId: number }) {
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [activeTab, setActiveTab] = useState("fusion");
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [trades, setTrades] = useState<any[]>([]);
  const [missedTrades, setMissedTrades] = useState<any[]>([]);
  const [setups, setSetups] = useState<any[]>([]);
  
  const [outlookSnapshot, setOutlookSnapshot] = useState<{ bias: string, plan: string, technical: string, matrix: any[] }>({ bias: '...', plan: '...', technical: '...', matrix: [] });
  const [faScore, setFaScore] = useState(5);
  const [taScore, setTaScore] = useState(5);
  const [fusionScore, setFusionScore] = useState(5);
  const [details, setDetails] = useState<any>(DEFAULT_DETAILS);

  const [showMissedForm, setShowMissedForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [missedForm, setMissedForm] = useState<any>({ pair: "EURUSD", direction: "BUY", setup_type: "", missed_date: currentWeek, reason: "Hesitation", notes: "", image_paths: "[]" });

  const [showPsyForm, setShowPsyForm] = useState(false);
  const [editingPsyItem, setEditingPsyItem] = useState<any | null>(null);
  const [psyForm, setPsyForm] = useState({ emotion: "Normal", context: "Pre-Trade", note: "" });

  const loadWeeklyData = async () => {
    setIsLoading(true);
    try {
      const [allScenariosRes, setupsRes, reviewDataRes, missedDataRes] = await Promise.all([
        fetch(`https://mk-project19-1.onrender.com/api/journal/trades/?accountId=${accountId}&outcome=ALL`).then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=SETUP').then(r => r.json()),
        fetch(`https://mk-project19-1.onrender.com/api/review/data/?accountId=${accountId}&weekStart=${currentWeek}`).then(r => r.json()),
        fetch(`https://mk-project19-1.onrender.com/api/review/missed/?accountId=${accountId}&weekStart=${currentWeek}`).then(r => r.json())
      ]);

      const allScenarios = Array.isArray(allScenariosRes) ? allScenariosRes : [];
      
      const closedList = allScenarios.filter((x: any) => x.status === 'CLOSED').map((x: any) => {
        let m = 'None';
        try {
          const rd = safeJSONParse(x.review_data, {});
          if (rd.mistakes && Array.isArray(rd.mistakes) && rd.mistakes.length > 0) m = rd.mistakes[0];
        } catch {}
        return { ...x, outcome: x.pnl > 0 ? 'win' : 'loss', mistake: m, pnl: Number(x.pnl) || 0 };
      });
      setTrades(closedList);

      const autoMissed = allScenarios.filter((x: any) => x.status === 'MISSED' || x.status === 'CANCELLED').map((x: any) => ({
        uuid: x.uuid, pair: x.pair, direction: x.direction, reason: x.status,
        notes: x.analysis_details || "", images: x.images, created_at: x.created_at, source_type: 'scenario'
      }));
      
      const manualMissed = Array.isArray(missedDataRes) ? missedDataRes.map((m: any) => ({ ...m, source_type: 'manual' })) : [];
      setMissedTrades([...autoMissed, ...manualMissed].sort((a: any, b: any) => b.created_at - a.created_at));

      setSetups(Array.isArray(setupsRes) ? setupsRes : []);

      if (reviewDataRes.review) {
        const rev = reviewDataRes.review;
        setFaScore(rev.fa_accuracy || 5); setTaScore(rev.ta_accuracy || 5); setFusionScore(rev.fusion_score || 5);
        const parsedDetails = safeJSONParse(rev.review_details, DEFAULT_DETAILS);
        setDetails({...DEFAULT_DETAILS, ...parsedDetails, habits: { ...DEFAULT_HABITS, ...(parsedDetails.habits || {}) }, psy_notes: parsedDetails.psy_notes || [] });
      } else {
        setFaScore(5); setTaScore(5); setFusionScore(5); setDetails(DEFAULT_DETAILS);
      }

      if (reviewDataRes.outlook) {
        const out = reviewDataRes.outlook;
        const fa = safeJSONParse(out.fa_bias, {});
        setOutlookSnapshot({ bias: out.final_bias || "NEUTRAL", plan: out.script_plan || "", technical: out.ta_bias || "", matrix: Array.isArray(fa.planned) ? fa.planned : [] });
      } else {
        setOutlookSnapshot({ bias: "NO DATA", plan: "", technical: "", matrix: [] });
      }

    } catch (e) { toast.error("Data fetch failed: " + String(e)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadWeeklyData(); }, [currentWeek, accountId]);

  const handleSaveReview = async () => {
    try {
      const wins = trades.filter(t => t.outcome === 'win').length;
      const netPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
      
      const payload = {
        accountId,
        weekStart: currentWeek,
        review: {
          total_trades: trades.length,
          win_rate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
          net_pnl: netPnl, fa_accuracy: faScore, ta_accuracy: taScore, fusion_score: fusionScore,
          review_details: JSON.stringify(details)
        },
        outlook: {
          final_bias: outlookSnapshot.bias, script_plan: outlookSnapshot.plan, ta_bias: outlookSnapshot.technical,
          fa_bias: JSON.stringify({ planned: outlookSnapshot.matrix })
        }
      };

      const res = await fetch("https://mk-project19-1.onrender.com/api/review/save/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error("API Save Error");
      toast.success("Performance Data Synchronized!");
    } catch (e) { toast.error("Sync error: " + e); }
  };

  const handleSavePsyNote = () => {
    if (!psyForm.note) return toast.error("Input required.");
    let updatedNotes = [...(details.psy_notes || [])];
    if (editingPsyItem) {
      updatedNotes = updatedNotes.map((n: any) => n.id === editingPsyItem.id ? { ...n, ...psyForm } : n);
      toast.success("Log Updated!");
    } else {
      const newNote = { id: Date.now(), ...psyForm, timestamp: Date.now() };
      updatedNotes = [newNote, ...updatedNotes];
      toast.success("Log Appended!");
    }
    setDetails((prev: any) => ({ ...prev, psy_notes: updatedNotes }));
    setPsyForm({ emotion: "Normal", context: "Pre-Trade", note: "" }); setShowPsyForm(false); setEditingPsyItem(null);
  };

  const handleEditPsyNote = (note: any) => { setEditingPsyItem(note); setPsyForm({ emotion: note.emotion, context: note.context || "Pre-Trade", note: note.note }); setShowPsyForm(true); };
  const handleDeletePsyNote = (id: number) => { if (!confirm("Delete this entry?")) return; setDetails((prev: any) => ({ ...prev, psy_notes: (details.psy_notes || []).filter((n: any) => n.id !== id) })); toast.success("Entry Deleted!"); };

  const handleEditMissed = (item: any) => { 
    setMissedForm({ pair: item.pair, direction: item.direction, reason: item.reason, notes: item.notes || item.analysis_details, image_paths: item.image_paths || item.images, setup_type: "", missed_date: currentWeek });
    setEditingItem(item); setShowMissedForm(true); 
  };

  const saveMissedTrade = async () => {
    try {
      if (editingItem && editingItem.source_type === 'scenario') {
        const payload = { input: { uuid: editingItem.uuid, analysis: missedForm.notes, images: missedForm.image_paths } };
        await fetch("https://mk-project19-1.onrender.com/api/scenarios/update/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Scenario Notes Updated!");
      } else {
        const payload = { uuid: editingItem ? editingItem.uuid : null, accountId, weekStart: currentWeek, pair: missedForm.pair, direction: missedForm.direction, reason: missedForm.reason, notes: missedForm.notes, images: missedForm.image_paths };
        await fetch("https://mk-project19-1.onrender.com/api/review/missed/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Manual Entry Logged!");
      }
      setShowMissedForm(false); setEditingItem(null); 
      setMissedForm({ pair: "EURUSD", direction: "BUY", setup_type: "", missed_date: currentWeek, reason: "Hesitation", notes: "", image_paths: "[]" });
      loadWeeklyData();
    } catch (e) { toast.error(String(e)); }
  };

  const deleteMissed = async (item: any) => { 
    if (!confirm("Confirm deletion?")) return; 
    try {
      if (item.source_type === 'scenario') {
        await fetch("https://mk-project19-1.onrender.com/api/scenarios/delete/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid: item.uuid }) });
      } else {
        await fetch("https://mk-project19-1.onrender.com/api/review/missed/", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid: item.uuid }) });
      }
      toast.success("Deleted"); loadWeeklyData(); 
    } catch(e) { toast.error(String(e)); }
  };

  const handlePickImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files);
      const promises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file as Blob);
        });
      });
      Promise.all(promises).then(base64Images => {
        let current = safeJSONParse(missedForm.image_paths || "[]", []);
        const updated = [...current, ...base64Images].slice(0, 2); 
        setMissedForm({ ...missedForm, image_paths: JSON.stringify(updated) });
      });
    };
    input.click();
  };

  const mistakeData = useMemo(() => {
    const data: { [key: string]: number } = {};
    trades.forEach(t => { if (t.mistake && t.mistake !== 'None' && t.pnl < 0) { if (!data[t.mistake]) data[t.mistake] = 0; data[t.mistake] += Math.abs(Number(t.pnl) || 0); } });
    return Object.keys(data).map(k => ({ name: k, value: data[k] }));
  }, [trades]);

  const setupData = useMemo(() => {
    if (!Array.isArray(setups)) return [];
    const data: { [key: string]: { pnl: number, count: number} } = {};
    trades.forEach(t => {
      const setupName = setups.find((s: any) => s.id === t.setup_id)?.title || "Discretionary";
      if (!data[setupName]) data[setupName] = { pnl: 0, count: 0 };
      data[setupName].pnl += (Number(t.pnl) || 0); data[setupName].count += 1;
    });
    return Object.keys(data).map(k => ({ name: k, pnl: data[k].pnl, count: data[k].count }));
  }, [trades, setups]);

  const missedAnalytics = useMemo(() => {
    if (missedTrades.length === 0) return null;
    const reasons: { [key: string]: number } = {}; const pairs: { [key: string]: number } = {};
    missedTrades.forEach(m => { reasons[m.reason] = (reasons[m.reason] || 0) + 1; pairs[m.pair] = (pairs[m.pair] || 0) + 1; });
    const sortedReasons = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
    let insight = "Aggregating node data...";
    if (sortedReasons[0]?.[0] === "Hesitation") insight = "Excessive hesitation detected. Algorithm recommends risk reduction.";
    else if (sortedReasons[0]?.[0] === "CANCELLED") insight = "High cancellation rate: Strict parameter adherence or excessive friction.";
    return { chartData: Object.keys(reasons).map(k => ({ name: k, count: reasons[k] })), insight };
  }, [missedTrades]);

  const psyAnalytics = useMemo(() => {
    const notes = details.psy_notes || []; if (!notes || notes.length === 0) return null;
    const emotions: { [key: string]: number } = {};
    notes.forEach((n: any) => { const e = n.emotion || "Normal"; emotions[e] = (emotions[e] || 0) + 1; });
    const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || "Normal";
    const hasRisk = (emotions["Angry"] || 0) > 0 || (emotions["Anxious"] || 0) > 2;
    const chartData = Object.keys(emotions).map(k => ({ name: k, value: emotions[k] }));
    return { chartData, dominantEmotion, hasRisk, total: notes.length, insight: hasRisk ? "TAIL RISK DETECTED: Negative psychological variance. Execution halt recommended." : "Baseline stable." };
  }, [details.psy_notes]);

  const totalPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const winRate = trades.length > 0 ? ((trades.filter(t => t.outcome === 'win').length/trades.length) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "20px", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", backgroundColor: "#f1f5f9" }}>
      <Toaster position="top-right" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div><h1 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>WEEKLY PERFORMANCE REVIEW</h1><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}> Algorithmic vs Discretionary Variance</p></div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>START DATE:</span>
            <input type="date" value={currentWeek} onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setCurrentWeek(getMonday(d)); }} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }} />
          </div>
          <button onClick={loadWeeklyData} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><RefreshCw size={18} /></button>
          <button onClick={handleSaveReview} style={{background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Save size={18} /> Sync Data</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '20px' }}>
        {['fusion', 'deep-dive', 'missed', 'psychology'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: activeTab === tab ? '#2563eb' : '#64748b', borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent', textTransform: 'uppercase', fontSize: '13px' }}>{tab.replace('-', ' ')}</button>
        ))}
      </div>
      {isLoading ? <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Aggregating Weekly Datasets...</div>:(
        <>
          {activeTab === 'fusion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e40af', fontSize: '14px', display: 'flex', gap: '5px', alignItems: 'center' }}><Search size={16} /> MACRO OUTLOOK & BIAS</h3>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>{outlookSnapshot.bias}</span>
                  </div>
                  <div style={{ marginBottom: '10px' }}><div style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>TECHNICAL CONFLUENCE ZONE</div><textarea value={outlookSnapshot.technical} onChange={e => setOutlookSnapshot({ ...outlookSnapshot, technical: e.target.value })} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#334155', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Define technical framework..." /></div>
                  <div><div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>ALGORITHMIC EXECUTION SCRIPT</div><textarea value={outlookSnapshot.plan} onChange={e => setOutlookSnapshot({ ...outlookSnapshot, plan: e.target.value })} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#334155', fontFamily: 'monospace', resize: 'vertical' }} placeholder="Define entry parameters..." /></div>
                </div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: 1}}><h3 style={{ marginTop: 0, fontSize: '14px', color: '#d97706', marginBottom: '10px' }}>POST-MARKET NARRATIVE</h3><textarea value={details.journal_narrative} onChange={e => setDetails({...details, journal_narrative: e.target.value })} style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'none' }} placeholder="Input weekly institutional summary..." /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                  <h3 style={{ margin: 0, color: '#15803d', fontSize: '14px', marginBottom: '10px' }}>QUANTITATIVE METRICS</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px' }}>NET PNL</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: Number(totalPnl) >= 0 ? '#16a34a' : '#dc2626'}}>{Number(totalPnl).toFixed(2)}$</div></div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px'}}>WINRATE</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{winRate}%</div></div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px' }}>SETTLED POSITIONS</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{trades.length}</div></div>
                  </div>
                </div>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: 1 }}>
                  <h3 style={{ marginTop: 0, fontSize: '14px', color: '#9333ea', marginBottom: '10px' }}>PERFORMANCE & DISCIPLINE SCORING</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>Fundamental Accuracy</label><b>{faScore}/10</b></div><input type="range" min="1" max="10" value={faScore} onChange={e => setFaScore(Number(e.target.value))} style={{ width: '100%' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>Technical Accuracy</label><b>{taScore}/10</b></div><input type="range" min="1" max="10" value={taScore} onChange={e => setTaScore(Number(e.target.value))} style={{ width: '100%' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>Execution Confluence</label><b>{fusionScore}/10</b></div><input type="range" min="1" max="10" value={fusionScore} onChange={e => setFusionScore(Number(e.target.value))} style={{ width: '100%' }} />
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '10px', marginTop: '5px' }}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>SYSTEM HABITS:</label><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '5px' }}>{Object.keys(details.habits || DEFAULT_HABITS).map(h => (<label key={h} style={{ display: 'flex', gap: '5px', fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={details.habits ? details.habits[h] : false} onChange={e => setDetails({ ...details, habits: {...(details.habits || DEFAULT_HABITS), [h]: e.target.checked } })} /><span style={{ textTransform: 'capitalize' }}>{h}</span></label>))}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'deep-dive' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', minHeight: '300px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: 0, marginBottom: '15px', color: '#dc2626', fontSize: '14px' }}>DRAWDOWN ATTRIBUTION ($)</h3>{mistakeData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><PieChart><Pie data={mistakeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{mistakeData.map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>) : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No Data</div>}</div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: 0, marginBottom: '15px', color: '#2563eb', fontSize: '14px' }}>PNL BY ENTRY MODEL</h3>{setupData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><BarChart data={setupData}><XAxis dataKey="name" style={{ fontSize: '10px' }} /><YAxis /><Tooltip /><Bar dataKey="pnl" fill="#10b981" /></BarChart></ResponsiveContainer>) : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No Data</div>}</div>
            </div>
          )}
          {activeTab === 'missed' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', overflow: 'hidden' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h3 style={{ margin: 0}}>Omitted / Cancelled Orders</h3><button onClick={() => { setMissedForm({ pair: "EURUSD", direction: "BUY", setup_type: "", missed_date: currentWeek, reason: "Hesitation", notes: "", image_paths: "[]" }); setEditingItem(null); setShowMissedForm(!showMissedForm) }} style={{ padding: '5px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}><Plus size={16} /> Manual Input</button></div>
                {showMissedForm && (
                  <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold', color: '#0369a1'}}><span>{editingItem ? "Update Protocol" : "Log Omission"}</span><button onClick={() => setShowMissedForm(false)} style={{background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}><input value={missedForm.pair} onChange={e => setMissedForm({...missedForm, pair: e.target.value })} placeholder="Asset" style={{ padding: '5px'}} disabled={!!editingItem} /><select value={missedForm.direction} onChange={e => setMissedForm({ ...missedForm, direction: e.target.value })} style={{ padding: '5px' }} disabled={!!editingItem && editingItem.source_type === 'scenario'}><option value="BUY">LONG</option><option value="SELL">SHORT</option></select></div>
                    <div style={{ marginBottom: '10px' }}><select value={missedForm.reason} onChange={e => setMissedForm({ ...missedForm, reason: e.target.value })} style={{ padding: '5px', width: '100%' }} disabled={!!editingItem && editingItem.source_type === 'scenario'}><option value="Hesitation">Hesitation</option><option value="Spread">Spread</option><option value="Away">Away</option><option value="Sleep">Sleep</option><option value="Setup Fail">Setup Fail</option><option value="Cancelled Plan">Cancelled Plan</option><option value="MISSED">Missed</option><option value="CANCELLED">Cancelled</option></select></div>
                    <input value={missedForm.notes} onChange={e => setMissedForm({ ...missedForm, notes: e.target.value})} placeholder="Input post-mortem logic..." style={{ width: '100%', padding: '5px', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><button onClick={handlePickImage} style={{ padding: '5px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}><Camera size={16} /></button><button onClick={saveMissedTrade} style={{ marginLeft: 'auto', background: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Commit</button></div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {missedTrades.map(m => (
                    <div key={m.uuid} style={{ padding: '10px', borderLeft: `4px solid ${m.source_type === 'manual' ? '#f97316' : '#64748b'}`, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{m.pair} <span style={{ fontSize: '11px', color: '#64748b' }}>({m.direction})</span></strong><div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{m.reason}</span><button onClick={() => handleEditMissed(m)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={14} /></button><button onClick={() => deleteMissed(m)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button></div></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{m.source_type === 'scenario' ? 'Auto (Node)' : 'Manual Input'}</div>
                      <div style={{ fontSize: '13px', fontStyle: 'italic', margin: '5px 0' }}>{m.notes || m.analysis_details || "No annotation."}</div>
                      <div style={{ display: 'flex', gap: '5px' }}>{(() => { try { return safeJSONParse(m.image_paths || m.images || "[]", []).map((p: string, idx: number) => <div key={idx} style={{ width: '40px', height: '30px', cursor: 'pointer' }} onClick={() => setViewImage(p)}><SafeImage path={p} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }} /></div>); } catch { return null; } })()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#c2410c' }}><Lightbulb size={20} /> Opportunity Cost</h3>
                {missedAnalytics ? (<><div><h4 style={{ fontSize: '12px', color: '#9a3412' }}>ATTRIBUTION</h4><ResponsiveContainer width="100%" height={150}><BarChart data={missedAnalytics.chartData} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} style={{ fontSize: '11px' }} /><Tooltip /><Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div><p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#431407' }}>"{missedAnalytics.insight}"</p></>) : <div>No Data</div>}
              </div>
            </div>
          )}
          {activeTab === 'psychology' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', overflow: 'hidden' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h3 style={{ margin: 0, color: '#9333ea' }}>BEHAVIORAL ANALYTICS</h3><button onClick={() => { setEditingPsyItem(null); setPsyForm({ emotion: "Normal", context: "Pre-Trade", note: "" }); setShowPsyForm(!showPsyForm); } } style={{ padding: '5px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16} /> Log State</button></div>
                {showPsyForm && (
                  <div style={{ background: '#faf5ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 12, fontWeight: 'bold', color: '#7e22ce' }}>{editingPsyItem ? "Update Variance" : "Log Psychological State"}</span><button onClick={() => setShowPsyForm(false)} style={{border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={14} /></button></div>
                    <select value={psyForm.emotion} onChange={e => setPsyForm({ ...psyForm, emotion: e.target.value})} style={{ padding: 5, marginRight: 10 }}><option>Normal</option><option>Anxious</option><option>Angry</option><option>Confident</option></select>
                    <input value={psyForm.note} onChange={e => setPsyForm({ ...psyForm, note: e.target.value })} placeholder="Internal dialogue..." style={{ padding: 5}} />
                    <button onClick={handleSavePsyNote} style={{ marginLeft: 10, cursor: 'pointer', background: '#9333ea', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4 }}>{editingPsyItem ? "Update" : "Append"}</button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {details.psy_notes?.map((n: any) => (
                    <div key={n.id} style={{ padding: '10px', borderLeft: '4px solid #9333ea', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 'bold', color: '#9333ea', fontSize: '13px' }}>{n.emotion}</div><div style={{ display: 'flex', gap: '5px' }}><button onClick={() => handleEditPsyNote(n)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb' }}><Edit3 size={14} /></button><button onClick={() => handleDeletePsyNote(n.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button></div></div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '5px' }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                <h3 style={{ margin: 0, color: '#7e22ce', display: 'flex', gap: '10px', alignItems: 'center' }}><Brain size={20} /> EMOTIONAL QUOTIENT (EQ) METRICS</h3>
                {psyAnalytics ? (
                  <>
                    <div style={{ flex: 1, minHeight: '150px', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%"><PieChart key={psyAnalytics.total + Math.random()}><Pie data={psyAnalytics.chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{psyAnalytics.chartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce' }}>{psyAnalytics.total}</div><div style={{ fontSize: '10px', color: '#a855f7' }}>Entries</div></div>
                    </div>
                    {psyAnalytics.hasRisk && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}><AlertTriangle size={20} color="#dc2626" /><div><div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '12px' }}>TAIL RISK DETECTED</div><div style={{ fontSize: '11px', color: '#991b1b' }}>Negative psychological variance. Execution halt recommended.</div></div></div>)}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}><div style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #f3e8ff' }}><div style={{ fontSize: '11px', color: '#6b21a8' }}>DOMINANT VECTOR</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7e22ce' }}>{psyAnalytics.dominantEmotion}</div></div></div>
                  </>
                ) : <div style={{ textAlign: 'center', color: '#d8b4fe', marginTop: '50px' }}><Brain size={48} opacity={0.5} style={{ marginBottom: '10px' }} /><div>Insufficient behavioral data.</div></div>}
              </div>
            </div>
          )}
        </>
      )}
      {viewImage && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setViewImage(null)}><SafeImage path={viewImage} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }} onClick={(e: any) => e.stopPropagation()} /><button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setViewImage(null)}><X size={40} /></button></div>)}
    </div>
  );
}