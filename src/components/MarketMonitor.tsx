import { useState, useEffect } from "react";
import { Zap, Clock, LayoutGrid, Volume2, VolumeX, ArrowRightCircle, Activity, Settings, Check, Skull } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';
import { motion } from "framer-motion";

//--- TYPES
interface MarketSignal {
    symbol: string;
    direction: "BUY" | "SELL" | "NEUTRAL";
    active_tags: string[];
    is_alerting: boolean;
    score: number;
    timestamp: number;
}

interface MonitorCardItem {
    symbol: string;
    bias: "BUY" | "SELL" | "NEUTRAL";
    signal?: MarketSignal;
    lastUpdate: number;
}

const ALL_TAGS_DEF = [
    { id: 'FIBO_GOLD', label: 'Fibo Golden (38-61)', group: 'MANUAL' },
    { id: 'ZONE_TOUCH', label: 'Price In Zone', group: 'MANUAL' },
    { id: 'STOCH_OB', label: 'Stoch > 70 (Sell)', group: 'OSCILLATOR' },
    { id: 'STOCH_OS', label: 'Stoch < 30 (Buy)', group: 'OSCILLATOR' },
    { id: 'MACD_CROSS_UP', label: 'MACD Cross Up', group: 'TREND' },
    { id: 'MACD_CROSS_DOWN', label: 'MACD Cross Down', group: 'TREND' },
    { id: 'MACD_POS', label: 'MACD > 0', group: 'TREND' },
    { id: 'MACD_NEG', label: 'MACD < 0', group: 'TREND' },
];

