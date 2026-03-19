import { useState, useEffect, useMemo } from "react";
import {
  Plus, Send, Save, Trash2, ChevronDown, ChevronUp, Target, Ban,
  EyeOff, Zap, AlertTriangle, CheckCircle2, Play, Edit3, Lock, ShieldCheck, Brain,
  Activity, Tag, X, ListPlus, ShieldAlert, Snowflake, Gauge
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// ========== TYPES & INTERFACES ==========
interface LibraryItem { id: number; title: string; configuration?: string; }
interface RiskProfile { id: number; title: string; configuration: string; }
interface ScenarioInput { pair: string; direction: "BUY" | "SELL"; entry_price: number; sl_price: number; tp_price: number; volume: number; outlook_id?: string; account_id?: number; }
interface ScenarioExtended extends ScenarioInput { uuid: string; status: string; pnl?: number; analysis_details?: string; pre_trade_checklist?: string; risk_data?: string; images?: string; result_images?: string; setup_id?: number | null; created_at?: number; htf_trend?: string; market_phase?: string; dealing_range?: string; narrative?: string; scenario_type?: string; execution_score?: number; }
interface ScenarioManagerProps { accountId: number; prefillData?: any; onClearPrefill?: () => void; }

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

const getMultiplier = (pair: string) => {
  if (!pair) return 100000;
  if (pair.includes("JPY")) return 1000;
  if (pair.includes("XAU") || pair.includes("BTC") || pair.includes("BITCOIN")) return 100;
  if (pair.includes("US30") || pair.includes("NAS")) return 1;
  return 100000;
};

const getUsdBias = (pair: string, direction: string) => {
  const p = pair.toUpperCase(); const isBuy = direction === "BUY";
  if (p.startsWith("USD")) return isBuy ? 1 : -1;
  if (p.endsWith("USD") || p.startsWith("XAU") || p.startsWith("BTC") || p.startsWith("US30") || p.startsWith("NAS")) return isBuy ? -1 : 1;
  return 0;
};

//--- STYLES
const styles = {
  container: { display: "flex", height: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: '#f1f5f9', padding: '20px', gap: '20px' },
  column: { background: "white", borderRadius: "16px", border: '1px solid #cbd5e1', display: "flex", flexDirection: "column" as "column", overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  header: (bgColor: string, borderColor: string) => ({ padding: '16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgColor, transition: 'all 0.3s' }),
  title: { margin: 0, fontSize: '15px', color: '#1e293b', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700, letterSpacing: '-0.5px' },
  button: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' },
  scenarioCard: (isSelected: boolean, direction: 'BUY' | 'SELL') => ({ padding: '14px', marginBottom: '10px', borderRadius: '10px', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'white', border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderLeft: `5px solid ${direction === 'BUY' ? '#22c55e' : '#ef4444'}`, transition: 'all 0.2s', boxShadow: isSelected ? '0 4px 6px rgba(37, 99, 235, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)' }),
  statusBadge: (isActive: boolean, isClosed: boolean) => ({ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' as 'uppercase', color: isActive ? '#15803d' : (isClosed ? '#475569' : '#b45309'), background: isActive ? '#dcfce7' : (isClosed ? '#f1f5f9' : '#fef3c7') }),
  actionBtn: (color: string, bg: string) => ({ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', background: bg, color: color, cursor: 'pointer', transition: '0.2s' }),
  bigButton: (type: 'save' | 'execute', disabled: boolean) => ({ flex: 1, height: '48px', borderRadius: '10px', background: disabled ? '#e2e8f0' : (type === 'save' ? '#fff' : '#0f172a'), color: disabled ? '#94a3b8' : (type === 'save' ? '#475569' : '#fff'), border: type === 'save' && !disabled ? '2px solid #cbd5e1' : 'none', fontWeight: 800, fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: disabled ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' })
};
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 500, transition: 'border-color 0.2s', outline: 'none' };
const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' as 'uppercase' };

const SectionHeader = ({ title, icon: Icon, isOpen, onClick, sub, colorTheme }: any) => {
  let bg = '#f8fafc'; let border = '#e2e8f0'; let iconColor = '#64748b';
  if (colorTheme === 'orange') { bg = '#fff7ed'; border = '#ffedd5'; iconColor = '#ea580c'; }
  if (colorTheme === 'blue') { bg = '#eff6ff'; border = '#dbeafe'; iconColor = '#2563eb'; }
  if (colorTheme === 'purple') { bg = '#faf5ff'; border = '#f3e8ff'; iconColor = '#9338ea'; }
  return (
    <div onClick={onClick} style={styles.header(bg, border) as any}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 700, color: isOpen ? '#1e293b' : '#64748b', fontSize: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '6px', background: isOpen ? 'white' : 'transparent', boxShadow: isOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
          <Icon size={18} color={isOpen ? iconColor : '#94a3b8'} />
        </div>
        <span>{title}</span>
        {sub && <span style={{ fontSize: '11px', color: iconColor, background: 'white', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${border}` }}>{sub}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{isOpen ? <ChevronUp size={18} color={iconColor} /> : <ChevronDown size={18} />}</div>
    </div>
  );
}

const PriceInput = ({ label, value, onChange, color, disabled, placeholder }: any) => (
  <div style={{ flex: 1 }}>
    <label style={{ ...labelStyle, color: color }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input type="number" step="any" value={value === undefined || value === 0 ? "" : value} disabled={disabled} placeholder={placeholder} onFocus={(e) => e.target.select()} onChange={e => { const val = e.target.value; onChange(val === "" ? 0 : parseFloat(val)); }} style={{ ...inputStyle, borderColor: disabled ? '#f1f5f9' : `${color}60`, background: disabled ? '#f8fafc' : 'white', fontWeight: 'bold', color: color, paddingLeft: '12px' }} />
    </div>
  </div>
);

const RiskField = ({ label, value, onChange, isOverRisk, color }: any) => (
  <div>
    <label style={{ fontSize: '10px', color: isOverRisk ? '#dc2626' : '#64748b', fontWeight: 700, marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>{label}</label>
    {onChange ? (
      <input type="number" step="0.01" value={value} onChange={e => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} style={{ width: '100%', fontSize: '18px', fontWeight: 800, border: 'none', borderBottom: isOverRisk ? '2px solid #dc2626' : '1px dashed #cbd5e1', color: isOverRisk ? '#dc2626' : '#0f172a', background: 'transparent', outline: 'none', padding: '4px 0' }} />
    ) : (<div style={{ fontSize: '18px', fontWeight: 800, color: color || '#0f172a', padding: '4px 0', borderBottom: '1px dashed transparent' }}>{value}</div>)}
  </div>
);

const MT5Thumbnail = ({ path }: { path: string }) => {
  if (!path) return null;
  return <img src={path} style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0', cursor: 'zoom-in' }} onError={(e) => e.currentTarget.style.display = 'none'} alt="thumb" />
};

export default function ScenarioManager({ accountId, prefillData, onClearPrefill }: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<ScenarioExtended[]>([]);
  const [setupLibrary, setSetupLibrary] = useState<LibraryItem[]>([]);
  const [exitLibrary, setExitLibrary] = useState<LibraryItem[]>([]);
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [scenarioTypes, setScenarioTypes] = useState<LibraryItem[]>([]);
  const [contextTagsLib, setContextTagsLib] = useState<LibraryItem[]>([]);
  const [accountBalance, setAccountBalance] = useState(10000);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"CONTEXT" | "SCENARIO" | "EXEC" | "MANAGE">("CONTEXT");
  const [isEditMode, setIsEditMode] = useState(false);
  const [portfolioState, setPortfolioState] = useState<{ mode: string, current_usd_bias: number, account_status: string, account_weight: number, total_equity: number } | null>(null);
  const [form, setForm] = useState<ScenarioInput>({ pair: "XAUUSD", direction: "BUY", entry_price: 0, sl_price: 0, tp_price: 0, volume: 0 });
  const [context, setContext] = useState({ htf_trend: 'Bullish', market_phase: 'Expansion', dealing_range: 'Discount', narrative: "" });
  const [scenarioType, setScenarioType] = useState("");
  const [selectedSetupId, setSelectedSetupId] = useState<number | null>(null);
  const [signalScores, setSignalScores] = useState<Record<string, number>>({});
  const [selectedRiskProfileId, setSelectedRiskProfileId] = useState<string>("");
  const [orderType, setOrderType] = useState<"LIMIT" | "STOP" | "MARKET">("LIMIT");
  const [exitStrats, setExitStrats] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isManualVolume, setIsManualVolume] = useState(false);
  const [isAddingExit, setIsAddingExit] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [radarTicketId, setRadarTicketId] = useState<number | null>(null);

  const loadInitialData = async () => {
    try {
      const [sRes, sLib, eLib, risksStr, settStr, typesStr, tagsStr, ceoStateStr] = await Promise.all([
        fetch(`https://mk-project19-1.onrender.com/api/scenarios/?accountId=${accountId}`).then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=SETUP').then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=EXIT_STRAT').then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=RISK_MODEL').then(r => r.json()),
        fetch(`https://mk-project19-1.onrender.com/api/settings/?accountId=${accountId}`).then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=SCENARIO_TYPE').then(r => r.json()),
        fetch('https://mk-project19-1.onrender.com/api/library/?category=CONTEXT_TAG').then(r => r.json()),
        fetch(`https://mk-project19-1.onrender.com/api/portfolio/state/?accountId=${accountId}`).then(r => r.json())
      ]);
      setScenarios(sRes);
      setSetupLibrary(sLib);
      setExitLibrary(eLib);
      setScenarioTypes(typesStr);
      setContextTagsLib(tagsStr);
      setPortfolioState(ceoStateStr);
      if (!scenarioType && typesStr.length > 0) setScenarioType(typesStr[0].title);
      setRiskProfiles(risksStr.map((r: any) => ({ id: r.id, title: r.title, configuration: r.configuration || "{}" })));
      const pState = ceoStateStr;
      const settings = settStr;
      if (pState.account_weight >= 0) {
        setAccountBalance(pState.total_equity * (pState.account_weight / 100));
      } else {
        setAccountBalance(settings.initial_balance || 10000);
      }
    } catch (e) { console.error("Data fetching error:", e); }
  };

  useEffect(() => { loadInitialData(); }, [accountId]);
  useEffect(() => { const i = setInterval(() => { loadInitialData(); }, 5000); return () => clearInterval(i); }, []);

  useEffect(() => {
    if (prefillData) {
        clearForm();
        setForm(prev => ({ ...prev, pair: prefillData.pair, direction: prefillData.direction }));
        // LƯU LẠI MÃ VÉ ĐỂ TÍ NỮA XẾP DUYỆT!
        if (prefillData.ticket_id) setRadarTicketId(prefillData.ticket_id);
    }
    setExpandedSection("EXEC");
    toast.success(`Dịch chuyển: ${prefillData?.pair}`);
    if (onClearPrefill) onClearPrefill();
}, [prefillData]);

  const totalSignalScore = useMemo(() => Object.values(signalScores).reduce((sum, val) => sum + val, 0), [signalScores]);

  const riskCalc = useMemo(() => {
    if (!form.entry_price || !form.sl_price || form.entry_price === form.sl_price) return null;
    const dist = Math.abs(form.entry_price - form.sl_price);
    const multiplier = getMultiplier(form.pair);
    const profile = riskProfiles.find(p => String(p.id) === selectedRiskProfileId);
    let riskConfig: any = { type: "PERCENT", value: 1.0 };
    
    if (profile) {
      try {
        const parsed = JSON.parse(profile.configuration);
        if (parsed.type) riskConfig = parsed;
      } catch {}
    }

    let riskAmt = 0; let displayPercent = 0;
    if (riskConfig.type === "FIXED") {
      riskAmt = riskConfig.value || 100;
    } else if (riskConfig.type === "KELLY") {
      const W = riskConfig.win_rate || 0.5;
      const R = riskConfig.avg_rr || 1.5;
      let K = W - ((1 - W) / R);
      if (K < 0) K = 0.001;
      const baseRisk = riskConfig.base_risk || 2.0;
      const fraction = riskConfig.fraction || 1.0;
      displayPercent = Math.min(K * 100 * fraction, baseRisk);
      riskAmt = accountBalance * (displayPercent / 100);
    } else {
      displayPercent = riskConfig.value || 1.0;
      riskAmt = accountBalance * (displayPercent / 100);
    }

    if (portfolioState?.mode === "REDUCED") { riskAmt = riskAmt / 2; displayPercent = displayPercent / 2; }
    
    let signalMultiplier = 1;
    if (totalSignalScore < 60) signalMultiplier = 0;
    else if (totalSignalScore >= 60 && totalSignalScore < 70) signalMultiplier = 0.5;
    
    riskAmt = riskAmt * signalMultiplier;
    displayPercent = displayPercent * signalMultiplier;
    
    let lots = Math.floor((riskAmt / (dist * multiplier)) * 100) / 100;
    lots = lots > 0 ? lots : 0.01;
    
    const rr = dist > 0 ? Math.abs(form.tp_price - form.entry_price) / dist : 0;
    let display = riskConfig.type === "FIXED" ? `$${riskConfig.value}` : `${displayPercent.toFixed(2)}%`;
    if (portfolioState?.mode === "REDUCED") display += " (Cut 50%)";
    if (signalMultiplier === 0.5) display += " (Signal Penalty: Cut 50%)";
    
    return { safeLots: lots, riskAmt, rr, riskDisplay: display };
  }, [form, selectedRiskProfileId, accountBalance, riskProfiles, orderType, portfolioState, totalSignalScore]);

  const isOverRisk = riskCalc && form.volume > riskCalc.safeLots;
  const isStage2Valid = Object.keys(signalScores).length === SIGNAL_FEATURES.length && selectedSetupId !== null;
  const isExitValid = exitStrats.length > 0;

  useEffect(() => {
    if (riskCalc && !isEditMode && !isManualVolume) { setForm(p => ({ ...p, volume: riskCalc.safeLots })); }
  }, [riskCalc, isEditMode, isManualVolume]);

  const isCorrelationBlocked = useMemo(() => {
    if (!portfolioState) return false;
    const tradeBias = getUsdBias(form.pair, form.direction);
    if (portfolioState.current_usd_bias <= -2 && tradeBias < 0) return true;
    if (portfolioState.current_usd_bias >= 2 && tradeBias > 0) return true;
    return false;
  }, [form.pair, form.direction, portfolioState]);

  const isFrozen = portfolioState?.account_status === "FROZEN";
  const isHalted = portfolioState?.mode === "HALT";
  const isScoreTooLow = totalSignalScore < 60;
  const disableExecution = false;

  const loadScenario = (s: ScenarioExtended) => {
    setActiveScenarioId(s.uuid); setIsEditMode(true); setIsManualVolume(true);
    setForm({ pair: s.pair, direction: s.direction as any, entry_price: s.entry_price, sl_price: s.sl_price, tp_price: s.tp_price, volume: s.volume });
    setContext({ htf_trend: s.htf_trend || 'Bullish', market_phase: s.market_phase || 'Expansion', dealing_range: s.dealing_range || 'Discount', narrative: s.narrative || "" });
    setScenarioType(s.scenario_type || (scenarioTypes.length > 0 ? scenarioTypes[0].title : ""));
    setSelectedSetupId(s.setup_id || null);
    try {
      const d = JSON.parse(s.analysis_details || "{}"); setExitStrats(d.exit_strats || []);
      setImages(JSON.parse(s.images || "[]"));
      const parsedChecklist = JSON.parse(s.pre_trade_checklist || "{}");
      if (parsedChecklist.features) { setSignalScores(parsedChecklist.features); } else { setSignalScores({}); }
    } catch {}
    setExpandedSection("EXEC");
  };

  const clearForm = () => {
    setActiveScenarioId(null); setIsEditMode(false); setIsManualVolume(false);
    setForm({ pair: "XAUUSD", direction: "BUY", entry_price: 0, sl_price: 0, tp_price: 0, volume: 0 });
    setContext({ htf_trend: 'Bullish', market_phase: 'Expansion', dealing_range: 'Discount', narrative: "" });
    setScenarioType(scenarioTypes.length > 0 ? scenarioTypes[0].title : "");
    setSignalScores({}); setSelectedSetupId(null); setSelectedRiskProfileId(""); setExitStrats([]);
    setExpandedSection("CONTEXT");
  };

  const handleSave = async (andExecute = false) => {
    
    if (form.entry_price === 0) return toast.error("Valid price parameters required for calculation.");
    
    let uuid = activeScenarioId;
    const riskSnap = riskCalc ? { profile_id: selectedRiskProfileId, safe_lots: riskCalc.safeLots } : {};
    const getMondayLocal = (d: Date) => {
      const date = new Date(d); const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); date.setDate(diff);
      const offset = date.getTimezoneOffset();
      return new Date(date.getTime() - (offset * 60000)).toISOString().split('T')[0];
    };
    const outlookId = `WEEK-${getMondayLocal(new Date())}`;

    if (!uuid) {
      try {
        const payload = { input: { ...form, outlook_id: outlookId, account_id: accountId } };
        const res = await fetch("https://mk-project19-1.onrender.com/api/scenarios/create/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if(!res.ok) throw new Error("API Failure");
        const data = await res.json(); uuid = data.uuid;
      } catch (e) { return toast.error("Initialization failure: " + e); }
    }

    const complianceDataString = JSON.stringify({ score: totalSignalScore, features: signalScores });
    try {
      const updatePayload = {
        input: {
          uuid, analysis: JSON.stringify({ exit_strats: exitStrats, notes: "" }),
          checklist: complianceDataString, risk_data: JSON.stringify(riskSnap),
          images: JSON.stringify(images), setup_id: selectedSetupId,
          entry_price: form.entry_price, sl_price: form.sl_price, tp_price: form.tp_price, volume: form.volume,
          htf_trend: context.htf_trend, market_phase: context.market_phase, dealing_range: context.dealing_range,
          narrative: context.narrative, scenario_type: scenarioType
        }
      };
      await fetch("https://mk-project19-1.onrender.com/api/scenarios/update/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatePayload) });
      setActiveScenarioId(uuid); toast.success("Quantitative Scenario Stored."); loadInitialData();
      if (andExecute && uuid) triggerExecution({ ...form, uuid });
    } catch (e) { toast.error("Backend Error: " + e); }
  };

  const triggerExecution = async (scenarioData: any) => {
    if (!confirm(`TỔNG TƯ LỆNH XÁC NHẬN KHAI HỎA?\n${scenarioData.direction} ${scenarioData.pair}\nKhối lượng: ${scenarioData.volume} Lots`)) return;

    try {
        // Cắm ống truyền dịch thẳng vào cổng API MT5
        const res = await fetch("https://mk-project19-1.onrender.com/api/mt5/approve/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                ticket_id: radarTicketId, // Bắn đúng cái vé sếp đang xem
                approved_lot: scenarioData.volume 
            })
        });

        if (!res.ok) throw new Error("Cổng phê duyệt sập!");
        toast.success("ĐÃ ĐÓNG DẤU TRIỆN! LÍNH ĐÁNH THUÊ ĐANG LÊN ĐẠN!");
        
        // Bắn xong thì xé vé
        setRadarTicketId(null);
        loadInitialData();
    } catch (e) {
        toast.error("Lỗi bo mạch: " + e);
    }
};

  const handleMarkStatus = async (uuid: string, status: "MISSED" | "CANCELLED", e: any) => {
    e.stopPropagation();
    const reason = prompt(`Reason for ${status}?`, "");
    if (reason !== null) {
      await fetch("https://mk-project19-1.onrender.com/api/scenarios/status/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid, status }) });
      toast.success(`Status updated to ${status}`); loadInitialData();
    }
  };

  const handleDelete = async (uuid: string, e: any) => {
    e.stopPropagation();
    if (confirm("Permanently delete this scenario?")) {
      await fetch("https://mk-project19-1.onrender.com/api/scenarios/delete/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uuid }) });
      toast.success("Deleted."); loadInitialData();
      if (activeScenarioId === uuid) clearForm();
    }
  };

  const tagsToDisplay = useMemo(() => {
    if (contextTagsLib.length > 0) return contextTagsLib;
    return DEFAULT_TAGS.map((t, i) => ({ id: `def-${i}`, title: t }));
  }, [contextTagsLib]);

  const tradeGrade = useMemo(() => {
    if (totalSignalScore >= 85) return { grade: "A+", color: "#16a34a", text: "FULL ALLOCATION" };
    if (totalSignalScore >= 70) return { grade: "B", color: "#2563eb", text: "STANDARD ALLOCATION" };
    if (totalSignalScore >= 60) return { grade: "C", color: "#d97706", text: "REDUCED EXPOSURE (-50%)" };
    return { grade: "F", color: "#dc2626", text: "EXECUTION BLOCKED" };
  }, [totalSignalScore]);

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      <div style={{ ...styles.column, width: '320px' }}>
        <div style={styles.header('#f8fafc', '#e2e8f0') as any}>
          <h3 style={styles.title}><Target size={18} /> PENDING SCENARIOS ({scenarios.filter(s => !['MISSED', 'CANCELLED'].includes(s.status)).length})</h3>
          <button onClick={clearForm} style={styles.button}><Plus size={14} /> COMPOSE</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: '12px' }}>
          {scenarios.filter(s => !['MISSED', 'CANCELLED'].includes(s.status)).slice(0, 10).map(s => {
            const isActive = s.status === 'FILLED' || s.status === 'ACTIVE';
            const isSelected = s.uuid === activeScenarioId;
            const isClosed = s.status === 'CLOSED';
            let imgs: string[] = [];
            try { imgs = [...JSON.parse(s.images || "[]"), ...JSON.parse(s.result_images || "[]")]; } catch {}
            let scoreVal = 0;
            try { const c = JSON.parse(s.pre_trade_checklist || "{}"); scoreVal = c.score || 0; } catch {}

            return (
              <div key={s.uuid} onClick={() => loadScenario(s)} style={styles.scenarioCard(isSelected, s.direction as any)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{s.pair}</div>
                  <div style={styles.statusBadge(isActive, isClosed)}>{s.status}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: s.direction === 'BUY' ? '#166534' : '#991b1b' }}>{s.direction}</span>
                  {scoreVal > 0 && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', color: '#475569' }}>{scoreVal}pt</span>}
                  -
                  <span style={{ fontSize: '12px', color: '#64748b' }}>RR: {s.tp_price && s.sl_price ? ((Math.abs(s.tp_price - s.entry_price) / Math.abs(s.entry_price - s.sl_price)).toFixed(1)) : 'N/A'}R</span>
                </div>
                {imgs.length > 0 && (<div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>{imgs.map((path: string, idx: number) => <MT5Thumbnail key={idx} path={path} />)}</div>)}
                
                {!isClosed && (
                  <div style={{ display: 'flex', gap: '5px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                    {!isActive && <button onClick={(e) => { e.stopPropagation(); triggerExecution(s); }} style={styles.actionBtn('white', '#0f172a')} title="Execute"><Play size={14} /></button>}
                    <button onClick={(e) => { e.stopPropagation(); loadScenario(s); }} style={styles.actionBtn('#1d4ed8', '#eff6ff')} title="Edit"><Edit3 size={14} /></button>
                    <button onClick={(e) => handleMarkStatus(s.uuid, "MISSED", e)} style={styles.actionBtn('#d97706', '#fffbeb')} title="Omit"><EyeOff size={14} /></button>
                    <button onClick={(e) => handleMarkStatus(s.uuid, "CANCELLED", e)} style={styles.actionBtn('#475569', '#f1f5f9')} title="Cancel"><Ban size={14} /></button>
                    <button onClick={(e) => handleDelete(s.uuid, e)} style={styles.actionBtn('#ef4444', '#fef2f2')} title="Delete"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...styles.column, flex: 1 }}>
        <div style={{ padding: '15px 25px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '25px', alignItems: 'center' }}>
          <select value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} style={{ fontSize: '18px', fontWeight: 'bold', padding: '10px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '160px', outline: 'none' }}>
            {ALL_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => setForm({ ...form, direction: "BUY" })} style={{ width: '100px', padding: '10px 0', borderRadius: '8px', border: form.direction === 'BUY' ? '2px solid #16a34a' : '1px solid #cbd5e1', background: form.direction === 'BUY' ? '#dcfce7' : 'white', color: form.direction === 'BUY' ? '#15803d' : '#64748b', fontWeight: '800', cursor: 'pointer', boxShadow: form.direction === 'BUY' ? '0 4px 6px -1px rgba(22, 163, 74, 0.2)' : 'none' }}>LONG</button>
            <button onClick={() => setForm({ ...form, direction: "SELL" })} style={{ width: '100px', padding: '10px 0', borderRadius: '8px', border: form.direction === 'SELL' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: form.direction === 'SELL' ? '#fee2e2' : 'white', color: form.direction === 'SELL' ? '#991b1b' : '#64748b', fontWeight: '800', cursor: 'pointer', boxShadow: form.direction === 'SELL' ? '0 4px 6px -1px rgba(220, 38, 38, 0.2)' : 'none' }}>SHORT</button>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'center', background: '#f8fafc', padding: '5px 15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>PORTFOLIO USD EXPOSURE</span>
            <div style={{ fontSize: '16px', fontWeight: 900, color: portfolioState?.current_usd_bias! >= 2 ? '#dc2626' : (portfolioState?.current_usd_bias! <= -2 ? '#dc2626' : '#2563eb') }}>
              {portfolioState?.current_usd_bias! > 0 ? `+${portfolioState?.current_usd_bias} (LONG)` : portfolioState?.current_usd_bias! < 0 ? `${portfolioState?.current_usd_bias} (SHORT)` : 'NEUTRAL'}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SectionHeader title="1. MACRO & CONTEXT" icon={Brain} isOpen={expandedSection === "CONTEXT"} onClick={() => setExpandedSection("CONTEXT")} sub="Narrative First" colorTheme="orange" />
          {expandedSection === "CONTEXT" && (
            <div style={{ padding: '25px', background: '#fff7ed' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label style={labelStyle}>HTF Trend</label><select style={inputStyle} value={context.htf_trend} onChange={e => setContext({ ...context, htf_trend: e.target.value })}><option>Bullish</option><option>Bearish</option><option>Range</option></select></div>
                <div><label style={labelStyle}>Market Phase</label><select style={inputStyle} value={context.market_phase} onChange={e => setContext({ ...context, market_phase: e.target.value })}><option>Expansion</option><option>Retracement</option><option>Accumulation</option><option>Distribution</option></select></div>
                <div><label style={labelStyle}>Dealing Range</label><select style={inputStyle} value={context.dealing_range} onChange={e => setContext({ ...context, dealing_range: e.target.value })}><option>Discount</option><option>Premium</option><option>Equilibrium</option></select></div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Fundamental Narrative</label>
                  {!isAddingTag && (<button onClick={() => setIsAddingTag(true)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px dashed #94a3b8', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontWeight: 600 }}><Tag size={12} />+ Add Catalyst</button>)}
                </div>
                {isAddingTag && (
                  <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #fdba74', marginBottom: 10 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tagsToDisplay.map((t: any) => (<button key={t.id} onClick={() => setContext({ ...context, narrative: (context.narrative + ` [#${t.title}]`).trim() })} style={{ padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff7ed', fontSize: '11px', color: '#c2410c', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{t.title}</button>))}
                    </div>
                    <button onClick={() => setIsAddingTag(false)} style={{ marginTop: 8, fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Close</button>
                  </div>
                )}
              </div>
              <textarea value={context.narrative} onChange={e => setContext({ ...context, narrative: e.target.value })} placeholder="e.g., H4 structural shift indicates deeper retracement..." style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '14px', outline: 'none' }} />
              <div style={{ marginTop: '20px', textAlign: 'right' }}><button onClick={() => setExpandedSection("SCENARIO")} style={styles.button}>Next <ChevronDown size={14} /></button></div>
            </div>
          )}

          <SectionHeader title="2. QUANTITATIVE SIGNAL ENGINE" icon={Gauge} isOpen={expandedSection === "SCENARIO"} onClick={() => setExpandedSection("SCENARIO")} sub={isStage2Valid ? `Score: ${totalSignalScore}/100` : "Score Scenario"} colorTheme="blue" />
          {expandedSection === "SCENARIO" && (
            <div style={{ padding: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>Algorithmic Assessment</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: tradeGrade.color }}>{totalSignalScore}</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>/100 Points</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: tradeGrade.color }}>{tradeGrade.grade} GRADE</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {SIGNAL_FEATURES.map((feature) => (
                      <div key={feature.id}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'block' }}>{feature.label}</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {feature.options.map((opt) => {
                            const isSelected = signalScores[feature.id] === opt.val;
                            return (
                              <button key={opt.label} onClick={() => setSignalScores(prev => ({ ...prev, [feature.id]: opt.val }))} style={{ flex: 1, padding: '6px 4px', fontSize: '10px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', background: isSelected ? '#3b82f6' : 'white', color: isSelected ? 'white' : '#64748b', border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1', boxShadow: isSelected ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none' }}>
                                {opt.label} ({opt.val})
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>Execution Type</label>
                    <select style={inputStyle} value={scenarioType} onChange={e => setScenarioType(e.target.value)}>
                      {scenarioTypes.length > 0 ? (scenarioTypes.map((t: any) => <option key={t.id} value={t.title}>{t.title}</option>)) : (<option>Initializing Data...</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>Primary Entry Model</label>
                    <select value={selectedSetupId || ""} onChange={e => setSelectedSetupId(Number(e.target.value))} style={inputStyle}>
                      <option value="">-- Select Entry Model --</option>
                      {setupLibrary.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop: '25px', padding: '20px', background: isStage2Valid ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', border: isStage2Valid ? '1px solid #bbf7d0' : '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {isStage2Valid ? <CheckCircle2 size={24} color="#16a34a" /> : <Lock size={24} color="#dc2626" />}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isStage2Valid ? '#166534' : '#991b1b' }}>
                        {isStage2Valid ? "Algorithmic Validation Confirmed." : `Parameters Missing (${Object.keys(signalScores).length}/${SIGNAL_FEATURES.length}).`}
                      </span>
                      {isStage2Valid && <span style={{ fontSize: '11px', color: '#15803d', marginTop: 4 }}>Capital Allocation Constraint: {tradeGrade.text}</span>}
                    </div>
                  </div>
                </div>
              </div>
              {isStage2Valid && <div style={{ marginTop: '25px', textAlign: 'right' }}><button onClick={() => setExpandedSection("EXEC")} style={styles.button}>Next <ChevronDown size={14} /></button></div>}
            </div>
          )}

          <SectionHeader title="3. ALGORITHMIC SIZING & RISK" icon={Zap} isOpen={expandedSection === "EXEC"} onClick={() => setExpandedSection("EXEC")} colorTheme="purple" />
          {expandedSection === "EXEC" && (
            <div style={{ padding: '25px', opacity: isStage2Valid ? 1 : 0.6, pointerEvents: isStage2Valid ? 'auto' : 'none' }}>
              
              {isFrozen && (
                <div style={{ background: '#fef2f2', border: '1px dashed #ef4444', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Snowflake size={18} /> ADMIN PENALTY: ACCOUNT FROZEN. Allocated capital = 0. Execution disabled.
                </div>
              )}
              {portfolioState?.account_status === "CLAMPED" && (
                <div style={{ background: '#fffbeb', border: '1px dashed #f59e0b', color: '#b45309', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} /> ADMIN CLAMP: Risk exposure reduced. Capital allocation algorithmically halved.
                </div>
              )}
              {portfolioState?.mode === "REDUCED" && !isFrozen && (
                <div style={{ background: '#fef3c7', border: '1px dashed #f59e0b', color: '#b45309', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={18} /> GLOBAL MODE: REDUCED (System-wide risk halved).
                </div>
              )}
              {isScoreTooLow && (
                <div style={{ background: '#fef2f2', border: '1px dashed #ef4444', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ban size={18} /> SUB-OPTIMAL SIGNAL (Score &lt; 60): Fails quantitative threshold. Execution prohibited.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '25px', marginBottom: '30px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Order Type</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value as any)} style={inputStyle}>
                    <option value="LIMIT">LIMIT</option><option value="STOP">STOP</option><option value="MARKET">MARKET</option>
                  </select>
                </div>
                <PriceInput label={orderType === "MARKET" ? "EST. MARKET PRICE" : "TARGET ENTRY"} value={form.entry_price} onChange={(v: number) => setForm({ ...form, entry_price: v })} color="#2563eb" disabled={false} placeholder="Input entry vector..." />
                <PriceInput label="INVALIDATION (SL)" value={form.sl_price} onChange={(v: number) => setForm({ ...form, sl_price: v })} color="#ef4444" disabled={false} />
                <PriceInput label="TARGET (TP)" value={form.tp_price} onChange={(v: number) => setForm({ ...form, tp_price: v })} color="#10b981" disabled={false} />
              </div>

              <div style={{ background: '#faf5ff', padding: '25px', borderRadius: '16px', border: '1px solid #f3e8ff', marginBottom: '30px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#7e22ce', fontWeight: 800, display: 'flex', gap: '6px', alignItems: 'center' }}><Activity size={16} /> DYNAMIC RISK ENGINE (AUM Base: ${accountBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})</h4>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b21a8' }}>Risk: {riskCalc?.riskDisplay} | Projected RR: {riskCalc ? riskCalc.rr.toFixed(2) : '0.00'}R</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', alignItems: 'center' }}>
                  <RiskField label="ALGORITHMIC LOT SIZE" value={riskCalc ? riskCalc.safeLots.toFixed(2) : '--'} color="#0f172a" />
                  <RiskField label="OVERRIDE VOLUME" value={form.volume} onChange={(v: number) => { setIsManualVolume(true); setForm({ ...form, volume: v }); }} isOverRisk={isOverRisk} />
                  <div>
                    <label style={labelStyle}>RISK ARCHITECTURE</label>
                    <select value={selectedRiskProfileId} onChange={e => setSelectedRiskProfileId(e.target.value)} style={{ ...inputStyle, border: '1px solid #d8b4fe' }}>
                      <option value="">-- Fixed Model (1%) --</option>
                      {riskProfiles.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ShieldCheck size={18} color="#475569" />
                    <label style={{ ...labelStyle, marginBottom: 0 }}>4. EXIT PROTOCOL (Mandatory)</label>
                  </div>
                  {!isAddingExit && (<button onClick={() => setIsAddingExit(true)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px dashed #94a3b8', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontWeight: 600 }}><ListPlus size={14} /> Link Protocol</button>)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: isAddingExit ? 10 : 0 }}>
                  {exitStrats.map(strat => (
                    <div key={strat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#166534' }}>
                      {strat}
                      <button onClick={() => setExitStrats(p => p.filter(s => s !== strat))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#15803d' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
                {isAddingExit && (
                  <div style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {exitLibrary.filter(ex => !exitStrats.includes(ex.title)).map(ex => (<button key={ex.id} onClick={() => { setExitStrats(p => [...p, ex.title]); setIsAddingExit(false); }} style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{ex.title}</button>))}
                    </div>
                    <button onClick={() => setIsAddingExit(false)} style={{ marginTop: 10, fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
                  </div>
                )}
              </div>

              {isHalted && (<div style={{ background: '#fef2f2', padding: '15px', borderRadius: '10px', color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid #fecaca' }}><Ban size={20} /> GLOBAL HALT ACTIVE: System execution frozen by Administrator.</div>)}
              {!isHalted && isCorrelationBlocked && (<div style={{ background: '#fffbeb', padding: '15px', borderRadius: '10px', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid #fde68a' }}><AlertTriangle size={20} /> PORTFOLIO RISK WARNING: Order violates fund correlation limits. Execution blocked.</div>)}

              <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => handleSave(false)} style={styles.bigButton('save', false) as any}><Save size={20} /> STORE SCENARIO</button>
                <button onClick={() => handleSave(true)} disabled={disableExecution} style={styles.bigButton('execute', disableExecution) as any}><Send size={20} /> EXECUTE ORDER</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}