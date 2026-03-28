import { useState, useEffect } from "react";
import { Radio, Clock, Activity, Volume2, VolumeX, ArrowRightCircle, Settings, Check, Zap } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { motion } from "framer-motion";

interface MarketSignal { symbol: string; direction: "BUY" | "SELL" | "NEUTRAL"; active_tags: string[]; is_alerting: boolean; score: number; timestamp: number; }
interface MonitorCardItem { symbol: string; bias: "BUY" | "SELL" | "NEUTRAL"; signal?: MarketSignal; lastUpdate: number; }

const ALL_TAGS_DEF = [
    { id: 'FIBO_GOLD', label: 'Fibo Golden (38-61)', group: 'MANUAL' }, { id: 'ZONE_TOUCH', label: 'Price In Zone', group: 'MANUAL' },
    { id: 'STOCH_OB', label: 'Stoch > 70 (Sell)', group: 'OSCILLATOR' }, { id: 'STOCH_OS', label: 'Stoch < 30 (Buy)', group: 'OSCILLATOR' },
    { id: 'MACD_CROSS_UP', label: 'MACD Cross Up', group: 'TREND' }, { id: 'MACD_CROSS_DOWN', label: 'MACD Cross Down', group: 'TREND' },
    { id: 'MACD_POS', label: 'MACD > 0', group: 'TREND' }, { id: 'MACD_NEG', label: 'MACD < 0', group: 'TREND' },
];

const parseDeep = (val: any, fallback: any = []): any => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { const p = JSON.parse(val); return typeof p === 'string' ? JSON.parse(p) : p; } catch (e) { return fallback; }
};
const ensureArray = (val: any) => Array.isArray(val) ? val : [];