export default function MarketMonitor({ onTradeNow }: { onTradeNow: (s: any) => void }) {
    const [monitorList, setMonitorList] = useState<MonitorCardItem[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isMt5Alive, setIsMt5Alive] = useState(false);
    const [cardSettings, setCardSettings] = useState<{ [symbol: string]: string[] }>({});
    const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
    const [dismissedSignals, setDismissedSignals] = useState<string[]>([]);
    const [activeTrades, setActiveTrades] = useState<any[]>([]);

    const getMondayLocal = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - (offset * 60000)).toISOString().split('T')[0];
    };

    useEffect(() => {
        const saved = localStorage.getItem("MONITOR_CARD_SETTINGS");
        if (saved) setCardSettings(JSON.parse(saved));
    }, []);

    const saveCardSetting = (symbol: string, tags: string[]) => {
        const newSettings = { ...cardSettings, [symbol]: tags };
        setCardSettings(newSettings);
        localStorage.setItem("MONITOR_CARD_SETTINGS", JSON.stringify(newSettings));
    };

    const playSound = () => {
        if (!soundEnabled) return;
        const audio = new Audio('/ping.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    };

    const dismissSignal = (symbol: string) => {
        setDismissedSignals(prev => [...prev, symbol]);
        toast.success(`Đã tắt cảnh báo ${symbol}`);
        setTimeout(() => {
            setDismissedSignals(prev => prev.filter(s => s !== symbol));
        }, 60000);
    };

    // ĐỘNG CƠ HÚT DỮ LIỆU TỪ ĐÁM MÂY (THAY THẾ TAURI INVOKE)
    const syncData = async () => {
        try {
            // Giả lập trạng thái MT5 (Sếp có thể gắn API check heartbeat thật sau)
            setIsMt5Alive(true); 

            const weekDate = getMondayLocal(new Date());
            
            // 1. Hút Ngọn Hải Đăng để lấy Danh sách rình mồi
            const outRes = await fetch(`https://mk-project19-1.onrender.com/api/outlook/current/?week_start=${weekDate}`);
            const map = new Map<string, MonitorCardItem>();
            
            if (outRes.ok) {
                const outData = await outRes.json();
                if (outData.fa_bias) {
                    try {
                        const fa = JSON.parse(outData.fa_bias);
                        if (Array.isArray(fa.planned)) {
                            fa.planned.forEach((s: string) => {
                                const [symRaw, dirRaw] = s.split('|');
                                const cleanSym = symRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                map.set(cleanSym, {
                                    symbol: cleanSym,
                                    bias: dirRaw.toUpperCase() === 'BUY' || dirRaw.toUpperCase() === 'LONG' ? 'BUY' : 'SELL',
                                    lastUpdate: 0
                                });
                            });
                        }
                    } catch (e) { console.error("Parse Outlook Error", e); }
                }
            }

            // 2. Hút tín hiệu Radar từ MT5
            try {
                const sigRes = await fetch("https://mk-project19-1.onrender.com/api/mt5/radar/");
                if (sigRes.ok) {
                    const sigData = await sigRes.json();
                    const signals: MarketSignal[] = sigData.radar_blips || [];
                    const now = Date.now();
                    
                    signals.forEach(sig => {
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
            } catch (e) { /* Bỏ qua nếu Radar rỗng */ }

            setMonitorList(Array.from(map.values()));

        } catch (e) { console.error(e); setIsMt5Alive(false); }
    };

    useEffect(() => {
        const i = setInterval(syncData, 2000); // Quét 2 giây 1 lần
        return () => clearInterval(i);
    }, [soundEnabled, dismissedSignals]);

    // HÀM CHUYỂN TRANG KHAI HỎA
    const handleTradeClick = (item: MonitorCardItem, activeTags: string[]) => {
        const payload = {
            pair: item.symbol,
            direction: item.bias,
            reason: `Radar Alert: ${activeTags.join(", ")}`,
            tags: activeTags
        };
        localStorage.setItem("MFJA_QUICK_TRADE", JSON.stringify(payload));
        if (onTradeNow) onTradeNow(payload);
    };

    const HeartbeatIndicator = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: isMt5Alive ? '#f0fdf4' : '#fef2f2', borderRadius: '20px', border: `1px solid ${isMt5Alive ? '#bbf7d0' : '#fecaca'}` }}>
            <Activity size={16} color={isMt5Alive ? '#16a34a' : '#dc2626'} className={isMt5Alive ? "pulse-anim" : ""} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: isMt5Alive ? '#166534' : '#991b1b' }}>{isMt5Alive ? "MT5 LIVE" : "DISCONNECTED"}</span>
            <style>{`.pulse-anim { animation: pulse 1.5s infinite; } @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={{ margin: 0, color: '#1e293b', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '24px' }}>
                        <LayoutGrid size={28} className="text-blue-600" /> Market Monitor
                    </h1>
                    <HeartbeatIndicator />
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                    {soundEnabled ? <Volume2 size={20} color="#16a34a" /> : <VolumeX size={20} color="#94a3b8" />}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* LƯỚI RADAR (TRÁI) */}
                <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', alignContent: 'start' }}>
                    {monitorList.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            <h3>Chưa có cặp tiền nào trong Outlook Plan tuần này.</h3>
                            <p>Vui lòng sang tab Outlook &rarr; Matrix &rarr; Chọn cặp tiền &rarr; Click SYNC TO NODE.</p>
                        </div>
                    )}
                    {monitorList.map(item => {
                        const hasSignal = item.signal && (Date.now() - item.lastUpdate < 300000);
                        const activeTags = hasSignal ? (item.signal?.active_tags || []) : [];
                        const isPlanBuy = item.bias === 'BUY';
                        const planColor = isPlanBuy ? '#16a34a' : '#dc2626';
                        const isAligned = hasSignal && (item.signal?.direction === item.bias || item.signal?.direction === 'NEUTRAL');
                        const selectedTagIds = cardSettings[item.symbol] || ['FIBO_GOLD', 'ZONE_TOUCH', 'MACD_CROSS_UP', 'STOCH_OS'];
                        const isEditing = editingSymbol === item.symbol;

                        return (
                            <motion.div key={item.symbol} layout style={{
                                background: 'white', borderRadius: '12px', padding: '15px', position: 'relative',
                                border: hasSignal ? (isAligned ? `2px solid ${planColor}` : '2px solid #f59e0b') : '1px solid #e2e8f0',
                                boxShadow: hasSignal ? '0 8px 20px rgba(0,0,0,0.1)' : 'none',
                                animation: (hasSignal && isAligned) ? 'pulse-border 2s infinite' : 'none'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#1e293b' }}>{item.symbol}</div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: planColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ArrowRightCircle size={12} style={{ transform: isPlanBuy ? 'rotate(-45deg)' : 'rotate(45deg)' }} />
                                            OUTLOOK: {item.bias}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        {hasSignal && (
                                            <button onClick={() => dismissSignal(item.symbol)} title="Tắt tiếng 1 phút" style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <VolumeX size={14} color="#dc2626" />
                                            </button>
                                        )}
                                        <button onClick={() => setEditingSymbol(isEditing ? null : item.symbol)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            <Settings size={18} color={isEditing ? '#2563eb' : '#cbd5e1'} />
                                        </button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', zIndex: 10 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>CHỌN TAG HIỂN THỊ:</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
                                            {ALL_TAGS_DEF.map(def => {
                                                const isSelected = selectedTagIds.includes(def.id);
                                                return (
                                                    <div key={def.id} onClick={() => {
                                                        let newTags = [...selectedTagIds];
                                                        if (isSelected) newTags = newTags.filter(t => t !== def.id);
                                                        else { if (newTags.length >= 4) newTags.shift(); newTags.push(def.id); }
                                                        saveCardSetting(item.symbol, newTags);
                                                    }} style={{ fontSize: '10px', padding: '6px', cursor: 'pointer', borderRadius: '4px', background: isSelected ? '#eff6ff' : 'white', border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, color: isSelected ? '#1d4ed8' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        {isSelected && <Check size={12} />} {def.label}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <button onClick={() => setEditingSymbol(null)} style={{ width: '100%', marginTop: '10px', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>DONE</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        {[0, 1, 2, 3].map(i => {
                                            const tagId = selectedTagIds[i];
                                            if (!tagId) return <div key={i} style={{ height: '32px', border: '1px dashed #e2e8f0', borderRadius: '6px' }} />;
                                            const tagDef = ALL_TAGS_DEF.find(t => t.id === tagId) || { id: tagId, label: tagId, group: 'OTHER' };
                                            const isActive = activeTags.includes(tagId);
                                            return (
                                                <div key={i} style={{ padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', background: isActive ? (isPlanBuy ? '#dcfce7' : '#fee2e2') : '#f8fafc', color: isActive ? (isPlanBuy ? '#166534' : '#991b1b') : '#94a3b8', border: `1px solid ${isActive ? (isPlanBuy ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}`, opacity: isActive ? 1 : 0.6, transition: 'all 0.3s' }}>
                                                    {tagDef.label}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {hasSignal ? (
                                    <button onClick={() => handleTradeClick(item, activeTags)} style={{ width: '100%', padding: '12px', background: planColor, borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'pulse 2s infinite' }}>
                                        <Zap size={18} fill="white" /> THẨM VẤN & KHAI HỎA
                                    </button>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '12px', background: '#f1f5f9', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={16} /> WAITING SIGNAL...
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* CỘT ACTIVE EXPOSURE (PHẢI) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '500px' }}>
                    <h3 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #fecaca', paddingBottom: '15px' }}>
                        <Skull size={18} /> ACTIVE EXPOSURE (LIVE)
                    </h3>
                    
                    {activeTrades.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                            Súng đã khóa chốt. Tiền đang cất trong két.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Chỗ này sếp tự chèn danh sách lệnh đang chạy vào sau */}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
                }
            `}</style>
        </div>
    );
}