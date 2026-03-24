import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, CalendarDays, Crosshair, BookOpen,
  Library, Settings, Radio, LineChart, Globe, Lock, Unlock,
  PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";

import AUMTerminal from './components/AUMTerminal';
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
  const [activeTab, setActiveTab] = useState("aum");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState(1);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isCEO, setIsCEO] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // BỘ NHỚ CHO MENU ĐIỆN THOẠI
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const method = config?.method?.toUpperCase() || 'GET';
      if (!(window as any).isCEO && ['POST', 'PUT', 'DELETE'].includes(method)) {
        toast.error("ACCESS DENIED: GUEST MODE.", { style: { background: '#ef4444', color: 'white', fontWeight: 'bold' } });
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
        toast.success("CEO PROTOCOL ACTIVATED.", { style: { background: '#16a34a', color: 'white', fontWeight: 'bold' }});
      } else {
        toast.error("INVALID CREDENTIALS.");
      }
      setClickCount(0);
    }
  };

  const MENU_GROUPS = [
    { group: "CORE PORTFOLIO", items: [
      { id: "aum", label: "AUM Terminal", icon: Globe }
    ] },
    { group: "NODE COMMAND", items: [
      { id: "dashboard", label: "Quant Terminal", icon: LayoutDashboard },
      { id: "outlook", label: "Macro Outlook", icon: CalendarDays },
      { id: "monitor", label: "Market Monitor", icon: Radio },
      { id: "scenario", label: "Execution Node", icon: Crosshair }
    ] },
    { group: "LEDGER & AUDIT", items: [
      { id: "journal", label: "Trade Ledger", icon: BookOpen }, 
      { id: "review", label: "System Audit", icon: LineChart }
    ] },
    { group: "INFRASTRUCTURE", items: [
      { id: "library", label: "System Library", icon: Library }, 
      { id: "config", label: "Global Config", icon: Settings }
    ] }
  ];

  // CHỈ GIỮ LẠI 4 NÚT QUAN TRỌNG VÀ THÊM NÚT "MENU"
  const MOBILE_MENU = [
    { id: "aum", label: "Home", icon: Globe },
    { id: "dashboard", label: "Quant", icon: LayoutDashboard },
    { id: "outlook", label: "Macro", icon: CalendarDays },
    { id: "scenario", label: "Exec", icon: Crosshair },
    { id: "more", label: "Menu", icon: Menu }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100vw', background: '#ffffff', overflow: 'hidden', fontFamily: "'Inter', sans-serif", margin: 0, padding: 0 }}>
      <style>{`html, body, #root { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #ffffff; } ::-webkit-scrollbar { display: none; } * { scrollbar-width: none; -ms-overflow-style: none; }`}</style>
      <Toaster position="top-right" />
      
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{ width: isCollapsed ? '64px' : '230px', transition: 'width 0.2s ease', background: '#0f172a', display: 'flex', flexDirection: 'column', color: '#f8fafc', flexShrink: 0, borderRight: '1px solid #1e293b', zIndex: 50 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', userSelect: 'none' }}>
            {!isCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div onClick={handleSecretClick} style={{ background: '#2563eb', color: 'white', padding: '6px 10px', borderRadius: '8px', fontWeight: 900, fontSize: '18px', cursor: 'pointer' }}>M</div>
                <div><div style={{ fontSize: '16px', letterSpacing: '0.5px', fontWeight: 900 }}>MFJA <span style={{ color: '#3b82f6' }}>PRO</span></div></div>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '16px 0' : '16px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MENU_GROUPS.map((grp, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                {!isCollapsed ? <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', paddingLeft: '8px' }}>{grp.group}</div> : <div style={{ height: '1px', background: '#1e293b', margin: '0 16px 12px 16px' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: isCollapsed ? 'center' : 'stretch' }}>
                  {grp.items.map(item => {
                    const Icon = item.icon; const isActive = activeTab === item.id;
                    return (
                      <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isCollapsed ? '10px' : '8px 12px', justifyContent: isCollapsed ? 'center' : 'flex-start', background: isActive ? '#1e293b' : 'transparent', border: 'none', borderRadius: '6px', color: isActive ? '#60a5fa' : '#94a3b8', cursor: 'pointer', fontWeight: isActive ? 700 : 500, fontSize: '12px', borderLeft: isActive && !isCollapsed ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.1s' }}>
                        <Icon size={18} color={isActive ? '#60a5fa' : '#64748b'} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      )}

      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', background: isMobile ? '#ffffff' : '#f8fafc', padding: 0, margin: 0, paddingBottom: isMobile ? '70px' : '0' }}>
        {activeTab === "aum" && <AUMTerminal />}
        {activeTab === "dashboard" && <Dashboard accountId={activeAccountId} />}
        {activeTab === "outlook" && <WeeklyForm accountId={activeAccountId} />}
        {activeTab === "monitor" && <MarketMonitor onTradeNow={(signal: any) => { setPrefillData(signal); setActiveTab("scenario"); }} />}
        {activeTab === "scenario" && <ScenarioManager accountId={activeAccountId} prefillData={prefillData} onClearPrefill={() => setPrefillData(null)} />}
        {activeTab === "journal" && <TradeJournal accountId={activeAccountId} />}
        {activeTab === "review" && <WeeklyReviewHub accountId={activeAccountId} />}
        {activeTab === "library" && <SystemLibrary />}
        {activeTab === "config" && <SettingsPage accountId={activeAccountId} />}
      </main>

      {/* MOBILE BOTTOM BAR & FULL MENU OVERLAY */}
      {isMobile && (
        <>
          <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px 0', zIndex: 100, boxShadow: '0 -4px 10px rgba(0,0,0,0.03)' }}>
            {MOBILE_MENU.map(item => {
              const Icon = item.icon; 
              const isActive = activeTab === item.id || (item.id === 'more' && showMobileMenu);
              return (
                <button key={item.id} onClick={() => { if (item.id === 'more') setShowMobileMenu(true); else { setActiveTab(item.id); setShowMobileMenu(false); } }} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? '#3b82f6' : '#94a3b8' }}>
                  <Icon size={24} color={isActive ? '#3b82f6' : '#94a3b8'} />
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* OVERLAY MENU KHỔNG LỒ CHO MOBILE */}
          {showMobileMenu && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.98)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>MFJA <span style={{ color: '#3b82f6' }}>COMMAND</span></div>
                <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer' }}><X size={28} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {MENU_GROUPS.map((grp, idx) => (
                  <div key={idx}>
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 900, marginBottom: '12px', letterSpacing: '1px' }}>{grp.group}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {grp.items.map(item => {
                        const Icon = item.icon; 
                        const isActive = activeTab === item.id;
                        return (
                          <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isActive ? '#3b82f6' : '#1e293b', color: '#f8fafc', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '14px', boxShadow: isActive ? '0 4px 10px rgba(59,130,246,0.3)' : 'none' }}>
                            <Icon size={20} /> {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}