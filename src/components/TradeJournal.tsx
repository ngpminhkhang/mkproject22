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

const COMPLIANCE_RULES = ["Đồng thuận HTF Bias/Trend?", "Setup đúng mẫu hình (Library)?", "Entry tại vùng Discount/Premium?", "R:R tối thiểu đạt yêu cầu?", "Không vào lệnh trước tin tức đỏ?", "Tâm lý ổn định (Không Tilt)?"];
const TRADE_CLASSES = [{ id: "A+", label: "A+ Setup (Perfect)", color: "#16a34a" }, { id: "B", label: "B Setup (Standard)", color: "#2563eb" }, { id: "GOOD_LOSS", label: "Good Loss (Đúng luật)", color: "#ea580c" }, { id: "BAD_WIN", label: "Bad Win (Ăn may)", color: "#db2777" }, { id: "BAD_LOSS", label: "Bad Loss (Phá luật)", color: "#dc2626" }];
const MISTAKES_LIST = ["FOMO", "Revenge", "Oversize", "No Plan", "Early Exit", "Moved SL", "Hesitation"];

// BỘ GIẢI MÃ CHỐNG ĐỘT TỬ (V2) - GIỮ NGUYÊN 100% CỦA SẾP
const safeJSONParse = (val: any, fallback: any = {}) => {
    try {
        if (val === null || val === undefined) return fallback;
        if (typeof val === "object") return val;
        if (typeof val === "string") {
            if (!val.trim()) return fallback;
            let parsed = JSON.parse(val);
            if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
            }
            return parsed;
        }
        return fallback;
    } catch {
        return fallback;
    }
};

const ensureArray = (val: any) => Array.isArray(val) ? val : [];
const ensureObject = (val: any) => (typeof val === 'object' && val !== null && !Array.isArray(val)) ? val : {};

const StatCard = ({ title, value, sub, color }: any) => (
    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', flex: 1, minWidth: '140px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: color || '#0f172a', margin: '4px 0' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>{sub}</div>
    </div>
);

const SafeImage = ({ path, onClick }: any) => {
    if (!path || path === "[]" || path === "") return <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '10px', fontWeight: 800 }}>No Img</div>;
    return <img src={path} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} onClick={onClick} />;
};

const FullImageModal = ({ path, onClose }: any) => {
    if (!path) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
            <img src={path} style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px' }} onClick={e => e.stopPropagation()} />
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '8px' }}><X size={24} /></button>
        </div>
    )
}

