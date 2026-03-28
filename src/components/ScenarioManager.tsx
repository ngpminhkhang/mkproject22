import { useState, useEffect, useMemo } from "react";
import { Plus, Send, Save, Trash2, ChevronDown, ChevronUp, Target, Ban, EyeOff, Zap, LayoutGrid, AlertTriangle, CheckCircle2, Play, Edit3, Lock, ShieldCheck, Brain, Activity, Tag, X, ListPlus, ShieldAlert, Snowflake, StopCircle } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface LibraryItem { id: number; title: string; configuration?: string; }
interface RiskProfile { id: number; title: string; configuration: string; }
interface ScenarioInput { pair: string; direction: "BUY" | "SELL"; entry_price: number; sl_price: number; tp_price: number; volume: number; outlook_id?: string; account_id?: number; }
interface ScenarioExtended extends ScenarioInput { uuid: string; status: string; pnl?: number; analysis_details?: string; pre_trade_checklist?: string; risk_data?: string; images?: string; result_images?: string; setup_id?: number | null; created_at?: number; htf_trend?: string; market_phase?: string; dealing_range?: string; narrative?: string; scenario_type?: string; execution_score?: number; }
interface ScenarioManagerProps { accountId?: number; prefillData?: any; onClearPrefill?: () => void; }

const ALL_PAIRS = ["XAUUSD", "BITCOIN", "US30", "NAS100", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "EURJPY", "GBPJPY"];
const DEFAULT_TAGS = ["CPI", "NFP", "FOMC", "PPI", "GDP", "Monday", "Friday", "EOW", "London_Open", "NY_Open", "Asia_Range", "Expansion", "Retracement", "Reversal", "Consolidation", "Risk_On", "Risk_Off", "Holiday"];
const SIGNAL_FEATURES = [
    { id: "macro", label: "1. Macro Bias & Capital Flow", options: [{ label: "Macro Aligned", val: 20 }, { label: "Neutral", val: 10 }, { label: "Counter Macro", val: 0 }] },
    { id: "trend", label: "2. HTF Structure", options: [{ label: "Trend Aligned", val: 15 }, { label: "Range-bound", val: 7 }, { label: "Counter Trend", val: 0 }] },
    { id: "liquidity", label: "3. Liquidity Event", options: [{ label: "Clear Sweep", val: 20 }, { label: "Minor Sweep", val: 10 }, { label: "No Sweep", val: 0 }] },
    { id: "structure", label: "4. Market Structure", options: [{ label: "Clear BOS/ChoCH", val: 15 }, { label: "Weak Shift", val: 7 }, { label: "No Shift", val: 0 }] },
    { id: "location", label: "5. Location (Premium/Discount)", options: [{ label: "Ideal Location", val: 10 }, { label: "Neutral", val: 5 }, { label: "Sub-optimal", val: 0 }] },
    { id: "session", label: "6. Session Timing", options: [{ label: "London/NY Impulse", val: 10 }, { label: "Late Session", val: 5 }, { label: "Asian Session", val: 0 }] },
    { id: "volatility", label: "7. Volatility Matrix", options: [{ label: "High Volatility", val: 10 }, { label: "Medium Volatility", val: 5 }, { label: "Low Volatility", val: 0 }] }
];

const getMultiplier = (pair: string) => { if (!pair) return 100000; if (pair.includes("JPY")) return 1000; if (pair.includes("XAU") || pair.includes("BTC") || pair.includes("BITCOIN")) return 100; if (pair.includes("US30") || pair.includes("NAS")) return 1; return 100000; };
const getUsdBias = (pair: string, direction: string) => { const p = pair.toUpperCase(); const isBuy = direction === "BUY"; if (p.startsWith("USD")) return isBuy ? 1 : -1; if (p.endsWith("USD") || p.startsWith("XAU") || p.startsWith("BTC") || p.startsWith("US30") || p.startsWith("NAS")) return isBuy ? -1 : 1; return 0; };
const getMondayLocal = (d: Date) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); date.setDate(diff); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - (offset * 60000)).toISOString().split('T')[0]; };

