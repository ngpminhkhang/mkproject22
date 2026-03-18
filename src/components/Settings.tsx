import { useState, useEffect } from "react";
import { ShieldAlert, DollarSign, Activity, Save, Ban, ShieldCheck, Crosshair, Plus, Trash2 } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function Config({ accountId }: { accountId: number }) {
  const [config, setConfig] = useState({ balance: 10000, mode: 'NORMAL', account_status: 'NORMAL' });
  const [riskModels, setRiskModels] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/config/state/?accountId=${accountId}`);
      if (res.ok) setConfig(await res.json());

      const libRes = await fetch(`/api/library/?category=RISK_MODEL`);
      if (libRes.ok) setRiskModels(await libRes.json());
    } catch (e) { toast.error("Connection Interrupted!"); }
  };

  useEffect(() => { loadData(); }, [accountId]);

  const handleSave = async () => {
    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/config/state/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, ...config })
      });
      if (res.ok) toast.success("SYSTEM DIRECTIVE EXECUTED!");
      else toast.error("Execution Failed!");
    } catch (e) { toast.error("API Error!"); }
  };

  const addRiskModel = async () => {
    const title = prompt("Risk Profile Nomenclature (e.g., Aggressive Kelly):");
    const val = prompt("Risk Parameter / Fraction (e.g., 2.0 or 0.5):");
    if (!title || !val) return;
    
    await fetch("https://mk-project19-1.onrender.com/api/library/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category: "RISK_MODEL", configuration: JSON.stringify({ type: "PERCENT", value: parseFloat(val) }) })
    });
    toast.success("Risk Profile Deployed!");
    loadData();
  };

  const deleteRiskModel = async (id: number) => {
    if(!confirm("Terminate this Risk Profile?")) return;
    await fetch("https://mk-project19-1.onrender.com/api/library/", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadData();
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 80px)', backgroundColor: '#f1f5f9' }}>
      <Toaster position="top-right" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}><Activity color="#dc2626"/> GLOBAL CONFIGURATION & CONTROL</h2>
        <button onClick={handleSave} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Save size={18} /> EXECUTE DIRECTIVE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* COLUMN 1: AUM & OVERRIDE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20}/> MASTER FUND AUM</h3>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TOTAL ALLOCATED CAPITAL (USD)</label>
            <input type="number" value={config.balance} onChange={e => setConfig({...config, balance: parseFloat(e.target.value) || 0})} style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '20px', fontWeight: 900, color: '#16a34a', outline: 'none' }} />
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> SYSTEM-WIDE KILL SWITCH</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>Master override for quantitative execution engine.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <button onClick={() => setConfig({...config, mode: 'NORMAL'})} style={{ padding: '15px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', border: config.mode === 'NORMAL' ? '2px solid #16a34a' : '1px solid #e2e8f0', background: config.mode === 'NORMAL' ? '#dcfce7' : 'white', color: config.mode === 'NORMAL' ? '#15803d' : '#64748b' }}><ShieldCheck size={24} style={{marginBottom: 5}}/> NORMAL</button>
              <button onClick={() => setConfig({...config, mode: 'REDUCED'})} style={{ padding: '15px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', border: config.mode === 'REDUCED' ? '2px solid #d97706' : '1px solid #e2e8f0', background: config.mode === 'REDUCED' ? '#fef3c7' : 'white', color: config.mode === 'REDUCED' ? '#b45309' : '#64748b' }}><Activity size={24} style={{marginBottom: 5}}/> REDUCED</button>
              <button onClick={() => setConfig({...config, mode: 'HALT'})} style={{ padding: '15px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', border: config.mode === 'HALT' ? '2px solid #dc2626' : '1px solid #e2e8f0', background: config.mode === 'HALT' ? '#fee2e2' : 'white', color: config.mode === 'HALT' ? '#b91c1c' : '#64748b' }}><Ban size={24} style={{marginBottom: 5}}/> HALT</button>
            </div>
          </div>

        </div>

        {/* COLUMN 2: ACCOUNT STATUS & RISK PROFILES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '8px' }}><Crosshair size={20}/> ACCOUNT TRADING STATUS</h3>
            <select value={config.account_status} onChange={e => setConfig({...config, account_status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, color: '#334155', outline: 'none' }}>
              <option value="NORMAL">✅ NORMAL - Fully Operational</option>
              <option value="CLAMPED">⚠️ CLAMPED - Risk Reduced (50% Volume Limit)</option>
              <option value="FROZEN">❄️ FROZEN - Execution Halted</option>
            </select>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>DYNAMIC RISK PROFILES</h3>
              <button onClick={addRiskModel} style={{ background: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={14}/> Add Profile</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {riskModels.map(rm => {
                const cfg = JSON.parse(rm.configuration || "{}");
                return (
                  <div key={rm.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 800, color: '#334155' }}>{rm.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: 4 }}>Risk/Fraction: {cfg.value || cfg.fraction}%</span>
                      <button onClick={() => deleteRiskModel(rm.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}