export default function TradeJournal({ accountId = 1 }: { accountId?: number }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
    const [dateTo, setDateTo] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return d.toISOString().split('T')[0]; });
    const [filterPair, setFilterPair] = useState("");
    const [filterOutcome, setFilterOutcome] = useState("ALL");
    const [uniquePairs, setUniquePairs] = useState<string[]>([]);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [editPnL, setEditPnL] = useState<number>(0);
    const [editExitPrice, setEditExitPrice] = useState<number>(0);
    
    const [reviewData, setReviewData] = useState({ lessons: "", action_plan: "" });
    const [compliance, setCompliance] = useState<{ score: number, items: any }>({ score: 0, items: {} });
    const [tradeClass, setTradeClass] = useState("");
    const [mistakes, setMistakes] = useState<string[]>([]);
    const [resultImages, setResultImages] = useState<string[]>([]);
    const [tempImgLink, setTempImgLink] = useState("");

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const loadData = async () => {
        try {
            const res = await fetch(`https://mk-project19-1.onrender.com/api/scenarios/?accountId=${accountId}&t=${Date.now()}`);
            const rawList = await res.json();
            if (Array.isArray(rawList)) {
                let filtered = rawList.filter((t: any) => ['CLOSED', 'ARCHIVED'].includes(t.status));
                if (filterPair !== "") filtered = filtered.filter((t: any) => t.pair === filterPair);
                if (filterPair === "") setUniquePairs(Array.from(new Set(rawList.map((t: any) => t.pair))).sort() as string[]);
                setTrades(filtered);
            }
        } catch (e) { toast.error("Load error: " + e); }
    };

    useEffect(() => { loadData(); }, [accountId, dateFrom, dateTo, filterOutcome, filterPair]);

    const openReview = (t: Trade) => {
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

    // GIỮ NGUYÊN 100% CƠ CHẾ LƯU CỦA SẾP
    const handleSave = async () => {
        if (!selectedTrade) return;
        try {
            const safeItems = ensureObject(compliance.items);
            const checkedCount = Object.values(safeItems).filter(Boolean).length;
            const score = Math.round((checkedCount / COMPLIANCE_RULES.length) * 100);
            
            // [BỌC NILON TUYỆT ĐỐI]
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
                toast.success(`Đã đổ bê tông dữ liệu! PnL: $${editPnL}`);
                await loadData();
                setSelectedTrade(null); // Đóng Modal sau khi save
            } else {
                toast.error("Lỗi máy chủ Django!");
            }
        } catch (e) { toast.error("Đứt cáp quang: " + e); }
    };

    const handleComplianceCheck = (rule: string) => { 
        setCompliance(prev => ({ ...prev, items: { ...ensureObject(prev.items), [rule]: !ensureObject(prev.items)[rule] } }));
    };

    const stats = useMemo(() => {
        const wins = trades.filter(t => t.pnl > 0).length;
        const total = trades.length;
        const pnl = trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
        return { wins, total, pnl, wr: total ? (wins / total) * 100 : 0 };
    }, [trades]);

    return (
        <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: '100%' }}>
            <Toaster position="top-right" />
            
            {/* STATS HEADER */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <StatCard title="Net PnL" value={`${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}$`} color={stats.pnl >= 0 ? '#10b981' : '#ef4444'} sub="Realized" />
                <StatCard title="Win Rate" value={`${stats.wr.toFixed(1)}%`} color="#3b82f6" sub={`${stats.wins}/${stats.total} Trades`} />
                <StatCard title="Total Trades" value={trades.length} color="#0f172a" sub="Executed" />
                
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', flex: isMobile ? '1 1 100%' : 2 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}><Filter size={12} /> FILTERS</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', fontSize: '12px', outline: 'none', fontWeight: 700 }} />
                        <span style={{ color: '#94a3b8', fontWeight: 900 }}>-</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', fontSize: '12px', outline: 'none', fontWeight: 700 }} />
                        <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', fontSize: '12px', outline: 'none', fontWeight: 700, backgroundColor: '#f8fafc' }}>
                            <option value="">ALL PAIRS</option>
                            {uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button onClick={loadData} style={{ border: 'none', background: '#eff6ff', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', color: '#2563eb', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={14} /> SYNC</button>
                    </div>
                </div>
            </div>

            {/* TRADE LIST */}
            <div style={{ flex: 1, background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                {!isMobile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.6fr 1fr 1fr 1fr 1.5fr 2fr 60px', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 900, color: '#64748b' }}>
                        <div>SYMBOL/TIME</div><div>DIR</div><div>VOL</div><div>ENTRY</div><div>EXIT</div><div>PNL</div><div>CLASS/MISTAKE</div><div>NARRATIVE</div><div style={{ textAlign: 'right' }}>ACT</div>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '0' }}>
                    {trades.map(t => {
                        const review = ensureObject(safeJSONParse(t.review_data, {}));
                        const tradeClass = t.trade_class || review._trade_class || "-";
                        const mistakesArr = ensureArray(review.mistakes);
                        const mistake = mistakesArr.length > 0 ? mistakesArr[0] : "-";
                        
                        // GIAO DIỆN MOBILE
                        if (isMobile) {
                            return (
                                <div key={t.uuid} style={{ padding: '12px', marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{t.pair}</span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>{new Date(t.created_at || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, background: t.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: t.direction === 'BUY' ? '#166534' : '#991b1b' }}>{t.direction}</span>
                                            <span style={{ fontWeight: 900, fontSize: '14px', color: (t.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>{(t.pnl || 0) > 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}$</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                                        <span>VOL: <strong>{t.volume}</strong></span>
                                        <span>IN: <strong>{t.entry_price}</strong></span>
                                        <span>OUT: <strong>{t.exit_price || '-'}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {tradeClass !== '-' && <span style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#ffffff', fontWeight: 800 }}>{tradeClass}</span>}
                                            {mistake !== '-' && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontWeight: 800 }}>{mistake}</span>}
                                        </div>
                                        <button onClick={() => openReview(t)} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> REVIEW</button>
                                    </div>
                                </div>
                            )
                        }

                        // GIAO DIỆN DESKTOP
                        return (
                            <div key={t.uuid} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.6fr 1fr 1fr 1fr 1.5fr 2fr 60px', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', alignItems: 'center' }}>
                                <div><div style={{ fontWeight: 900, color: '#0f172a' }}>{t.pair}</div><div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{new Date(t.created_at || Date.now()).toLocaleDateString()}</div></div>
                                <div><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, background: t.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: t.direction === 'BUY' ? '#166534' : '#991b1b' }}>{t.direction}</span></div>
                                <div style={{ fontWeight: 800, color: '#475569' }}>{t.volume}</div>
                                <div style={{ fontWeight: 800, color: '#2563eb' }}>{t.entry_price}</div>
                                <div style={{ fontWeight: 800, color: '#64748b' }}>{t.exit_price || '-'}</div>
                                <div style={{ fontWeight: 900, color: (t.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>{(t.pnl || 0) > 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}$</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {tradeClass !== '-' && <span style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', fontWeight: 800 }}>{tradeClass}</span>}
                                    {mistake !== '-' && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800 }}>{mistake}</span>}
                                </div>
                                <div style={{ color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>{t.narrative || "-"}</div>
                                <div style={{ textAlign: 'right' }}><button onClick={() => openReview(t)} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: 900 }}><Eye size={14} /></button></div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MODAL REVIEW THEO CHUẨN RESPONSIVE */}
            {selectedTrade && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 9990, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '10px' : '20px' }}>
                    <div style={{ width: '100%', maxWidth: '1200px', height: '95vh', background: '#f8fafc', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        
                        <div style={{ background: '#ffffff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedTrade.pair}
                                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '99px', background: selectedTrade.direction === 'BUY' ? '#dcfce7' : '#fee2e2', color: selectedTrade.direction === 'BUY' ? '#166534' : '#991b1b' }}>{selectedTrade.direction}</span>
                                </h2>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 900 }}>EXIT:</span>
                                        <input type="number" step="any" value={editExitPrice} onChange={e => setEditExitPrice(parseFloat(e.target.value) || 0)} style={{ width: '80px', border: 'none', background: 'transparent', fontWeight: 900, outline: 'none', color: '#0f172a' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: editPnL >= 0 ? '#f0fdf4' : '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: editPnL >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 900, color: editPnL >= 0 ? '#16a34a' : '#dc2626' }}>PNL:</span>
                                        <input type="number" step="0.01" value={editPnL} onChange={e => setEditPnL(parseFloat(e.target.value) || 0)} style={{ width: '80px', border: 'none', background: 'transparent', fontWeight: 900, outline: 'none', color: editPnL >= 0 ? '#16a34a' : '#dc2626' }} />
                                        <span style={{ fontSize: '11px', fontWeight: 900 }}>$</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                                <button onClick={handleSave} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Save size={16} /> LƯU</button>
                                <button onClick={() => setSelectedTrade(null)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', color: '#0f172a', fontWeight: 900 }}><X size={16} /></button>
                            </div>
                        </div>

                        {/* BODY MODAL */}
                        <div style={{ flex: 1, padding: isMobile ? '12px' : '20px', overflowY: 'auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
                            
                            {/* CỘT 1: COMPLIANCE & CLASS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: isMobile ? 'none' : 1, minWidth: '300px' }}>
                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 }}><ShieldCheck size={16} color="#3b82f6" /> COMPLIANCE SCORE</h3>
                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        {(() => {
                                            const score = Math.round((Object.values(compliance.items).filter(Boolean).length / COMPLIANCE_RULES.length) * 100);
                                            return <div style={{ fontSize: '32px', fontWeight: 900, color: score >= 80 ? '#10b981' : (score >= 50 ? '#f59e0b' : '#ef4444') }}>{score}%</div>
                                        })()}
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>Mức độ<br />Tuân thủ</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {COMPLIANCE_RULES.map(rule => (
                                            <label key={rule} style={{ display: 'flex', gap: '10px', fontSize: '12px', cursor: 'pointer', alignItems: 'flex-start', color: '#0f172a', fontWeight: 700 }}>
                                                <input type="checkbox" checked={compliance?.items?.[rule] || false} onChange={() => handleComplianceCheck(rule)} style={{ accentColor: '#3b82f6', marginTop: '2px' }} /> {rule}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 }}><Target size={16} color="#8b5cf6" /> TRADE CLASS</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {TRADE_CLASSES.map(cls => (
                                            <button key={cls.id} onClick={() => setTradeClass(cls.id)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: '12px', fontWeight: 900, borderColor: tradeClass === cls.id ? cls.color : '#e2e8f0', background: tradeClass === cls.id ? `${cls.color}10` : '#f8fafc', color: tradeClass === cls.id ? cls.color : '#64748b' }}>{cls.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CỘT 2: EVIDENCE & CONTEXT */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: isMobile ? 'none' : 2 }}>
                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 900 }}><Camera size={16} color="#f59e0b" /> EVIDENCE</h3>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px' }}>PRE-TRADE PLAN</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                                            {ensureArray(safeJSONParse(selectedTrade.images, [])).map((path: string, i: number) => (
                                                <div key={i} style={{ height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><SafeImage path={path} onClick={() => setPreviewImg(path)} /></div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px' }}>RESULT SNAPSHOT</div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <input type="text" placeholder="Link ảnh Imgur..." value={tempImgLink} onChange={(e) => setTempImgLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddImage(); }} style={{ flex: 1, padding: '10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600, backgroundColor: '#f8fafc' }} />
                                            <button onClick={handleAddImage} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>ADD</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                                            {resultImages.map((path: string, i: number) => (
                                                <div key={i} style={{ height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                    <SafeImage path={path} onClick={() => setPreviewImg(path)} />
                                                    <button onClick={() => setResultImages(resultImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: 'white', border: 'none', width: '20px', height: '20px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}>X</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '6px' }}>CONTEXT NARRATIVE</div>
                                    <div style={{ fontSize: '13px', color: '#0f172a', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5 }}>"{selectedTrade.narrative || "-"}"</div>
                                </div>
                            </div>

                            {/* CỘT 3: MISTAKES & LESSONS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: isMobile ? 'none' : 1, minWidth: '300px' }}>
                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 }}><AlertOctagon size={16} color="#ef4444" /> MISTAKES</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {MISTAKES_LIST.map(m => {
                                            const isSelected = ensureArray(mistakes).includes(m);
                                            return (
                                                <button key={m} onClick={() => { if (isSelected) setMistakes(mistakes.filter(x => x !== m)); else setMistakes([...mistakes, m]); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid', fontSize: '11px', fontWeight: 800, cursor: 'pointer', background: isSelected ? '#fef2f2' : '#f8fafc', color: isSelected ? '#ef4444' : '#64748b', borderColor: isSelected ? '#fca5a5' : '#e2e8f0' }}>{m}</button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                    <h3 style={{ margin: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 }}><Activity size={16} color="#10b981" /> LESSONS</h3>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '6px' }}>KEY LESSON</label>
                                        <textarea value={reviewData.lessons} onChange={e => setReviewData({ ...reviewData, lessons: e.target.value })} style={{ flex: 1, minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', resize: 'vertical' }} placeholder="Bài học rút ra..." />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '6px' }}>ACTION LOCK</label>
                                        <textarea value={reviewData.action_plan} onChange={e => setReviewData({ ...reviewData, action_plan: e.target.value })} style={{ flex: 1, minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '13px', fontWeight: 600, color: '#9a3412', backgroundColor: '#fffbeb', outline: 'none', resize: 'vertical' }} placeholder="Lần sau sẽ..." />
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