// GIAO DIỆN PHẲNG LỲ MỚI 
const styles = {
    container: (isMobile: boolean) => ({ display: "flex", flexDirection: isMobile ? "column" : "row" as any, minHeight: "100%", fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: '#f8fafc', padding: isMobile ? '12px' : '16px', gap: '16px' }),
    column: { background: "#ffffff", borderRadius: "12px", border: '1px solid #e2e8f0', display: "flex", flexDirection: "column" as "column", overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    header: (bgColor: string, borderColor: string) => ({ padding: '14px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgColor, transition: 'all 0.3s', cursor: 'pointer' }),
    title: { margin: 0, fontSize: '14px', color: '#0f172a', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 900, textTransform: 'uppercase' as any },
    button: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 },
    scenarioCard: (isSelected: boolean, direction: 'BUY' | 'SELL') => ({ padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#eff6ff' : '#f8fafc', border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderLeft: `4px solid ${direction === 'BUY' ? '#10b981' : '#ef4444'}`, transition: 'all 0.2s' }),
    statusBadge: (status: string) => {
        let bg = '#f1f5f9'; let color = '#475569';
        if (status === 'PENDING') { bg = '#fef3c7'; color = '#b45309'; } 
        else if (status === 'PENDING_EXEC' || status === 'ACTIVE' || status === 'FILLED') { bg = '#dcfce7'; color = '#15803d'; }
        return { fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' as 'uppercase', color, background: bg };
    },
    actionBtn: (color: string, bg: string) => ({ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', background: bg, color: color, cursor: 'pointer', transition: '0.2s' }),
    bigButton: (type: 'save' | 'execute', disabled: boolean) => ({ flex: 1, height: '44px', borderRadius: '8px', background: disabled ? '#e2e8f0' : (type === 'save' ? '#f8fafc' : '#3b82f6'), color: disabled ? '#94a3b8' : (type === 'save' ? '#0f172a' : '#ffffff'), border: type === 'save' && !disabled ? '1px solid #cbd5e1' : 'none', fontWeight: 900, fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' })
};

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', fontWeight: 700, outline: 'none', color: '#0f172a' };
const labelStyle = { fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' as 'uppercase', letterSpacing: '0.5px' };

const SectionHeader = ({ title, icon: Icon, isOpen, onClick, sub, colorTheme }: any) => {
    let bg = '#ffffff'; let border = '#e2e8f0'; let iconColor = '#64748b';
    if (colorTheme === 'orange') { bg = '#fffbeb'; border = '#fde68a'; iconColor = '#d97706'; } 
    if (colorTheme === 'blue') { bg = '#eff6ff'; border = '#bfdbfe'; iconColor = '#2563eb'; } 
    if (colorTheme === 'purple') { bg = '#faf5ff'; border = '#e9d5ff'; iconColor = '#9338ea'; }
    
    return (
        <div onClick={onClick} style={styles.header(bg, border) as any}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 900, color: isOpen ? '#0f172a' : '#64748b', fontSize: '13px' }}>
                <Icon size={16} color={isOpen ? iconColor : '#94a3b8'} />
                <span>{title}</span>
                {sub && <span style={{ fontSize: '10px', color: iconColor, background: '#ffffff', padding: '2px 8px', borderRadius: '99px', border: `1px solid ${border}` }}>{sub}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>{isOpen ? <ChevronUp size={16} color={iconColor} /> : <ChevronDown size={16} color="#94a3b8" />}</div>
        </div>
    );
}

const PriceInput = ({ label, value, onChange, color, disabled, placeholder }: any) => (
    <div style={{ flex: 1, minWidth: '120px' }}>
        <label style={{ ...labelStyle, color: color }}>{label}</label>
        <input type="number" step="any" value={value === undefined || value === 0 ? "" : value} disabled={disabled} placeholder={placeholder} onFocus={(e) => e.target.select()} onChange={e => { const val = e.target.value; onChange(val === "" ? 0 : parseFloat(val)); }} style={{ ...inputStyle, borderColor: disabled ? '#e2e8f0' : `${color}60`, background: disabled ? '#f8fafc' : '#ffffff', fontWeight: 900, color: color }} />
    </div>
);

const RiskField = ({ label, value, onChange, isOverRisk, color }: any) => (
    <div style={{ flex: 1 }}>
        <label style={{ fontSize: '10px', color: isOverRisk ? '#dc2626' : '#64748b', fontWeight: 900, marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>{label}</label>
        {onChange ? (
            <input type="number" step="0.01" value={value} onChange={e => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} style={{ width: '100%', fontSize: '16px', fontWeight: 900, border: 'none', borderBottom: isOverRisk ? '2px solid #dc2626' : '1px dashed #cbd5e1', color: isOverRisk ? '#dc2626' : '#0f172a', background: 'transparent', outline: 'none', padding: '4px 0' }} />
        ) : (
            <div style={{ fontSize: '16px', fontWeight: 900, color: color || '#0f172a', padding: '4px 0', borderBottom: '1px dashed transparent' }}>{value}</div>
        )}
    </div>
);

export default function ScenarioManager({ accountId = 1, prefillData, onClearPrefill }: ScenarioManagerProps) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // ... [GIỮ NGUYÊN TOÀN BỘ KHỐI STATE CỦA SẾP DƯỚI ĐÂY] ...
    const [scenarios, setScenarios] = useState<ScenarioExtended[]>([]);
    const [setupLibrary, setSetupLibrary] = useState<LibraryItem[]>([]);
    const [exitLibrary, setExitLibrary] = useState<LibraryItem[]>([]);
    const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
    const [scenarioTypes, setScenarioTypes] = useState<LibraryItem[]>([]);
    const [contextTagsLib, setContextTagsLib] = useState<LibraryItem[]>([]);
    const [accountBalance, setAccountBalance] = useState(10000);
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<"CONTEXT" | "SCENARIO" | "EXEC">("CONTEXT");
    const [isEditMode, setIsEditMode] = useState(false);
    const [portfolioState, setPortfolioState] = useState<{ mode: string, current_usd_bias: number, account_status: string, account_weight: number, total_equity: number } | null>(null);
    const [outlookData, setOutlookData] = useState({ sentiment: 'MIXED', bias: 'NEUTRAL' });
    const [plannedPairs, setPlannedPairs] = useState<string[]>([]);
    const [myMood, setMyMood] = useState("FOCUSED");
    const [form, setForm] = useState<ScenarioInput>({ pair: "XAUUSD", direction: "BUY", entry_price: 0, sl_price: 0, tp_price: 0, volume: 0 });
    const [context, setContext] = useState({ htf_trend: 'Bullish', market_phase: 'Expansion', dealing_range: 'Discount', narrative: "" });
    const [scenarioType, setScenarioType] = useState("");
    const [selectedSetupId, setSelectedSetupId] = useState<number | null>(null);
    const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
    const [checklistItems, setChecklistItems] = useState<string[]>([]);
    const [signalScores, setSignalScores] = useState<Record<string, number>>({});
    const [selectedRiskProfileId, setSelectedRiskProfileId] = useState<string>("");
    const [orderType, setOrderType] = useState<"LIMIT" | "STOP" | "MARKET">("LIMIT");
    const [exitStrats, setExitStrats] = useState<string[]>([]);
    const [isManualVolume, setIsManualVolume] = useState(false);
    const [isAddingExit, setIsAddingExit] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const loadStaticData = async () => {
        try {
            const baseUrl = "https://mk-project19-1.onrender.com/api";
            const [sLib, eLib, risksStr, typesStr, tagsStr] = await Promise.all([
                fetch(`${baseUrl}/library/?category=SETUP`).then(r => r.ok ? r.json() : []), fetch(`${baseUrl}/library/?category=EXIT_STRAT`).then(r => r.ok ? r.json() : []),
                fetch(`${baseUrl}/library/?category=RISK_MODEL`).then(r => r.ok ? r.json() : []), fetch(`${baseUrl}/library/?category=SCENARIO_TYPE`).then(r => r.ok ? r.json() : []), fetch(`${baseUrl}/library/?category=CONTEXT_TAG`).then(r => r.ok ? r.json() : [])
            ]);
            setSetupLibrary(Array.isArray(sLib) ? sLib : []); setExitLibrary(Array.isArray(eLib) ? eLib : []); setScenarioTypes(Array.isArray(typesStr) ? typesStr : []); setContextTagsLib(Array.isArray(tagsStr) ? tagsStr : []);
            if (!scenarioType && typesStr && typesStr.length > 0) setScenarioType(typesStr[0].title);
            if (Array.isArray(risksStr)) setRiskProfiles(risksStr.map((r: any) => ({ id: r.id, title: r.title, configuration: r.configuration || "{}" })));
        } catch (e) { console.error("Static Cloud fetching error:", e); }
    };

    const loadDynamicData = async () => {
        try {
            const currentWeek = getMondayLocal(new Date());
            const baseUrl = "https://mk-project19-1.onrender.com/api";
            const [sRes, ceoStateStr, outRes] = await Promise.all([
                fetch(`${baseUrl}/scenarios/?accountId=${accountId}`).then(r => r.ok ? r.json() : []),
                fetch(`${baseUrl}/portfolio/state/?accountId=${accountId}`).then(r => r.ok ? r.json() : { total_equity: 10000, account_weight: 100 }),
                fetch(`${baseUrl}/outlook/current/?week_start=${currentWeek}`).then(r => r.ok ? r.json() : null)
            ]);
            setScenarios(Array.isArray(sRes) ? sRes : []); setPortfolioState(ceoStateStr);
            if (outRes && !outRes.error) {
                setOutlookData({ sentiment: outRes.market_sentiment || 'MIXED', bias: outRes.weekly_bias || 'NEUTRAL' });
                try { const fa = JSON.parse(outRes.fa_bias || "{}"); if (fa.planned && Array.isArray(fa.planned)) setPlannedPairs(fa.planned); } catch (e) {}
            }
            if (ceoStateStr.account_weight >= 0) { setAccountBalance(ceoStateStr.total_equity * (ceoStateStr.account_weight / 100)); }
        } catch (e) { console.error("Dynamic Cloud fetching error:", e); }
    };

    useEffect(() => { loadStaticData(); loadDynamicData(); const i = setInterval(loadDynamicData, 5000); return () => clearInterval(i); }, [accountId]);

    useEffect(() => {
        if (!selectedSetupId) { setChecklistItems([]); return; }
        const setup = setupLibrary.find(s => Number(s.id) === Number(selectedSetupId));
        if (setup && setup.configuration) { try { const config = JSON.parse(setup.configuration); if (config.checklist_items && Array.isArray(config.checklist_items) && config.checklist_items.length > 0) { setChecklistItems(config.checklist_items); return; } } catch (e) {} }
        setChecklistItems([]);
    }, [selectedSetupId, setupLibrary]);

    useEffect(() => {
        if (prefillData) {
            clearForm(); setForm(prev => ({ ...prev, pair: prefillData.pair, direction: prefillData.direction }));
            setContext(prev => ({ ...prev, narrative: `[RADAR] ${prefillData.reason || 'Quick Trade'}\nTags: ${prefillData.tags?.join(", ") || ""}` }));
            setExpandedSection("EXEC"); toast.success(`Target Locked: ${prefillData.pair} (${prefillData.direction})`); if (onClearPrefill) onClearPrefill();
        }
    }, [prefillData]);

    const totalSignalScore = useMemo(() => Object.values(signalScores).reduce((sum, val) => sum + val, 0), [signalScores]);

    const biasCheck = useMemo(() => {
        if (plannedPairs.length === 0) return { status: "NO PLAN", color: "#64748b", text: "CHƯA CÓ PLAN" };
        const planned = plannedPairs.find(p => p.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().startsWith(form.pair.toUpperCase()));
        if (!planned) return { status: "NO PLAN", color: "#64748b", text: "KHÔNG CÓ TRONG PLAN" };
        const parts = planned.split('|'); const dir = parts.length > 1 ? parts[1] : ""; const planDir = (dir.toUpperCase() === 'BUY' || dir.toUpperCase() === 'LONG') ? 'BUY' : 'SELL';
        if (form.direction !== planDir) return { status: "VIOLATION", color: "#dc2626", text: "LỆNH BỘI PHẢN" };
        return { status: "ALIGNED", color: "#10b981", text: "MACRO ALIGNED" };
    }, [form.pair, form.direction, plannedPairs]);

    const riskCalc = useMemo(() => {
        if (orderType === "MARKET") { const panicRisk = accountBalance * 0.02; return { safeLots: 999, riskAmt: panicRisk, rr: 0, riskDisplay: "PANIC (MAX 2% RISK)" }; }
        if (!form.entry_price || !form.sl_price || form.entry_price === form.sl_price) return null;
        const dist = Math.abs(form.entry_price - form.sl_price); const multiplier = getMultiplier(form.pair); const profile = riskProfiles.find(p => String(p.id) === selectedRiskProfileId);
        let riskConfig: any = { type: "PERCENT", value: 1.0 };
        if (profile) { try { const parsed = JSON.parse(profile.configuration); if (parsed.type) riskConfig = parsed; } catch { } }
        let riskAmt = 0; let displayPercent = 0;
        if (riskConfig.type === "FIXED") { riskAmt = riskConfig.value || 100; } else { displayPercent = riskConfig.value || 1.0; riskAmt = accountBalance * (displayPercent / 100); }
        if (portfolioState?.mode === "REDUCED") { riskAmt = riskAmt / 2; displayPercent = displayPercent / 2; }
        let signalMultiplier = 1;
        if (totalSignalScore < 60) signalMultiplier = 0; else if (totalSignalScore >= 60 && totalSignalScore < 70) signalMultiplier = 0.5;
        riskAmt = riskAmt * signalMultiplier; displayPercent = displayPercent * signalMultiplier;
        let lots = Math.floor((riskAmt / (dist * multiplier)) * 100) / 100; lots = lots > 0 ? lots : 0.01; const rr = dist > 0 ? Math.abs(form.tp_price - form.entry_price) / dist : 0;
        let display = riskConfig.type === "FIXED" ? `$${riskConfig.value}` : `${displayPercent.toFixed(2)}%`;
        if (portfolioState?.mode === "REDUCED") display += " (Cut 50%)";
        if (signalMultiplier === 0.5) display += " (Penalty Cut 50%)";
        return { safeLots: lots, riskAmt, rr, riskDisplay: display };
    }, [form, selectedRiskProfileId, accountBalance, riskProfiles, orderType, portfolioState, totalSignalScore]);

    const isOverRisk = riskCalc && form.volume > riskCalc.safeLots;
    const signalScoreCount = Object.keys(signalScores).length;
    const isSignalComplete = signalScoreCount === SIGNAL_FEATURES.length;
    const hasChecklist = checklistItems.length > 0; const checklistScore = Object.values(checklist).filter(Boolean).length;
    const requiredTicks = hasChecklist ? Math.ceil(checklistItems.length * 0.7) : 0; const isChecklistComplete = !hasChecklist || checklistScore >= requiredTicks;
    const isStage2Valid = isSignalComplete && isChecklistComplete && selectedSetupId !== null;
    let validationMessage = "Setup Validated.";
    if (!isSignalComplete) validationMessage = `Thiếu Algo Score (${signalScoreCount}/${SIGNAL_FEATURES.length})`; else if (!selectedSetupId) validationMessage = "Chưa chọn Main Model.";
    else if (!isChecklistComplete) validationMessage = `Thiếu Checklist (${checklistScore}/${requiredTicks})`;
    const isExitValid = exitStrats.length > 0;

    useEffect(() => { if (riskCalc && !isEditMode && !isManualVolume) { setForm(p => ({ ...p, volume: riskCalc.safeLots === 999 ? 0 : riskCalc.safeLots })); } }, [riskCalc, isEditMode, isManualVolume]);

    const isCorrelationBlocked = useMemo(() => {
        if (!portfolioState) return false; const tradeBias = getUsdBias(form.pair, form.direction);
        if (portfolioState.current_usd_bias <= -2 && tradeBias < 0) return true; if (portfolioState.current_usd_bias >= 2 && tradeBias > 0) return true; return false;
    }, [form.pair, form.direction, portfolioState]);

    const isFrozen = portfolioState?.account_status === "FROZEN"; const isHalted = portfolioState?.mode === "HALT"; const isScoreTooLow = totalSignalScore < 60;
    const currentScenario = scenarios.find(s => s.uuid === activeScenarioId);
    const isAlreadyExecuted = currentScenario ? ['PENDING_EXEC', 'ACTIVE', 'FILLED', 'CLOSED', 'MISSED', 'CANCELLED'].includes(currentScenario.status) : false;
    const disableExecution = !isStage2Valid || isOverRisk || isHalted || isCorrelationBlocked || isFrozen || isAlreadyExecuted;

    const loadScenario = (s: ScenarioExtended) => {
        setActiveScenarioId(s.uuid); setIsEditMode(true); setIsManualVolume(true);
        setForm({ pair: s.pair, direction: s.direction as any, entry_price: s.entry_price, sl_price: s.sl_price, tp_price: s.tp_price, volume: s.volume });
        setContext({ htf_trend: s.htf_trend || 'Bullish', market_phase: s.market_phase || 'Expansion', dealing_range: s.dealing_range || 'Discount', narrative: s.narrative || "" });
        setScenarioType(s.scenario_type || (scenarioTypes.length > 0 ? scenarioTypes[0].title : "")); setSelectedSetupId(s.setup_id || null);
        try { const d = JSON.parse(s.analysis_details || "{}"); setExitStrats(d.exit_strats || []); const parsedChecklist = JSON.parse(s.pre_trade_checklist || "{}"); if (parsedChecklist.features) setSignalScores(parsedChecklist.features); if (parsedChecklist.ticks) setChecklist(parsedChecklist.ticks); } catch { }
        setExpandedSection("EXEC");
    };

    const clearForm = () => {
        setActiveScenarioId(null); setIsEditMode(false); setIsManualVolume(false);
        setForm({ pair: "XAUUSD", direction: "BUY", entry_price: 0, sl_price: 0, tp_price: 0, volume: 0 });
        setContext({ htf_trend: 'Bullish', market_phase: 'Expansion', dealing_range: 'Discount', narrative: "" });
        setScenarioType(scenarioTypes.length > 0 ? scenarioTypes[0].title : ""); setSignalScores({}); setChecklist({}); setSelectedSetupId(null);
        setSelectedRiskProfileId(""); setExitStrats([]);
        setExpandedSection("CONTEXT");
    };

    const handleSave = async (andExecute = false) => {
        if (andExecute && orderType !== "MARKET" && !isExitValid) return toast.error("Exit Strategy is mandatory.");
        if (orderType !== "MARKET" && form.entry_price === 0) return toast.error("Cần nhập giá tham chiếu!");
        if (orderType === "MARKET" && form.volume <= 0) return toast.error("LỆNH KHẨN CẤP: Yêu cầu nạp đạn (Volume)!");
        let uuid = activeScenarioId; const riskSnap = riskCalc ? { profile_id: selectedRiskProfileId, safe_lots: riskCalc.safeLots } : {};
        const outlookId = `WEEK-${getMondayLocal(new Date())}`;
        
        if (!uuid) {
            try { const payload = { input: { ...form, outlook_id: outlookId, account_id: accountId } };
                const res = await fetch("https://mk-project19-1.onrender.com/api/scenarios/create/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (!res.ok) throw new Error("API Failure"); const data = await res.json(); uuid = data.uuid;
            } catch (e) { return toast.error("Lỗi tạo Kịch bản: " + e); }
        }

        const complianceDataString = JSON.stringify({ score: totalSignalScore, features: signalScores, mood: myMood, ticks: checklist });
        try {
            const updatePayload = { input: { uuid, analysis: JSON.stringify({ exit_strats: exitStrats, notes: "" }), checklist: complianceDataString, risk_data: JSON.stringify(riskSnap), images: "[]", setup_id: selectedSetupId, entry_price: form.entry_price, sl_price: form.sl_price, tp_price: form.tp_price, volume: form.volume, htf_trend: context.htf_trend, market_phase: context.market_phase, dealing_range: context.dealing_range, narrative: context.narrative, scenario_type: scenarioType } };
            await fetch("https://mk-project19-1.onrender.com/api/scenarios/update/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatePayload) });
            setActiveScenarioId(uuid); toast.success("Đã ghi sổ cái!"); loadDynamicData();
            if (andExecute && uuid) triggerExecution({ ...form, uuid });
        } catch (e) { toast.error("Backend Error: " + e); }
    };

    const triggerExecution = async (scenarioData: any) => {
        const priceText = orderType === "MARKET" ? "MARKET PRICE" : scenarioData.entry_price; 
        if (!confirm(`XÁC NHẬN BÓP CÒ?\n${scenarioData.direction} ${scenarioData.pair} @ ${priceText}\nSize: ${scenarioData.volume} Lots`)) return;
        try {
            const type = orderType === "MARKET" ? (scenarioData.direction === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL") : `${scenarioData.direction}_${orderType}`;
            await fetch("https://mk-project19-1.onrender.com/api/scenarios/execute/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioUuid: scenarioData.uuid, orderType: type }) });
            const resMt5 = await fetch("https://mk-project19-1.onrender.com/api/mt5/direct_fire/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: scenarioData.pair, direction: scenarioData.direction, volume: scenarioData.volume }) });
            if (!resMt5.ok) throw new Error("Bo mạch MT5 từ chối lệnh!");
            toast.success("LÍNH ĐÁNH THUÊ MT5 ĐANG LÊN ĐẠN!"); loadDynamicData();
        } catch (e) { toast.error("Lỗi: " + String(e)); }
    };

    const handleCloseTrade = async (scenario: ScenarioExtended, e: any) => {
        e.stopPropagation();
        if (!confirm(`XÁC NHẬN RÚT QUÂN LỆNH ${scenario.pair}?`)) return;
        try {
            await fetch("https://mk-project19-1.onrender.com/api/scenarios/status/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid: scenario.uuid, status: "CLOSED" }) });
            await fetch("https://mk-project19-1.onrender.com/api/mt5/close_trade/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: scenario.pair, uuid: scenario.uuid }) });
            toast.success("ĐÃ GỬI LỆNH RÚT QUÂN!"); loadDynamicData();
        } catch (e) { toast.error("LỖI LIÊN LẠC: " + String(e)); }
    };

    const handleMarkStatus = async (uuid: string, status: "MISSED" | "CANCELLED", e: any) => {
        e.stopPropagation();
        const reason = prompt(`Lý do ${status}?`, "");
        if (reason !== null) { 
            await fetch("https://mk-project19-1.onrender.com/api/scenarios/status/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid, status }) });
            toast.success(`Marked as ${status}`); loadDynamicData(); 
        }
    };

    const handleDelete = async (s: ScenarioExtended, e: any) => {
        e.stopPropagation();
        if (['CLOSED', 'FILLED', 'ACTIVE', 'PENDING_EXEC'].includes(s.status)) {
            if (confirm("Ẩn lệnh khỏi Radar?")) { 
                await fetch("https://mk-project19-1.onrender.com/api/scenarios/status/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid: s.uuid, status: "ARCHIVED" }) });
                toast.success("Đã ẩn!"); loadDynamicData(); if (activeScenarioId === s.uuid) clearForm();
            }
        } else {
            if (confirm("Xóa vĩnh viễn plan này?")) { 
                await fetch("https://mk-project19-1.onrender.com/api/scenarios/delete/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid: s.uuid }) });
                toast.success("Deleted."); loadDynamicData(); if (activeScenarioId === s.uuid) clearForm(); 
            }
        }
    };

    const tagsToDisplay = useMemo(() => { if (contextTagsLib.length > 0) return contextTagsLib; return DEFAULT_TAGS.map((t, i) => ({ id: `def-${i}`, title: t })); }, [contextTagsLib]);
    const tradeGrade = useMemo(() => { 
        if (totalSignalScore >= 85) return { grade: "A+", color: "#16a34a", text: "FULL ALLOCATION" }; 
        if (totalSignalScore >= 70) return { grade: "B", color: "#2563eb", text: "STANDARD ALLOCATION" }; 
        if (totalSignalScore >= 60) return { grade: "C", color: "#d97706", text: "REDUCED EXPOSURE (-50%)" }; 
        return { grade: "F", color: "#dc2626", text: "EXECUTION BLOCKED" }; 
    }, [totalSignalScore]);

    const isRiskOn = outlookData.sentiment === 'Risk-On'; const isRiskOff = outlookData.sentiment === 'Risk-Off';
    const topBarBg = isRiskOn ? '#dcfce7' : (isRiskOff ? '#fef2f2' : '#ffffff'); 
    const sentimentColor = isRiskOn ? '#166534' : (isRiskOff ? '#991b1b' : '#0f172a');
    const biasStr = outlookData.bias || ""; 
    const isBiasBullish = biasStr.includes('BULLISH') || biasStr.includes('BUY') || biasStr.includes('LONG'); 
    const isBiasBearish = biasStr.includes('BEARISH') || biasStr.includes('SELL') || biasStr.includes('SHORT');
    const biasColor = isBiasBullish ? '#16a34a' : (isBiasBearish ? '#dc2626' : '#d97706');

    return (
        <div style={styles.container(isMobile) as any}>
            <Toaster position="top-right" />
            
            {/* CỘT TRÁI: PENDING SCENARIOS */}
            <div style={{ ...styles.column, width: isMobile ? '100%' : '320px', flexShrink: 0, height: isMobile ? '400px' : 'auto' }}>
                <div style={styles.header('#ffffff', '#e2e8f0') as any}>
                    <h3 style={styles.title}><Target size={16} /> PENDING SCENARIOS</h3>
                    <button onClick={clearForm} style={styles.button}><Plus size={14} /> NEW</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: '12px' }}>
                    {scenarios.filter(s => !['MISSED', 'CANCELLED', 'ARCHIVED'].includes(s.status)).slice(0, 20).map(s => {
                        const isPending = s.status === 'PENDING'; 
                        const isLive = ['PENDING_EXEC', 'ACTIVE', 'FILLED'].includes(s.status); 
                        const isSelected = s.uuid === activeScenarioId;
                        let scoreVal = 0; try { const c = JSON.parse(s.pre_trade_checklist || "{}"); scoreVal = c.score || 0; } catch { }
                        
                        return (
                            <div key={s.uuid} onClick={() => loadScenario(s)} style={styles.scenarioCard(isSelected, s.direction as any)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 900, fontSize: '13px', color: '#0f172a' }}>{s.pair}</div>
                                    <div style={styles.statusBadge(s.status)}>{s.status}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: s.direction === 'BUY' ? '#10b981' : '#ef4444' }}>{s.direction}</span>
                                    {scoreVal > 0 && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 800, color: '#475569' }}>{scoreVal}pt</span>}
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RR: {s.tp_price && s.sl_price ? ((Math.abs(s.tp_price - s.entry_price) / Math.abs(s.entry_price - s.sl_price)).toFixed(1)) : 'N/A'}R</span>
                                </div>
                                
                                {isLive && (
                                    <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900 }}>VOL: {s.volume}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 900, color: (s.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                            {(s.pnl || 0) >= 0 ? '+' : ''}{Number(s.pnl || 0).toFixed(2)}$
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', marginTop: '10px' }}>
                                    {isPending && (<><button onClick={(e) => { e.stopPropagation(); loadScenario(s); triggerExecution(s); }} style={styles.actionBtn('white', '#0f172a')} title="Execute"><Play size={12} /></button><button onClick={(e) => { e.stopPropagation(); loadScenario(s); }} style={styles.actionBtn('#2563eb', '#eff6ff')} title="Edit"><Edit3 size={12} /></button><button onClick={(e) => handleMarkStatus(s.uuid, "MISSED", e)} style={styles.actionBtn('#d97706', '#fffbeb')} title="Missed"><EyeOff size={12} /></button><button onClick={(e) => handleMarkStatus(s.uuid, "CANCELLED", e)} style={styles.actionBtn('#475569', '#f1f5f9')} title="Cancel"><Ban size={12} /></button></>)}
                                    {isLive && (<button onClick={(e) => handleCloseTrade(s, e)} style={styles.actionBtn('white', '#ef4444')} title="Close Position"><StopCircle size={12} /></button>)}
                                    <button onClick={(e) => handleDelete(s, e)} style={styles.actionBtn('#ef4444', '#fef2f2')} title={isPending ? "Xóa" : "Ẩn khỏi màn hình"}><Trash2 size={12} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT TÁC CHIẾN */}
            <div style={{ ...styles.column, flex: 1, overflowY: 'auto' }}>
                
                {/* THANH ĐIỀU KHIỂN TOP */}
                <div style={{ padding: '12px 16px', background: topBarBg, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                        <select value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} style={{ fontSize: '16px', fontWeight: 900, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', flex: isMobile ? 1 : 'none' }}>
                            {ALL_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setForm({ ...form, direction: "BUY" })} style={{ padding: '8px 16px', borderRadius: '6px', border: form.direction === 'BUY' ? '2px solid #10b981' : '1px solid #cbd5e1', background: form.direction === 'BUY' ? '#dcfce7' : 'white', color: form.direction === 'BUY' ? '#166534' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>LONG</button>
                            <button onClick={() => setForm({ ...form, direction: "SELL" })} style={{ padding: '8px 16px', borderRadius: '6px', border: form.direction === 'SELL' ? '2px solid #ef4444' : '1px solid #cbd5e1', background: form.direction === 'SELL' ? '#fef2f2' : 'white', color: form.direction === 'SELL' ? '#991b1b' : '#64748b', fontWeight: 900, cursor: 'pointer' }}>SHORT</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Sentiment</div><div style={{ fontSize: '14px', fontWeight: 900, color: sentimentColor }}>{outlookData.sentiment}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>My Mood</div><select value={myMood} onChange={e => setMyMood(e.target.value)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 800, outline: 'none', color: '#0f172a', background: '#f8fafc' }}><option value="FOCUSED">🧘‍♂️ FOCUSED</option><option value="FOMO">🔥 FOMO</option><option value="REVENGE">🤬 REVENGE</option><option value="TIRED">🥱 TIRED</option></select></div>
                        <div style={{ textAlign: 'center', borderRight: isMobile ? 'none' : '1px solid #cbd5e1', paddingRight: isMobile ? 0 : '16px' }}><div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Weekly Bias</div><div style={{ fontSize: '14px', fontWeight: 900, color: biasColor, textTransform: 'uppercase' }}>{outlookData.bias}</div></div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {plannedPairs.map(p => {
                                const [sym, dir] = p.split('|'); const cleanSym = sym.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(); const isBuy = dir.toUpperCase() === 'BUY' || dir.toUpperCase() === 'LONG';
                                return (<button key={p} onClick={() => setForm({ ...form, pair: cleanSym, direction: isBuy ? "BUY" : "SELL" })} style={{ padding: '4px 10px', borderRadius: '99px', border: `1px solid ${isBuy ? '#bbf7d0' : '#fecaca'}`, background: isBuy ? '#f0fdf4' : '#fef2f2', color: isBuy ? '#16a34a' : '#dc2626', fontSize: '10px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>{cleanSym} {isBuy ? '↑' : '↓'}</button>)
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {biasCheck.status !== "ALIGNED" && (<div style={{ background: biasCheck.color === '#dc2626' ? '#fef2f2' : '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${biasCheck.color}`, color: biasCheck.color, fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={14} /> CẢNH BÁO TỪ HẢI ĐĂNG: {biasCheck.text}</div>)}
                    
                    {/* SECTION 1: CONTEXT */}
                    <SectionHeader title="1. MARKET CONTEXT" icon={Brain} isOpen={expandedSection === "CONTEXT"} onClick={() => setExpandedSection("CONTEXT")} sub="Narrative First" colorTheme="orange" />
                    {expandedSection === "CONTEXT" && (
                        <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div><label style={labelStyle}>HTF Trend</label><select style={inputStyle} value={context.htf_trend} onChange={e => setContext({ ...context, htf_trend: e.target.value })}><option>Bullish</option><option>Bearish</option><option>Range</option></select></div>
                                <div><label style={labelStyle}>Market Phase</label><select style={inputStyle} value={context.market_phase} onChange={e => setContext({ ...context, market_phase: e.target.value })}><option>Expansion</option><option>Retracement</option><option>Accumulation</option><option>Distribution</option></select></div>
                                <div><label style={labelStyle}>Dealing Range</label><select style={inputStyle} value={context.dealing_range} onChange={e => setContext({ ...context, dealing_range: e.target.value })}><option>Discount</option><option>Premium</option><option>Equilibrium</option></select></div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>Narrative & Context</label>
                                    {!isAddingTag && (<button onClick={() => setIsAddingTag(true)} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#0f172a', fontWeight: 800 }}><Tag size={10} /> + Add Tag</button>)}
                                </div>
                                {isAddingTag && (<div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 10 }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{tagsToDisplay.map((t: any) => (<button key={t.id} onClick={() => setContext({ ...context, narrative: (context.narrative + ` [#${t.title}] `).trim() })} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '10px', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>{t.title}</button>))}</div><button onClick={() => setIsAddingTag(false)} style={{ marginTop: 8, fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Close</button></div>)}
                            </div>
                            <textarea value={context.narrative} onChange={e => setContext({ ...context, narrative: e.target.value })} placeholder="VD: H4 đang BOS xuống..." style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                            <div style={{ marginTop: '16px', textAlign: 'right' }}><button onClick={() => setExpandedSection("SCENARIO")} style={styles.button}>Next <ChevronDown size={14} /></button></div>
                        </div>
                    )}

                    {/* SECTION 2: SETUP */}
                    <SectionHeader title="2. SCENARIO & SETUP" icon={LayoutGrid} isOpen={expandedSection === "SCENARIO"} onClick={() => setExpandedSection("SCENARIO")} sub={isStage2Valid ? "Valid" : "Incomplete"} colorTheme="blue" />
                    {expandedSection === "SCENARIO" && (
                        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <div style={{ marginBottom: '16px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>ALGORITHMIC SCORE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 900, color: tradeGrade.color }}>{totalSignalScore}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '9px', color: '#64748b', fontWeight: 800 }}>/100 PTS</span><span style={{ fontSize: '10px', fontWeight: 900, color: tradeGrade.color }}>{tradeGrade.grade}</span></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{SIGNAL_FEATURES.map((feature) => (<div key={feature.id}><label style={{ fontSize: '10px', fontWeight: 900, color: '#475569', marginBottom: '6px', display: 'block' }}>{feature.label}</label><div style={{ display: 'flex', gap: '4px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>{feature.options.map((opt) => { const isSelected = signalScores[feature.id] === opt.val; return (<button key={opt.label} onClick={() => setSignalScores(prev => ({ ...prev, [feature.id]: opt.val }))} style={{ flex: 1, minWidth: isMobile ? '45%' : 'auto', padding: '6px', fontSize: '9px', fontWeight: 800, borderRadius: '4px', cursor: 'pointer', background: isSelected ? '#3b82f6' : '#f8fafc', color: isSelected ? '#ffffff' : '#64748b', border: `1px solid ${isSelected ? '#2563eb' : '#cbd5e1'}` }}>{opt.label} ({opt.val})</button>) })}</div></div>))}</div>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}><label style={labelStyle}>Scenario Type</label><select style={inputStyle} value={scenarioType} onChange={e => setScenarioType(e.target.value)}>{scenarioTypes.length > 0 ? (scenarioTypes.map(t => <option key={t.id} value={t.title}>{t.title}</option>)) : (<option>Loading...</option>)}</select></div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                                <div><label style={labelStyle}>Main Model</label><select value={selectedSetupId || ""} onChange={e => setSelectedSetupId(Number(e.target.value))} style={inputStyle}><option value="">-- Chọn Setup --</option>{setupLibrary.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}</select><div style={{ marginTop: '16px', padding: '12px', background: isStage2Valid ? '#dcfce7' : '#fef2f2', borderRadius: '8px', border: `1px solid ${isStage2Valid ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>{isStage2Valid ? <CheckCircle2 size={18} color="#16a34a" /> : <Lock size={18} color="#dc2626" />}<span style={{ fontSize: '11px', fontWeight: 800, color: isStage2Valid ? '#166534' : '#991b1b' }}>{validationMessage}</span></div></div>
                                <div><label style={labelStyle}>Setup Conditions</label><div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '150px', overflowY: 'auto' }}>{(!selectedSetupId) ? (<div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '10px 0', fontWeight: 600 }}>Vui lòng chọn 'Main Model'</div>) : checklistItems.length === 0 ? (<div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '10px 0', fontWeight: 600 }}>Setup này chưa có Checklist.</div>) : (checklistItems.map((item, i) => (<label key={i} style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '8px', cursor: 'pointer', color: checklist[item] ? '#16a34a' : '#0f172a', fontWeight: 700 }}><input type="checkbox" checked={checklist[item] || false} onChange={e => setChecklist({ ...checklist, [item]: e.target.checked })} /> {item}</label>)))}</div></div>
                            </div>
                            {isStage2Valid && <div style={{ marginTop: '16px', textAlign: 'right' }}><button onClick={() => setExpandedSection("EXEC")} style={styles.button}>Next <ChevronDown size={14} /></button></div>}
                        </div>
                    )}

                    {/* SECTION 3: EXECUTION */}
                    <SectionHeader title="3. RISK MANAGEMENT ENGINE" icon={Zap} isOpen={expandedSection === "EXEC"} onClick={() => setExpandedSection("EXEC")} colorTheme="purple" />
                    {expandedSection === "EXEC" && (
                        <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', opacity: isStage2Valid ? 1 : 0.6, pointerEvents: isStage2Valid ? 'auto' : 'none' }}>
                            
                            {/* Warnings */}
                            {isFrozen && (<div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}><Snowflake size={14} /> LỆNH PHẠT: TÀI KHOẢN ĐÓNG BĂNG.</div>)}
                            {portfolioState?.account_status === "CLAMPED" && (<div style={{ background: '#fffbeb', border: '1px solid #f59e0b', color: '#b45309', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={14} /> CEO CLAMP: CẮT 50% VỐN CẤP PHÁT.</div>)}
                            {portfolioState?.mode === "REDUCED" && !isFrozen && (<div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={14} /> CEO MODE: REDUCED (-50% RISK)</div>)}
                            {isScoreTooLow && (<div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}><Ban size={14} /> SUB-OPTIMAL SIGNAL (Score &lt; 60)</div>)}

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}><label style={labelStyle}>Order Type</label><select value={orderType} onChange={e => setOrderType(e.target.value as any)} style={inputStyle}><option value="LIMIT">LIMIT</option><option value="STOP">STOP</option><option value="MARKET">MARKET</option></select></div>
                                <PriceInput label={orderType === "MARKET" ? "CURRENT PRICE" : "ENTRY PRICE"} value={orderType === "MARKET" ? 0 : form.entry_price} onChange={(v: number) => setForm({ ...form, entry_price: v })} color="#2563eb" disabled={orderType === "MARKET"} placeholder="Nhập giá" />
                                <PriceInput label="STOP LOSS" value={form.sl_price} onChange={(v: number) => setForm({...form, sl_price: v })} color="#ef4444" />
                                <PriceInput label="TAKE PROFIT" value={form.tp_price} onChange={(v: number) => setForm({ ...form, tp_price: v })} color="#10b981" />
                            </div>

                            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '11px', color: '#7e22ce', fontWeight: 900, display: 'flex', gap: '4px', alignItems: 'center' }}><Activity size={14} /> DYNAMIC RISK ENGINE</h4>
                                    <div style={{ textAlign: 'right' }}><span style={{ fontSize: '10px', fontWeight: 900, color: '#6b21a8' }}>Risk: {riskCalc?.riskDisplay} | Expected: {riskCalc ? riskCalc.rr.toFixed(2) : '0.00'}R</span></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                                    <RiskField label="SAFE LOTS (CALC)" value={riskCalc && riskCalc.safeLots !== 999 ? riskCalc.safeLots.toFixed(2) : 'PANIC'} color="#0f172a" />
                                    <RiskField label="ACTUAL VOLUME" value={form.volume} onChange={(v: number) => { setIsManualVolume(true); setForm({ ...form, volume: v }); }} isOverRisk={isOverRisk} />
                                    <div><label style={labelStyle}>RISK PROFILE</label><select value={selectedRiskProfileId} onChange={e => setSelectedRiskProfileId(e.target.value)} style={{ ...inputStyle, border: '1px solid #e9d5ff' }}><option value="">-- Manual (1%) --</option>{riskProfiles.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><ShieldCheck size={14} color="#0f172a" /><label style={{ ...labelStyle, marginBottom: 0, color: '#0f172a' }}>4. EXIT STRATEGY (Required)</label></div>{!isAddingExit && (<button onClick={() => setIsAddingExit(true)} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#0f172a', fontWeight: 800 }}><ListPlus size={12} /> Add Strat</button>)}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: isAddingExit ? 10 : 0 }}>{exitStrats.map(strat => (<div key={strat} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#166534' }}>{strat}<button onClick={() => setExitStrats(p => p.filter(s => s !== strat))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#15803d' }}><X size={12} /></button></div>))}</div>
                                {isAddingExit && (<div style={{ padding: 10, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{exitLibrary.filter(ex => !exitStrats.includes(ex.title)).map(ex => (<button key={ex.id} onClick={() => { setExitStrats(p => [...p, ex.title]); setIsAddingExit(false); }} style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 800, color: '#0f172a' }}>{ex.title}</button>))}</div><button onClick={() => setIsAddingExit(false)} style={{ marginTop: 8, fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancel</button></div>)}
                            </div>

                            {isHalted && (<div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', color: '#dc2626', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', border: '1px solid #fecaca', fontSize: '11px' }}><Ban size={16} /> LỆNH HALT: HỆ THỐNG ĐÓNG BĂNG</div>)}
                            {!isHalted && isCorrelationBlocked && (<div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', color: '#b45309', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', border: '1px solid #fde68a', fontSize: '11px' }}><AlertTriangle size={16} /> CEO WARNING: VI PHẠM TƯƠNG QUAN QUỸ</div>)}

                            <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <button onClick={() => handleSave(false)} style={styles.bigButton('save', false) as any}><Save size={16} /> SAVE PLAN</button>
                                <button onClick={() => handleSave(true)} disabled={disableExecution} style={styles.bigButton('execute', disableExecution) as any}><Send size={16} /> {isAlreadyExecuted ? "ĐÃ THỰC THI" : "EXECUTE TRADE"}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}