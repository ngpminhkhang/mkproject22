import { useState, useEffect, useMemo } from "react";
import { Filter, X, Save, Eye, Camera, RefreshCw, Activity, Target, ShieldCheck, AlertOctagon } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface Trade {
    uuid: string; pair: string; direction: "BUY" | "SELL"; status: string;
    pnl: number; entry_price: number; sl_price: number; tp_price: number; volume: number;
    exit_price: number; close_time?: number; setup_id?: number | null;
    analysis_details: any; pre_trade_checklist: any; images: any;
    review_data: any; result_images: any; created_at: number;
    htf_trend?: string; market_phase?: string; narrative?: string; scenario_type?: string;
    trade_class?: string; root_cause?: string;
}
interface ComplianceData { score: number; items: { [key: string]: boolean }; }

const COMPLIANCE_RULES = ["Đồng thuận HTF Bias/Trend?", "Setup đúng mẫu hình (Library)?", "Entry tại vùng Discount/Premium?", "R:R tối thiểu đạt yêu cầu?", "Không vào lệnh trước tin tức đỏ?", "Tâm lý ổn định (Không Tilt)?"];
const TRADE_CLASSES = [{ id: "A+", label: "A+ Setup (Perfect)", color: "#16a34a" }, { id: "B", label: "B Setup (Standard)", color: "#2563eb" }, { id: "GOOD_LOSS", label: "Good Loss (Đúng luật)", color: "#ea580c" }, { id: "BAD_WIN", label: "Bad Win (Ăn may)", color: "#db2777" }, { id: "BAD_LOSS", label: "Bad Loss (Phá luật)", color: "#dc2626" }];
const MISTAKES_LIST = ["FOMO", "Revenge", "Oversize", "No Plan", "Early Exit", "Moved SL", "Hesitation"];

// [KHIÊN TITAN CHỐNG SẬP REACT]
const safeJSONParse = (val: any, fallback: any) => { 
    if (!val) return fallback; 
    if (typeof val === 'object') return val;
    try { const parsed = JSON.parse(val); return parsed || fallback; } catch (e) { return fallback; } 
};
const ensureArray = (val: any) => Array.isArray(val) ? val : [];
const ensureObject = (val: any) => (typeof val === 'object' && val !== null && !Array.isArray(val)) ? val : {};
const extractNotes = (details: any) => {
    if (!details) return "-";
    if (typeof details === 'string') {
        if (details === "{}" || details === "[]" || details === '{"notes":""}') return "-";
        try { const parsed = JSON.parse(details); return parsed.notes || details; } catch { return details; }
    }
    if (typeof details === 'object') return details.notes || "-";
    return "-";
};

const StatCard = ({ title, value, sub, color }: any) => (
    <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '22px', fontWeight: '900', color: color || '#0f172a', margin: '4px 0' }}>{value}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sub}</div>
    </div>
);

const SafeImage = ({ path, onClick }: any) => {
    if (!path || path === "[]") return <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '10px' }}>No Img</div>;
    return <img src={path} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} onClick={onClick} />;
};

const FullImageModal = ({ path, onClose }: any) => {
    if (!path) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
            <img src={path} style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={40} /></button>
        </div>
    )
}

