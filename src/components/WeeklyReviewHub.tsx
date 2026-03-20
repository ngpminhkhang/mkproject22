import { useState, useEffect, useMemo } from "react";
import { Save, RefreshCw, Search, X, Brain, Edit3, Lightbulb, AlertTriangle, Plus, Trash2, Camera } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const DEFAULT_HABITS = { sleep: false, meditate: false, checklist: false, workout: false };
const DEFAULT_DETAILS = { stress: 5, focus: 5, discipline: 5, journal_narrative: "", habits: DEFAULT_HABITS, psy_notes: [] };
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// BỘ ĐỌC DỮ LIỆU ĐA TẦNG
const parseDeep = (val: any, fallback: any = {}): any => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === "" || trimmed === "[]" || trimmed === "{}") return fallback;
        try { const p = JSON.parse(trimmed); return typeof p === 'string' ? JSON.parse(p) : p; } catch (e) { return fallback; }
    }
    return fallback;
};
const ensureArray = (val: any) => Array.isArray(val) ? val : [];
const ensureObject = (val: any) => (typeof val === 'object' && val !== null && !Array.isArray(val)) ? val : {};

const extractNotesText = (raw: any) => {
    const parsed = parseDeep(raw);
    if (parsed && typeof parsed === 'object') { return parsed.notes || ""; }
    if (typeof parsed === 'string') return parsed;
    return "";
};

const inputStyleBase = { padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', flex: 1 };
const getMonday = (d: Date) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); date.setDate(diff); date.setHours(0, 0, 0, 0); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - (offset * 60000)).toISOString().split('T')[0]; };