export default function MarketMonitor({ onTradeNow }: { onTradeNow: (s: any) => void }) {
    const [monitorList, setMonitorList] = useState<MonitorCardItem[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isMt5Alive, setIsMt5Alive] = useState(false);
    const [cardSettings, setCardSettings] = useState<{ [symbol: string]: string[] }>({});
    const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
    const [dismissedSignals, setDismissedSignals] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getMondayLocal = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); date.setDate(diff);
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - (offset * 60000)).toISOString().split('T')[0];
    };

    useEffect(() => { const saved = localStorage.getItem("MONITOR_CARD_SETTINGS"); if (saved) setCardSettings(JSON.parse(saved)); }, []);
    const saveCardSetting = (symbol: string, tags: string[]) => { const newSettings = { ...cardSettings, [symbol]: tags }; setCardSettings(newSettings); localStorage.setItem("MONITOR_CARD_SETTINGS", JSON.stringify(newSettings)); };
    
    const playSound = () => { if (!soundEnabled) return; const audio = new Audio('/ping.mp3'); audio.volume = 0.5; audio.play().catch(() => {}); };
    
    const dismissSignal = (symbol: string) => { 
        setDismissedSignals(prev => [...prev, symbol]); 
        toast.success(`Đã MUTE cảnh báo ${symbol} trong 1 phút`, { style: { background: '#f59e0b', color: 'white', fontWeight: 'bold' }});
        setTimeout(() => { setDismissedSignals(prev => prev.filter(s => s !== symbol)); }, 60000); 
    };

    const syncData = async () => {
        try {
            setIsMt5Alive(true);
            const weekDate = getMondayLocal(new Date());
            const outRes = await fetch(`https://mk-project19-1.onrender.com/api/outlook/current/?week_start=${weekDate}&t=${Date.now()}`);
            const map = new Map<string, MonitorCardItem>();
            if (outRes.ok) {
                const outData = await outRes.json();
                if (outData.fa_bias) {
                    try {
                        const fa = parseDeep(outData.fa_bias, {});
                        if (Array.isArray(fa.planned)) {
                            fa.planned.forEach((s: string) => {
                                const [symRaw, dirRaw] = s.split('|'); const cleanSym = symRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                map.set(cleanSym, { symbol: cleanSym, bias: dirRaw.toUpperCase() === 'BUY' || dirRaw.toUpperCase() === 'LONG' ? 'BUY' : 'SELL', lastUpdate: 0 });
                            });
                        }
                    } catch (e) {}
                }
            }

            try {
                const sigRes = await fetch(`https://mk-project19-1.onrender.com/api/mt5/radar_v2/?t=${Date.now()}`);
                if (sigRes.ok) {
                    const sigData = await sigRes.json();
                    const signals: MarketSignal[] = sigData.radar_blips || [];
                    const now = Date.now();
                    signals.forEach(sig => {
                        if (!sig || !sig.symbol) return;
                        const cleanSym = sig.symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        if (dismissedSignals.includes(cleanSym)) return;
                        
                        if (map.has(cleanSym)) {
                            const item = map.get(cleanSym)!;
                            item.signal = sig;
                            item.lastUpdate = now;
                            if (sig.is_alerting) playSound();
                        }
                    });
                }
            } catch (e) { console.error("Radar Error:", e); }

            setMonitorList(Array.from(map.values()));
        } catch (e) { setIsMt5Alive(false); }
    };

    useEffect(() => { syncData(); const i = setInterval(syncData, 3000); return () => clearInterval(i); }, [soundEnabled, dismissedSignals]);
    
    const handleTradeClick = (item: MonitorCardItem, activeTags: string[]) => {
        const payload = { pair: item.symbol, direction: item.bias, reason: `Radar Alert: ${activeTags.join(", ")}`, tags: activeTags };
        localStorage.setItem("MFJA_QUICK_TRADE", JSON.stringify(payload)); 
        if (onTradeNow) onTradeNow(payload);
    };

    return (
        <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Toaster position="top-right" />
            
            {/* KHỐI 1: HEADER & ĐIỀU KHIỂN */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Radio size={18} color="#3b82f6" />
                        <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>MARKET RADAR</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: isMt5Alive ? '#f0fdf4' : '#fef2f2', borderRadius: '99px', border: `1px solid ${isMt5Alive ? '#bbf7d0' : '#fecaca'}` }}>
                        <Activity size={12} color={isMt5Alive ? '#16a34a' : '#dc2626'} />
                        <span style={{ fontSize: '10px', fontWeight: 900, color: isMt5Alive ? '#166534' : '#991b1b' }}>{isMt5Alive ? "MT5 LIVE" : "DISCONNECTED"}</span>
                    </div>
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {soundEnabled ? <Volume2 size={16} color="#16a34a" /> : <VolumeX size={16} color="#94a3b8" />}
                    {!isMobile && <span style={{ fontSize: '11px', fontWeight: 800, color: soundEnabled ? '#16a34a' : '#64748b' }}>{soundEnabled ? 'SOUND ON' : 'MUTED'}</span>}
                </button>
            </div>

            {/* KHỐI 2: LƯỚI TÍN HIỆU (RADAR GRID) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', alignContent: 'start' }}>
                
                {/* HIỂN THỊ KHI KHÔNG CÓ KẾ HOẠCH NÀO TRONG OUTLOOK */}
                {monitorList.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Radio size={32} color="#94a3b8" style={{ opacity: 0.5 }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>RADAR TRỐNG</h3>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Chưa có mục tiêu nào được Sync từ Macro Outlook sang.</span>
                    </div>
                )}

                {/* DANH SÁCH CÁC THẺ MỤC TIÊU */}
                {monitorList.map(item => {
                    const hasSignal = item.signal && (Date.now() - item.lastUpdate < 300000);
                    const activeTags = hasSignal ? ensureArray(parseDeep(item.signal?.active_tags, [])) : [];
                    const isPlanBuy = item.bias === 'BUY';
                    const planColor = isPlanBuy ? '#10b981' : '#ef4444';
                    const isAligned = hasSignal && (item.signal?.direction === item.bias || item.signal?.direction === 'NEUTRAL');
                    const selectedTagIds = cardSettings[item.symbol] || ['FIBO_GOLD', 'ZONE_TOUCH', 'MACD_CROSS_UP', 'STOCH_OS'];
                    const isEditing = editingSymbol === item.symbol;

                    return (
                        <motion.div layout key={item.symbol} style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', position: 'relative', border: hasSignal ? (isAligned ? `2px solid ${planColor}` : '2px solid #f59e0b') : '1px solid #e2e8f0', boxShadow: hasSignal ? `0 4px 15px ${isPlanBuy ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` : '0 1px 2px rgba(0,0,0,0.03)' }}>
                            
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>{item.symbol}</div>
                                    <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 900, color: planColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ArrowRightCircle size={12} style={{ transform: isPlanBuy ? 'rotate(-45deg)' : 'rotate(45deg)' }} /> OUTLOOK: {item.bias}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    {hasSignal && (
                                        <button onClick={() => dismissSignal(item.symbol)} title="Tắt tiếng 1 phút" style={{ backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <VolumeX size={14} color="#dc2626" />
                                        </button>
                                    )}
                                    <button onClick={() => setEditingSymbol(isEditing ? null : item.symbol)} style={{ backgroundColor: isEditing ? '#eff6ff' : '#f8fafc', border: `1px solid ${isEditing ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Settings size={14} color={isEditing ? '#2563eb' : '#64748b'} />
                                    </button>
                                </div>
                            </div>

                            {/* Cấu hình Tag (Nhấn nút răng cưa sẽ bung ra) */}
                            {isEditing ? (
                                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px' }}>CHỌN 4 TAGS HIỂN THỊ:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                        {ALL_TAGS_DEF.map(def => {
                                            const isSelected = selectedTagIds.includes(def.id);
                                            return (
                                                <div key={def.id} onClick={() => { let newTags = [...selectedTagIds]; if (isSelected) newTags = newTags.filter(t => t !== def.id); else { if (newTags.length >= 4) newTags.shift(); newTags.push(def.id); } saveCardSetting(item.symbol, newTags); }} style={{ fontSize: '10px', fontWeight: 800, padding: '6px', cursor: 'pointer', borderRadius: '4px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff', border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, color: isSelected ? '#1d4ed8' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {isSelected && <Check size={12} />} {def.label}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <button onClick={() => setEditingSymbol(null)} style={{ width: '100%', marginTop: '12px', padding: '8px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>XONG</button>
                                </div>
                            ) : (
                                /* Hiển thị 4 Tag Indicator */
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                    {[0, 1, 2, 3].map(i => {
                                        const tagId = selectedTagIds[i];
                                        if (!tagId) return <div key={i} style={{ height: '32px', border: '1px dashed #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }} />;
                                        const tagDef = ALL_TAGS_DEF.find(t => t.id === tagId) || { id: tagId, label: tagId, group: 'OTHER' };
                                        const isActive = activeTags.includes(tagId);
                                        return (
                                            <div key={i} style={{ padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textAlign: 'center', backgroundColor: isActive ? (isPlanBuy ? '#dcfce7' : '#fef2f2') : '#f8fafc', color: isActive ? (isPlanBuy ? '#166534' : '#991b1b') : '#94a3b8', border: `1px solid ${isActive ? (isPlanBuy ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}`, opacity: isActive ? 1 : 0.5, transition: 'all 0.2s' }}>
                                                {tagDef.label}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Nút Execute / Status */}
                            {hasSignal ? (
                                <button onClick={() => handleTradeClick(item, activeTags)} style={{ width: '100%', padding: '12px', backgroundColor: planColor, borderRadius: '8px', color: '#ffffff', fontWeight: 900, fontSize: '13px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.1s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                    <Zap size={16} fill="white" /> THẨM VẤN & KHAI HỎA
                                </button>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontWeight: 900, fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                                    <Clock size={14} /> WAITING SIGNAL...
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}