export default function TradeJournal({ accountId = 1 }: { accountId?: number }) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(false);
    const date = new Date();
    const getLocalDate = (d: Date) => { const o = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - o).toISOString().split('T')[0]; };
    
    const [dateFrom, setDateFrom] = useState(getLocalDate(new Date(date.getFullYear(), date.getMonth(), 1)));
    const [dateTo, setDateTo] = useState(getLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)));
    const [filterPair, setFilterPair] = useState("");
    const [filterOutcome, setFilterOutcome] = useState("ALL");
    const [uniquePairs, setUniquePairs] = useState<string[]>([]);
    
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [editPnL, setEditPnL] = useState<number>(0);
    const [editExitPrice, setEditExitPrice] = useState<number>(0);
    
    const [reviewData, setReviewData] = useState({ lessons: "", action_plan: "" });
    const [compliance, setCompliance] = useState<ComplianceData>({ score: 0, items: {} });
    const [tradeClass, setTradeClass] = useState("");
    const [mistakes, setMistakes] = useState<string[]>([]);
    const [resultImages, setResultImages] = useState<string[]>([]);
    const [tempImgLink, setTempImgLink] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://mk-project19-1.onrender.com/api/scenarios/?accountId=${accountId}&t=${Date.now()}`);
            const rawList = await res.json();
            if (Array.isArray(rawList)) {
                let filtered = rawList.filter((t: any) => ['CLOSED', 'ARCHIVED'].includes(t.status));
                if (filterPair !== "") filtered = filtered.filter((t: any) => t.pair === filterPair);
                if (filterPair === "") setUniquePairs(Array.from(new Set(rawList.map((t: any) => t.pair))).sort() as string[]);
                setTrades(filtered);
            } else { setTrades([]); }
        } catch (e) { toast.error("Load error: " + e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [accountId, dateFrom, dateTo, filterOutcome, filterPair]);

    const openReview = (t: Trade) => {
        // Ép kiểu dữ liệu tuyệt đối trước khi gán
        const rev = ensureObject(safeJSONParse(t.review_data, {}));
        const comp = ensureObject(rev._compliance || { score: 0, items: {} }); 
        
        setReviewData({ lessons: rev.lessons || "", action_plan: rev.action_plan || "" });
        setMistakes(ensureArray(rev.mistakes));
        setTradeClass(t.trade_class || rev._trade_class || "");
        setResultImages(ensureArray(safeJSONParse(t.result_images, [])));
        setCompliance({ score: comp.score || 0, items: ensureObject(comp.items) });
        setEditPnL(t.pnl || 0);
        setEditExitPrice(t.exit_price || 0);
        setTempImgLink("");
        setSelectedTrade(t);
    };

    const handleAddImage = () => {
        if (!tempImgLink) return;
        setResultImages([...resultImages, tempImgLink]);
        setTempImgLink("");
    };

    const handleSave = async () => {
        if (!selectedTrade) return;
        try {
            const safeItems = ensureObject(compliance?.items);
            const checkedCount = Object.values(safeItems).filter(Boolean).length;
            const score = Math.round((checkedCount / COMPLIANCE_RULES.length) * 100);
            
            const packData = { 
                lessons: reviewData.lessons, 
                mistakes: mistakes, 
                action_plan: reviewData.action_plan, 
                _trade_class: tradeClass, 
                _compliance: { score, items: safeItems } 
            };
            
            const updatePayload = {
                input: {
                    uuid: selectedTrade.uuid,
                    review_data: packData, 
                    result_images: resultImages, 
                    pnl: editPnL,
                    exit_price: editExitPrice
                }
            };
            
            const res = await fetch("https://mk-project19-1.onrender.com/api/scenarios/update/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatePayload)
            });
            
            if (res.ok) {
                toast.success(`Đã lưu sổ cái! PnL: $${editPnL}`);
                await loadData();
                setSelectedTrade(null);
            } else {
                toast.error("Lỗi máy chủ Django!");
            }
        } catch (e) { toast.error("Đứt cáp quang: " + e); }
    };

    const handleComplianceCheck = (rule: string) => { setCompliance(prev => ({ ...prev, items: { ...ensureObject(prev.items), [rule]: !prev.items?.[rule] } })); };

    const stats = useMemo(() => {
        const wins = trades.filter(t => t.pnl > 0).length;
        const total = trades.length;
        const pnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
        return { wins, total, pnl, wr: total ? (wins / total) * 100 : 0 };
    }, [trades]);

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Segoe UI' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', gap: '15px' }}>
                <StatCard title="Net PnL" value={`${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}$`} color={stats.pnl >= 0 ? '#16a34a' : '#dc2626'} sub="Realized" />
                <StatCard title="Win Rate" value={`${stats.wr.toFixed(1)}%`} color="#2563eb" sub={`${stats.wins}/${stats.total} Trades`} />
                <StatCard title="Total Trades" value={trades.length} color="#64748b" sub="Executed" />
                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', minWidth: '350px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', display: 'flex', gap: '5px', alignItems: 'center' }}><Filter size={10} /> FILTERS</div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '11px', outline: 'none' }} />
                        <span style={{ color: '#cbd5e1' }}>-</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '11px', outline: 'none' }} />
                        <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', outline: 'none', maxWidth: '80px' }}>
                            <option value="">All Pairs</option>{uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} style={{ padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', outline: 'none' }}>
                            <option value="ALL">All</option><option value="WIN">Win</option><option value="LOSS">Loss</option>
                        </select>
                        <button onClick={loadData} style={{ border: 'none', background: '#f1f5f9', borderRadius: '4px', cursor: 'pointer', padding: '4px', color: '#64748b' }} title="Refresh"><RefreshCw size={14} /></button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 0.5fr 0.8fr 0.8fr 1fr 1fr 1.5fr 80px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                    <div>SYMBOL/TIME</div><div>DIR</div><div>VOL</div><div>ENTRY</div><div>EXIT</div><div>PNL</div><div>CLASS/MISTAKE</div><div>NARRATIVE</div><div style={{ textAlign: 'right' }}>ACTION</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {trades.map(t => {
                        const review = ensureObject(safeJSONParse(t.review_data, {}));
                        const tradeClass = t.trade_class || review._trade_class || "-";
                        const mistakesArr = ensureArray(review.mistakes);
                        const mistake = mistakesArr.length > 0 ? mistakesArr[0] : "-";
                        
                        return (
                            <div key={t.uuid} style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 0.5fr 0.8fr 0.8fr 1fr 1fr 1.5fr 80px', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', alignItems: 'center' }}>
                                <div><div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t.pair}</div><div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(t.created_at || Date.now()).toLocaleDateString()}</div></div>
                                <div><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: t.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: t.direction === 'BUY' ? '#166534' : '#991b1b' }}>{t.direction}</span></div>
                                <div style={{ fontFamily: 'monospace' }}>{t.volume}</div>
                                <div style={{ fontFamily: 'monospace', color: '#2563eb' }}>{t.entry_price}</div>
                                <div style={{ fontFamily: 'monospace', color: '#64748b' }}>{t.exit_price || '-'}</div>
                                <div style={{ fontWeight: 'bold', color: (t.pnl || 0) >= 0 ? '#16a34a' : '#dc2626' }}>{(t.pnl || 0) > 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}$</div>
                                <div>
                                    {tradeClass !== '-' && <span style={{ fontSize: '10px', padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: '3px', marginRight: '5px', background: '#f8fafc' }}>{tradeClass}</span>}
                                    {mistake !== '-' && <span style={{ fontSize: '10px', color: '#dc2626' }}>{mistake}</span>}
                                </div>
                                <div style={{ color: '#64748b', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.narrative || extractNotes(t.analysis_details)}</div>
                                <div style={{ textAlign: 'right' }}><button onClick={() => openReview(t)} style={{ padding: '6px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Eye size={14} /></button></div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {selectedTrade && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9990, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '95vw', height: '90vh', background: '#f8fafc', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ background: 'white', padding: '15px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {selectedTrade.pair}
                                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: selectedTrade.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: selectedTrade.direction === 'BUY' ? '#166534' : '#991b1b' }}>{selectedTrade.direction}</span>
                                </h2>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', alignItems: 'center' }}>
                                    <span>Entry: <b>{selectedTrade.entry_price}</b></span>
                                    <span style={{ color: '#dc2626' }}>SL: <b>{selectedTrade.sl_price}</b></span>
                                    <span style={{ color: '#16a34a' }}>TP: <b>{selectedTrade.tp_price}</b></span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>EXIT:</span>
                                        <input type="number" step="any" value={editExitPrice} onChange={e => setEditExitPrice(parseFloat(e.target.value) || 0)} style={{ width: '70px', border: 'none', background: 'transparent', fontWeight: 'bold', outline: 'none', borderBottom: '1px dashed #cbd5e1' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: editPnL >= 0 ? '#f0fdf4' : '#fef2f2', padding: '4px 8px', borderRadius: '4px', border: editPnL >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: editPnL >= 0 ? '#16a34a' : '#dc2626' }}>PNL:</span>
                                        <input type="number" step="0.01" value={editPnL} onChange={e => setEditPnL(parseFloat(e.target.value) || 0)} style={{ width: '70px', border: 'none', background: 'transparent', fontWeight: 'bold', outline: 'none', color: editPnL >= 0 ? '#16a34a' : '#dc2626' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>$</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleSave} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Save size={18} /> SAVE DIAGNOSIS</button>
                                <button onClick={() => setSelectedTrade(null)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} /> COMPLIANCE SCORE</h3>
                                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {(() => {
                                            const safeItems = ensureObject(compliance?.items);
                                            const score = Math.round((Object.values(safeItems).filter(Boolean).length / COMPLIANCE_RULES.length) * 100);
                                            return <div style={{ fontSize: '32px', fontWeight: '900', color: score >= 80 ? '#16a34a' : (score >= 50 ? '#ca8a04' : '#dc2626') }}>{score}%</div>
                                        })()}
                                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.2' }}>Tuân thủ<br />Kỷ luật</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {COMPLIANCE_RULES.map(rule => (
                                            <label key={rule} style={{ display: 'flex', gap: '10px', fontSize: '12px', cursor: 'pointer', alignItems: 'center', color: '#334155' }}>
                                                <input type="checkbox" checked={compliance?.items?.[rule] || false} onChange={() => handleComplianceCheck(rule)} style={{ accentColor: '#2563eb' }} /> {rule}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18} /> TRADE CLASS</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {TRADE_CLASSES.map(cls => (
                                            <button key={cls.id} onClick={() => setTradeClass(cls.id)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', borderColor: tradeClass === cls.id ? cls.color : '#e2e8f0', background: tradeClass === cls.id ? `${cls.color}10` : 'white', color: tradeClass === cls.id ? cls.color : '#64748b' }}>{cls.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Camera size={18} /> EVIDENCE</h3>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>PLAN</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                            {ensureArray(safeJSONParse(selectedTrade.images, [])).map((path: string, i: number) => (
                                                <div key={i} style={{ height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}><SafeImage path={path} onClick={() => setPreviewImg(path)} /></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>RESULT (Dán link ảnh Discord/Imgur vào đây)</div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                            <input 
                                                type="text" placeholder="https://imgur.com/xyz.png" 
                                                value={tempImgLink} onChange={(e) => setTempImgLink(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddImage(); }}
                                                style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                            />
                                            <button onClick={handleAddImage} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ADD</button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                            {ensureArray(resultImages).map((path: string, i: number) => (
                                                <div key={i} style={{ height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                                                    <SafeImage path={path} onClick={() => setPreviewImg(path)} />
                                                    <button onClick={() => setResultImages(resultImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer' }}>x</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>CONTEXT</div>
                                    <div style={{ fontSize: '13px', color: '#1e3a8a', fontStyle: 'italic' }}>"{selectedTrade.narrative || extractNotes(selectedTrade.analysis_details)}"</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={18} /> MISTAKES</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {MISTAKES_LIST.map(m => (
                                            <button key={m} onClick={() => { if (ensureArray(mistakes).includes(m)) setMistakes(mistakes.filter(x => x !== m)); else setMistakes([...mistakes, m]); }} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid', fontSize: '11px', cursor: 'pointer', background: ensureArray(mistakes).includes(m) ? '#fee2e2' : 'white', color: ensureArray(mistakes).includes(m) ? '#991b1b' : '#64748b', borderColor: ensureArray(mistakes).includes(m) ? '#fecaca' : '#e2e8f0' }}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> LESSONS</h3>
                                    <div style={{ marginBottom: '10px', flex: 1 }}>
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>KEY LESSON</label>
                                        <textarea value={reviewData.lessons} onChange={e => setReviewData({ ...reviewData, lessons: e.target.value })} style={{ width: '100%', height: '80px', marginTop: '5px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'inherit' }} placeholder="Bài học rút ra..." />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>ACTION LOCK</label>
                                        <textarea value={reviewData.action_plan} onChange={e => setReviewData({ ...reviewData, action_plan: e.target.value })} style={{ width: '100%', height: '80px', marginTop: '5px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'inherit', background: '#fff7ed', borderColor: '#fed7aa' }} placeholder="Lần sau sẽ..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {previewImg && <FullImageModal path={previewImg} onClose={() => setPreviewImg(null)} />}
        </div>
    );
}