const SafeImage = ({ path }: any) => {
    if (!path || path === "[]" || path === "") return <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '10px' }}>No Img</div>;
    return <img src={path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

export default function WeeklyReviewHub({ accountId = 1 }: { accountId?: number }) {
    const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
    const [activeTab, setActiveTab] = useState("fusion");
    const [isLoading, setIsLoading] = useState(false);

    const [trades, setTrades] = useState<any[]>([]);
    const [missedTrades, setMissedTrades] = useState<any[]>([]);
    const [setups, setSetups] = useState<any[]>([]);
    const [outlookSnapshot, setOutlookSnapshot] = useState<{ bias: string, plan: string, technical: string, matrix: any[] }>({ bias: '...', plan: '...', technical: '...', matrix: [] });

    const [faScore, setFaScore] = useState(5);
    const [taScore, setTaScore] = useState(5);
    const [fusionScore, setFusionScore] = useState(5);
    const [details, setDetails] = useState<any>(DEFAULT_DETAILS);

    const [showPsyForm, setShowPsyForm] = useState(false);
    const [editingPsyItem, setEditingPsyItem] = useState<any | null>(null);
    const [psyForm, setPsyForm] = useState({ emotion: "Normal", context: "Pre-Trade", note: "" });

    // STATE CHO FORM MISSED
    const [showMissedForm, setShowMissedForm] = useState(false);
    const [editingMissedItem, setEditingMissedItem] = useState<any | null>(null);
    const [missedForm, setMissedForm] = useState({ pair: "EURUSD", direction: "BUY", reason: "Hesitation", notes: "", image_paths: [] as string[] });
    const [showImgInput, setShowImgInput] = useState(false);
    const [tempImgLink, setTempImgLink] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        try {
            const baseUrl = "https://mk-project19-1.onrender.com/api";
            const scenRes = await fetch(`${baseUrl}/scenarios/?accountId=${accountId}&t=${Date.now()}`);
            const allScenarios = await scenRes.json();
            
            if (Array.isArray(allScenarios)) {
                const closedList = allScenarios.filter((x: any) => x.status === 'CLOSED' || x.status === 'ARCHIVED').map((x: any) => {
                    let m = 'None';
                    try { const rd = ensureObject(parseDeep(x.review_data)); if (rd.mistakes && Array.isArray(rd.mistakes) && rd.mistakes.length > 0) m = rd.mistakes[0]; } catch {}
                    return { ...x, outcome: x.pnl > 0 ? 'win' : 'loss', mistake: m, pnl: Number(x.pnl) || 0 };
                });
                setTrades(closedList);

                const autoMissed = allScenarios.filter((x: any) => ['MISSED', 'CANCELLED'].includes(x.status)).map((x: any) => {
                    return {
                        uuid: x.uuid, pair: x.pair, direction: x.direction, reason: x.status, 
                        notes: extractNotesText(x.analysis_details),
                        images: ensureArray(parseDeep(x.images, [])), 
                        created_at: x.created_at
                    };
                });
                setMissedTrades(autoMissed.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }

            const revRes = await fetch(`${baseUrl}/reviews/?week_start=${currentWeek}&t=${Date.now()}`);
            if (revRes.ok) {
                const rev = await revRes.json();
                if (rev.fa_accuracy) {
                    setFaScore(rev.fa_accuracy); setTaScore(rev.ta_accuracy); setFusionScore(rev.fusion_score);
                    const parsedDetails = ensureObject(parseDeep(rev.review_details, DEFAULT_DETAILS));
                    setDetails({ ...DEFAULT_DETAILS, ...parsedDetails, habits: { ...DEFAULT_HABITS, ...(parsedDetails.habits || {}) }, psy_notes: parsedDetails.psy_notes || [] });
                } else { setFaScore(5); setTaScore(5); setFusionScore(5); setDetails(DEFAULT_DETAILS); }
            }

            const outRes = await fetch(`${baseUrl}/outlook/current/?week_start=${currentWeek}&t=${Date.now()}`);
            if (outRes.ok) {
                const out = await outRes.json();
                if (!out.error) {
                    const fa = ensureObject(parseDeep(out.fa_bias, {}));
                    setOutlookSnapshot({ 
                        bias: out.weekly_bias || "NEUTRAL", 
                        plan: out.execution_script || "", 
                        technical: fa.technical_plan || "",
                        matrix: Array.isArray(fa.planned) ? fa.planned : [] 
                    });
                }
            }

            const libRes = await fetch(`${baseUrl}/library/?category=SETUP`);
            if (libRes.ok) setSetups(await libRes.json());

        } catch (e) { toast.error("Lỗi cáp quang: " + String(e)); }
        setIsLoading(false);
    };

    useEffect(() => { loadData(); }, [currentWeek, accountId]);

    const handleSaveReview = async () => {
        try {
            const wins = trades.filter(t => t.outcome === 'win').length;
            const netPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
            
            const payload = {
                week_start_date: currentWeek, account_id: accountId, total_trades: trades.length,
                win_rate: trades.length > 0 ? (wins / trades.length) * 100 : 0, net_pnl: netPnl,
                fa_accuracy: faScore, ta_accuracy: taScore, fusion_score: fusionScore,
                review_details: JSON.stringify(details)
            };

            await fetch("https://mk-project19-1.onrender.com/api/reviews/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

            toast.success("Hồ sơ thẩm vấn đã được cất vào két!");
        } catch (e) { toast.error("Cáp quang đứt: " + String(e)); }
    };

    // --- FORM XỬ LÝ MISSED/CANCEL ĐÚNG CHUẨN ---
    const openAddMissed = () => {
        setEditingMissedItem(null);
        setMissedForm({ pair: "EURUSD", direction: "BUY", reason: "Hesitation", notes: "", image_paths: [] });
        setShowMissedForm(true);
    };

    const handleSaveMissedNote = async () => {
        if (!missedForm.pair || !missedForm.notes) return toast.error("Cần nhập Pair và Ghi chú!");
        try {
            const baseUrl = "https://mk-project19-1.onrender.com/api/scenarios";
            
            if (editingMissedItem) {
                // ÉP KIỂU STRINGIFY TRƯỚC KHI GỬI XUỐNG
                const updatePayload = {
                    input: {
                        uuid: editingMissedItem.uuid,
                        analysis_details: JSON.stringify({ notes: missedForm.notes }),
                        images: JSON.stringify(missedForm.image_paths)
                    }
                };
                
                await fetch(`${baseUrl}/update/`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatePayload)
                });
            } else {
                const createRes = await fetch(`${baseUrl}/create/`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input: {
                            pair: missedForm.pair, direction: missedForm.direction, outlook_id: `WEEK-${currentWeek}`,
                            account_id: accountId, entry_price: 0, sl_price: 0, tp_price: 0, volume: 0
                        }
                    })
                });
                const createData = await createRes.json();
                const newUuid = createData.uuid;

                await fetch(`${baseUrl}/status/`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uuid: newUuid, status: missedForm.reason === 'CANCELLED' ? 'CANCELLED' : 'MISSED' })
                });

                await fetch(`${baseUrl}/update/`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input: { 
                            uuid: newUuid, 
                            analysis_details: JSON.stringify({ notes: missedForm.notes }),
                            images: JSON.stringify(missedForm.image_paths)
                        }
                    })
                });
            }

            toast.success("Đã cất cẩn thận!");
            setShowMissedForm(false);
            setEditingMissedItem(null);
            await loadData();
        } catch (e) {
            toast.error("Lỗi cáp quang: " + e);
        }
    };

    const handleDeleteMissed = async (uuid: string) => {
        if (!confirm("Sếp muốn phi tang hồ sơ này?")) return;
        try {
            await fetch("https://mk-project19-1.onrender.com/api/scenarios/delete/", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid })
            });
            toast.success("Đã ném vào máy hủy tài liệu!");
            loadData();
        } catch (e) { toast.error("Lỗi: " + e); }
    };

    const handleSavePsyNote = () => {
        if (!psyForm.note) return toast.error("Ghi chút gì đi sếp!");
        let updatedNotes = [...(details.psy_notes || [])];
        if (editingPsyItem) {
            updatedNotes = updatedNotes.map((n: any) => n.id === editingPsyItem.id ? { ...n, ...psyForm } : n);
            toast.success("Updated Note!");
        } else {
            const newNote = { id: Date.now(), ...psyForm, timestamp: Date.now() };
            updatedNotes = [newNote, ...updatedNotes];
            toast.success("Added Note!");
        }
        setDetails((prev: any) => ({ ...prev, psy_notes: updatedNotes }));
        setPsyForm({ emotion: "Normal", context: "Pre-Trade", note: "" });
        setShowPsyForm(false); setEditingPsyItem(null);
    };

    const handleEditPsyNote = (note: any) => { setEditingPsyItem(note); setPsyForm({ emotion: note.emotion, context: note.context || "Pre-Trade", note: note.note }); setShowPsyForm(true); };
    const handleDeletePsyNote = (id: number) => { if (!confirm("Delete this thought?")) return; setDetails((prev: any) => ({ ...prev, psy_notes: (details.psy_notes || []).filter((n: any) => n.id !== id) })); toast.success("Deleted!"); };

    const mistakeData = useMemo(() => {
        const data: { [key: string]: number } = {};
        trades.forEach(t => { if (t.mistake && t.mistake !== 'None' && t.pnl < 0) { if (!data[t.mistake]) data[t.mistake] = 0; data[t.mistake] += Math.abs(Number(t.pnl) || 0); } });
        return Object.keys(data).map(k => ({ name: k, value: data[k] }));
    }, [trades]);

    const setupData = useMemo(() => {
        if (!Array.isArray(setups)) return [];
        const data: { [key: string]: { pnl: number, count: number } } = {};
        trades.forEach(t => {
            const setupName = setups.find((s: any) => s.id === t.setup_id)?.title || "Manual";
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
        const topPair = Object.entries(pairs).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
        let insight = "Thu thập thêm dữ liệu...";
        if (sortedReasons[0]?.[0] === "Hesitation") insight = "Do dự quá mức. Giảm Volume để tự tin hơn.";
        else if (sortedReasons[0]?.[0] === "CANCELLED") insight = "Hủy lệnh nhiều: Bạn đang rất kỷ luật hoặc quá cầu toàn.";
        return { chartData: Object.keys(reasons).map(k => ({ name: k, count: reasons[k] })), topPair, total: missedTrades.length, insight };
    }, [missedTrades]);

    const psyAnalytics = useMemo(() => {
        const notes = details.psy_notes || [];
        if (!notes || notes.length === 0) return null;
        const emotions: { [key: string]: number } = {};
        notes.forEach((n: any) => { const e = n.emotion || "Normal"; emotions[e] = (emotions[e] || 0) + 1; });
        const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || "Normal";
        const hasRisk = (emotions["Angry"] || 0) > 0 || (emotions["Anxious"] || 0) > 2;
        const chartData = Object.keys(emotions).map(k => ({ name: k, value: emotions[k] }));
        return { chartData, dominantEmotion, hasRisk, total: notes.length, insight: hasRisk ? "CẢNH BÁO: Cảm xúc tiêu cực. Nghỉ ngơi ngay." : "Tâm lý ổn định." };
    }, [details.psy_notes]);

    const totalPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const winRate = trades.length > 0 ? ((trades.filter(t => t.outcome === 'win').length / trades.length) * 100).toFixed(1) : 0;

    if (isLoading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Đang bốc hồ sơ từ Két Sắt...</div>;

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Segoe UI' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div><h1 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>System Audit Hub</h1><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}> Fusion: Plan vs Reality</p></div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>START:</span>
                        <input type="date" value={currentWeek} onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setCurrentWeek(getMonday(d)); }} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }} />
                    </div>
                    <button onClick={loadData} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><RefreshCw size={18} /></button>
                    <button onClick={handleSaveReview} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Save size={18} /> Đóng dấu hồ sơ</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                {['fusion', 'deep-dive', 'missed', 'psychology'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: activeTab === tab ? '#2563eb' : '#64748b', borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent', textTransform: 'uppercase', fontSize: '13px' }}>{tab.replace('-', ' ')}</button>
                ))}
            </div>

            {activeTab === 'fusion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: '#1e40af', fontSize: '14px', display: 'flex', gap: '5px', alignItems: 'center' }}><Search size={16} /> WEEKLY OUTLOOK</h3>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>{outlookSnapshot.bias}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>TECHNICAL PLAN</div>
                                <textarea value={outlookSnapshot.technical} onChange={e => setOutlookSnapshot({ ...outlookSnapshot, technical: e.target.value })} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#334155', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Nhập kế hoạch kỹ thuật vào đây..." />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>EXECUTION SCRIPT</div>
                                <textarea value={outlookSnapshot.plan} onChange={e => setOutlookSnapshot({ ...outlookSnapshot, plan: e.target.value })} style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#334155', fontFamily: 'monospace', resize: 'vertical' }} placeholder="Kịch bản hành động..." />
                            </div>
                        </div>
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: 1 }}>
                            <h3 style={{ marginTop: 0, fontSize: '14px', color: '#d97706', marginBottom: '10px' }}>NARRATIVE & SUMMARY</h3>
                            <textarea value={details.journal_narrative} onChange={e => setDetails({ ...details, journal_narrative: e.target.value })} style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', resize: 'none' }} placeholder="Tóm tắt tuần này..." />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px' }}>
                            <h3 style={{ margin: 0, color: '#15803d', fontSize: '14px', marginBottom: '10px' }}>EXECUTION METRICS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px' }}>NET PNL</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: Number(totalPnl) >= 0 ? '#16a34a' : '#dc2626' }}>{Number(totalPnl).toFixed(2)}$</div></div>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px' }}>WINRATE</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{winRate}%</div></div>
                                <div style={{ background: 'white', padding: '10px', borderRadius: '6px' }}><div style={{ fontSize: '11px' }}>TRADES</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{trades.length}</div></div>
                            </div>
                        </div>
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', flex: 1 }}>
                            <h3 style={{ marginTop: 0, fontSize: '14px', color: '#9333ea', marginBottom: '10px' }}>SCORING & HABITS</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>FA Accuracy</label><b>{faScore}/10</b></div><input type="range" min="1" max="10" value={faScore} onChange={e => setFaScore(Number(e.target.value))} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>TA Accuracy</label><b>{taScore}/10</b></div><input type="range" min="1" max="10" value={taScore} onChange={e => setTaScore(Number(e.target.value))} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><label>Fusion</label><b>{fusionScore}/10</b></div><input type="range" min="1" max="10" value={fusionScore} onChange={e => setFusionScore(Number(e.target.value))} style={{ width: '100%' }} />
                                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '10px', marginTop: '5px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>HABITS:</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '5px' }}>
                                        {Object.keys(details.habits || DEFAULT_HABITS).map(h => (<label key={h} style={{ display: 'flex', gap: '5px', fontSize: '12px', alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={details.habits ? details.habits[h] : false} onChange={e => setDetails({ ...details, habits: { ...(details.habits || DEFAULT_HABITS), [h]: e.target.checked } })} /><span style={{ textTransform: 'capitalize' }}>{h}</span></label>))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'deep-dive' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', minHeight: '300px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: 0, marginBottom: '15px', color: '#dc2626', fontSize: '14px' }}>COST OF MISTAKES ($)</h3>{mistakeData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><PieChart><Pie data={mistakeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{mistakeData.map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>) : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No Data</div>}</div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><h3 style={{ margin: 0, marginBottom: '15px', color: '#2563eb', fontSize: '14px' }}>PNL BY SETUP</h3>{setupData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><BarChart data={setupData}><XAxis dataKey="name" style={{ fontSize: '10px' }} /><YAxis /><Tooltip /><Bar dataKey="pnl" fill="#10b981" /></BarChart></ResponsiveContainer>) : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No Data</div>}</div>
                </div>
            )}

            {activeTab === 'missed' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', overflow: 'hidden' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Những kẻ đào ngũ (Bị hủy/Lỡ chuyến đò)</h3>
                            <button onClick={openAddMissed} style={{ padding: '5px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}><Plus size={14}/> Add Manual</button>
                        </div>

                        {showMissedForm && (
                            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#0369a1', fontWeight: 'bold' }}>
                                    {editingMissedItem ? "Update Note" : "Add New"}
                                    <button onClick={() => setShowMissedForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input value={missedForm.pair} onChange={e => setMissedForm({...missedForm, pair: e.target.value})} style={inputStyleBase} placeholder="Pair (VD: EURUSD)" disabled={!!editingMissedItem} />
                                    <select value={missedForm.direction} onChange={e => setMissedForm({...missedForm, direction: e.target.value})} style={inputStyleBase} disabled={!!editingMissedItem}>
                                        <option value="BUY">BUY</option><option value="SELL">SELL</option>
                                    </select>
                                </div>
                                <select value={missedForm.reason} onChange={e => setMissedForm({...missedForm, reason: e.target.value})} style={{...inputStyleBase, width: '100%', marginBottom: '10px'}}>
                                    <option value="Hesitation">Hesitation</option>
                                    <option value="Spread">Spread</option>
                                    <option value="Sleep">Sleep</option>
                                    <option value="MISSED">Missed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                                <textarea value={missedForm.notes} onChange={e => setMissedForm({...missedForm, notes: e.target.value})} placeholder="Ghi chú bài học..." style={{...inputStyleBase, width: '100%', marginBottom: '10px', resize: 'vertical', minHeight: '60px'}} />
                                
                                {showImgInput && (
                                    <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
                                        <input value={tempImgLink} onChange={e => setTempImgLink(e.target.value)} placeholder="Dán link ảnh vào đây..." style={inputStyleBase} />
                                        <button onClick={() => { if(tempImgLink) { setMissedForm({...missedForm, image_paths: [...missedForm.image_paths, tempImgLink]}); setTempImgLink(""); } }} style={{ background: '#cbd5e1', border: 'none', padding: '0 10px', borderRadius: '4px', cursor: 'pointer'}}>Add</button>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '5px', marginBottom: '10px' }}>
                                    {missedForm.image_paths.map((p, i) => (
                                        <div key={i} style={{ height: '40px', position: 'relative', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <SafeImage path={p} />
                                            <button onClick={() => setMissedForm({...missedForm, image_paths: missedForm.image_paths.filter((_, idx) => idx !== i)})} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', width: '12px', height: '12px', fontSize: '8px', cursor: 'pointer' }}>x</button>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button onClick={() => setShowImgInput(!showImgInput)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Camera size={18} /></button>
                                    <button onClick={handleSaveMissedNote} style={{ background: '#2563eb', color: 'white', padding: '6px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Hồ Sơ</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {missedTrades.length === 0 ? <div style={{color: '#94a3b8'}}>Không có lệnh nào bị hủy. Kỷ luật tuyệt đối!</div> : missedTrades.map(m => (
                                <div key={m.uuid} style={{ padding: '10px', borderLeft: `4px solid ${m.reason === 'CANCELLED' ? '#ef4444' : '#f59e0b'}`, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <div>
                                            <strong>{m.pair} <span style={{ fontSize: '11px', color: '#64748b' }}>({m.direction})</span></strong>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{m.reason}</span>
                                            <button onClick={() => { 
                                                setEditingMissedItem(m); 
                                                setMissedForm({ pair: m.pair, direction: m.direction, reason: m.reason, notes: m.notes, image_paths: m.images || [] }); 
                                                setShowMissedForm(true); 
                                            }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={14} /></button>
                                            <button onClick={() => handleDeleteMissed(m.uuid)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontStyle: 'italic', margin: '5px 0', color: '#64748b' }}>{m.notes || "Chưa có ghi chú biện minh."}</div>
                                    {m.images && m.images.length > 0 && (
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                            {m.images.map((p: string, i: number) => <div key={i} style={{ width: '40px', height: '30px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}><SafeImage path={p} /></div>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ margin: 0, color: '#c2410c' }}><Lightbulb size={20} /> Opp. Cost (Chi phí cơ hội)</h3>
                        {missedAnalytics ? (<><div><h4 style={{ fontSize: '12px', color: '#9a3412' }}>LÝ DO HỦY LỆNH</h4><ResponsiveContainer width="100%" height={150}><BarChart data={missedAnalytics.chartData} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} style={{ fontSize: '11px' }} /><Tooltip /><Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div><p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#431407' }}>"{missedAnalytics.insight}"</p></>) : <div>No Data</div>}
                    </div>
                </div>
            )}

            {activeTab === 'psychology' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%', overflow: 'hidden' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: '#9333ea' }}>Psychology Log</h3>
                            <button onClick={() => { setEditingPsyItem(null); setPsyForm({ emotion: "Normal", context: "Pre-Trade", note: "" }); setShowPsyForm(!showPsyForm); }} style={{ padding: '5px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16} /> Add Note</button>
                        </div>
                        {showPsyForm && (
                            <div style={{ background: '#faf5ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#7e22ce' }}>{editingPsyItem ? "Update Emotion" : "Log New Emotion"}</span>
                                    <button onClick={() => setShowPsyForm(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={14} /></button>
                                </div>
                                <select value={psyForm.emotion} onChange={e => setPsyForm({ ...psyForm, emotion: e.target.value })} style={{ padding: 5, marginRight: 10 }}>
                                    <option>Normal</option><option>Anxious</option><option>Angry</option><option>Confident</option>
                                </select>
                                <input value={psyForm.note} onChange={e => setPsyForm({ ...psyForm, note: e.target.value })} placeholder="Feeling?" style={{ padding: 5 }} />
                                <button onClick={handleSavePsyNote} style={{ marginLeft: 10, cursor: 'pointer', background: '#9333ea', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4 }}>
                                    {editingPsyItem ? "Update" : "Add"}
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {details.psy_notes?.map((n: any) => (
                                <div key={n.id} style={{ padding: '10px', borderLeft: '4px solid #9333ea', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#9333ea', fontSize: '13px' }}>{n.emotion}</div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => handleEditPsyNote(n)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb' }}><Edit3 size={14} /></button>
                                            <button onClick={() => handleDeletePsyNote(n.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '5px' }}>{n.note}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                        <h3 style={{ margin: 0, color: '#7e22ce', display: 'flex', gap: '10px', alignItems: 'center' }}><Brain size={20} /> Emotional Intelligence Report</h3>
                        {psyAnalytics ? (
                            <>
                                <div style={{ flex: 1, minHeight: '150px', position: 'relative' }}>
                                    <h4 style={{ fontSize: '12px', color: '#6b21a8', margin: '0 0 10px 0', textAlign: 'center' }}>EMOTION BREAKDOWN</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart key={psyAnalytics.total + Math.random()}>
                                            <Pie data={psyAnalytics.chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {psyAnalytics.chartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip /><Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce' }}>{psyAnalytics.total}</div><div style={{ fontSize: '10px', color: '#a855f7' }}>Logs</div>
                                    </div>
                                </div>
                                {psyAnalytics.hasRisk && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <AlertTriangle size={20} color="#dc2626" />
                                        <div><div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '12px' }}>RISK DETECTED</div><div style={{ fontSize: '11px', color: '#991b1b' }}>Cảm xúc tiêu cực! Cẩn thận.</div></div>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #f3e8ff' }}><div style={{ fontSize: '11px', color: '#6b21a8' }}>DOMINANT</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7e22ce' }}>{psyAnalytics.dominantEmotion}</div></div>
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #f3e8ff' }}><div style={{ fontSize: '11px', color: '#6b21a8' }}>TREND</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7e22ce' }}>Stable</div></div>
                                </div>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #a855f7', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '5px', textTransform: 'uppercase' }}>Mental Coach Says</div>
                                    <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#581c87' }}>"{psyAnalytics.insight}"</p>
                                </div>
                            </>
                        ) : <div style={{ textAlign: 'center', color: '#d8b4fe', marginTop: '50px' }}><Brain size={48} opacity={0.5} style={{ marginBottom: '10px' }} /><div>Chưa có dữ liệu tâm lý.</div></div>}
                    </div>
                </div>
            )}
        </div>
    );
}