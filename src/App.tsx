import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, CalendarDays, Crosshair, BookOpen,
  Library, Settings, Radio, LineChart, User, Globe, Lock, Unlock,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";

// IMPORT SYSTEM COMPONENTS
import Dashboard from "./components/Dashboard";
import WeeklyForm from "./components/WeeklyForm";
import ScenarioManager from "./components/ScenarioManager";
import TradeJournal from "./components/TradeJournal";
import WeeklyReviewHub from "./components/WeeklyReviewHub";
import SystemLibrary from "./components/SystemLibrary";
import SettingsPage from "./components/Settings"; 
import MarketMonitor from "./components/MarketMonitor";

(window as any).isCEO = false;

export default function App() {
  // ĐẶT DASHBOARD LÀM TRANG MẶC ĐỊNH
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState(1);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isCEO, setIsCEO] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false); 

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const method = config?.method?.toUpperCase() || 'GET';
      if (!(window as any).isCEO && ['POST', 'PUT', 'DELETE'].includes(method)) {
        toast.error("ACCESS DENIED: GUEST MODE. Institutional credentials required.", {
          style: { background: '#ef4444', color: 'white', fontWeight: 'bold' }
        });
        return Promise.resolve(new Response(JSON.stringify({ error: "READ-ONLY MODE" }), { status: 403 }));
      }
      return originalFetch(...args);
    };
    return () => { window.fetch = originalFetch; }; 
  }, []);

  useEffect(() => {
    setAccounts([{ id: 1, name: "Master Fund (AUM)", balance: 100000 }]);
    setActiveAccountId(1);
  }, []);

  const handleSecretClick = () => {
    if (isCEO) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      const pwd = prompt("SECURITY PROTOCOL: ENTER CEO PASSCODE");
      if (pwd === "MFJA") {
        (window as any).isCEO = true;
        setIsCEO(true);
        toast.success("CEO PROTOCOL ACTIVATED. SYSTEM UNLOCKED.", { style: { background: '#16a34a', color: 'white', fontWeight: 'bold' }});
      } else {
        toast.error("INVALID CREDENTIALS. INTRUSION LOGGED.");
      }
      setClickCount(0);
    }
  };

  // ĐÃ XÓA AUM TERMINAL, NÂNG CẤP DASHBOARD
  const MENU_GROUPS = [
    { group: "CORE PORTFOLIO", items: [{ id: "dashboard", label: "Quant Terminal", icon: Globe }] },
    { group: "ALPHA ENGINE", items: [{ id: "outlook", label: "Macro Outlook", icon: CalendarDays }, { id: "monitor", label: "Market Monitor", icon: Radio }, { id: "scenario", label: "Execution Node", icon: Crosshair }] },
    { group: "LEDGER & AUDIT", items: [{ id: "journal", label: "Trade Ledger", icon: BookOpen }, { id: "review", label: "System Audit", icon: LineChart }] },
    { group: "INFRASTRUCTURE", items: [{ id: "library", label: "System Library", icon: Library }, { id: "config", label: "Global Config", icon: Settings }] }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="top-right" />
      
      <aside style={{ width: isCollapsed ? '80px' : '260px', transition: 'width 0.3s ease', background: '#0f172a', display: 'flex', flexDirection: 'column', color: '#f8fafc', flexShrink: 0, borderRight: '1px solid #1e293b' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', userSelect: 'none' }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={handleSecretClick} style={{ background: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '20px', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                M
              </div>
              <div>
                <div style={{ fontSize: '18px', letterSpacing: '1px', fontWeight: 900 }}>MFJA <span style={{ color: '#3b82f6' }}>PRO</span></div>
              </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            {isCollapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '20px 0' : '20px 12px', display: 'flex', flexDirection: 'column', gap: '20px', scrollbarWidth: 'none' }}>
          {MENU_GROUPS.map((grp, idx) => (
            <div key={idx}>
              {!isCollapsed ? (
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>{grp.group}</div>
              ) : (
                <div style={{ height: '1px', background: '#1e293b', margin: '0 20px 15px 20px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isCollapsed ? 'center' : 'stretch' }}>
                {grp.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: isCollapsed ? '12px' : '10px 12px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        background: isActive ? '#1e293b' : 'transparent', border: 'none',
                        borderRadius: '8px', color: isActive ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer', fontWeight: isActive ? 700 : 500, fontSize: '13px',
                        transition: 'all 0.2s', boxShadow: isActive && !isCollapsed ? 'inset 2px 0 0 #3b82f6' : 'none'
                      }}
                    >
                      <Icon size={20} color={isActive ? '#60a5fa' : '#64748b'} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {isCollapsed ? (
            <div title={isCEO ? "CEO MODE ACTIVE" : "GUEST (READ-ONLY)"} style={{ padding: '8px', borderRadius: '8px', background: isCEO ? '#166534' : '#7f1d1d', color: isCEO ? '#dcfce7' : '#fecaca', border: `1px solid ${isCEO ? '#15803d' : '#991b1b'}` }}>
              {isCEO ? <Unlock size={16} /> : <Lock size={16} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, background: isCEO ? '#166534' : '#7f1d1d', color: isCEO ? '#dcfce7' : '#fecaca', border: `1px solid ${isCEO ? '#15803d' : '#991b1b'}`, letterSpacing: '0.5px', justifyContent: 'center' }}>
              {isCEO ? <Unlock size={14} /> : <Lock size={14} />}
              {isCEO ? "CEO MODE ACTIVE" : "GUEST (READ-ONLY)"}
            </div>
          )}

          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#020617', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <User size={16} color="#64748b" />
              <select value={activeAccountId} onChange={(e) => setActiveAccountId(Number(e.target.value))} style={{ background: 'transparent', color: '#f8fafc', border: 'none', fontWeight: 700, outline: 'none', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
                {accounts.map(acc => <option key={acc.id} value={acc.id} style={{ color: '#0f172a' }}>{acc.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', background: '#f1f5f9' }}>
        {activeTab === "dashboard" && <Dashboard accountId={activeAccountId} />}
        {activeTab === "outlook" && <WeeklyForm accountId={activeAccountId} onSendToScenario={(sig) => { setPrefillData(sig); setActiveTab("scenario"); }} />}
        {activeTab === "monitor" && <MarketMonitor onTradeNow={(signal: any) => { setPrefillData(signal); setActiveTab("scenario"); }} />}
        {activeTab === "scenario" && <ScenarioManager accountId={activeAccountId} prefillData={prefillData} onClearPrefill={() => setPrefillData(null)} />}
        {activeTab === "journal" && <TradeJournal accountId={activeAccountId} />}
        {activeTab === "review" && <WeeklyReviewHub accountId={activeAccountId} />}
        {activeTab === "library" && <SystemLibrary />}
        {activeTab === "config" && <SettingsPage accountId={activeAccountId} />}
      </main>
    </div>
  );
}