import { useState, useEffect } from "react";
import { ShieldAlert, DollarSign, Activity, Save, Ban, ShieldCheck, Crosshair, Plus, Trash2, Settings, Server, Lock } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsPage({ accountId = 1 }: { accountId?: number }) {
  const [config, setConfig] = useState({ balance: 10000, mode: 'NORMAL', account_status: 'NORMAL' });
  const [riskModels, setRiskModels] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`https://mk-project19-1.onrender.com/api/config/state/?accountId=${accountId}`);
      if (res.ok) setConfig(await res.json());

      const libRes = await fetch(`https://mk-project19-1.onrender.com/api/library/?category=RISK_MODEL`);
      if (libRes.ok) setRiskModels(await libRes.json());
    } catch (e) { toast.error("Mất kết nối trung tâm kiểm soát!"); }
  };

  useEffect(() => { loadData(); }, [accountId]);

  const handleSave = async () => {
    try {
      const res = await fetch("https://mk-project19-1.onrender.com/api/config/state/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, ...config })
      });
      if (res.ok) toast.success("Đã lưu cấu hình tối cao!", { style: { background: '#10b981', color: 'white', fontWeight: 'bold' }});
      else toast.error("Lỗi từ chối truy cập!");
    } catch (e) { toast.error("Đứt cáp quang: " + e); }
  };

  const addRiskModel = async () => {
    try {
      await fetch("https://mk-project19-1.onrender.com/api/library/create/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Algo Risk", category: "RISK_MODEL", configuration: JSON.stringify({ type: "PERCENT", value: 1.0 }) })
      });
      toast.success("Đã cấp phát Động cơ rủi ro mới!");
      loadData();
    } catch (e) { toast.error("Lỗi tạo mới: " + e); }
  };

  const deleteRiskModel = async (id: number) => {
    if (!confirm("Sếp muốn ném công thức này vào máy nghiền?")) return;
    try {
      await fetch(`https://mk-project19-1.onrender.com/api/library/${id}/delete/`, { method: "POST" });
      toast.success("Đã tiêu hủy!");
      loadData();
    } catch (e) { toast.error("Lỗi tiêu hủy: " + e); }
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 900, color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const };

  return (
    <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Toaster position="top-right" />

      {/* HEADER KHỐI TỔNG CHỈ HUY */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', padding: '16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Settings size={14} color="#3b82f6" />
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>SYSTEM INFRASTRUCTURE</span>
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '24px' : '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>GLOBAL CONFIG</h1>
        </div>
        <button onClick={handleSave} style={{ width: isMobile ? '100%' : 'auto', background: '#0f172a', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 900, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <Save size={16} /> DEPLOY BẢN CẬP NHẬT
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
        
        {/* CỘT TRÁI: CEO MASTER SWITCH */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#3b82f6" /> CEO MASTER SWITCH
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>TỔNG NGÂN SÁCH (AUM BALANCE)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px', background: '#e2e8f0', color: '#475569' }}><DollarSign size={18} /></div>
                  <input type="number" value={config.balance} onChange={e => setConfig({ ...config, balance: Number(e.target.value) })} style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>TRẠNG THÁI TẬP ĐOÀN (GLOBAL MODE)</label>
                <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button onClick={() => setConfig({ ...config, mode: 'NORMAL' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.mode === 'NORMAL' ? '2px solid #10b981' : '1px solid #cbd5e1', background: config.mode === 'NORMAL' ? '#dcfce7' : '#ffffff', color: config.mode === 'NORMAL' ? '#166534' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> NORMAL
                  </button>
                  <button onClick={() => setConfig({ ...config, mode: 'REDUCED' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.mode === 'REDUCED' ? '2px solid #f59e0b' : '1px solid #cbd5e1', background: config.mode === 'REDUCED' ? '#fef3c7' : '#ffffff', color: config.mode === 'REDUCED' ? '#b45309' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} /> REDUCED
                  </button>
                  <button onClick={() => setConfig({ ...config, mode: 'HALT' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.mode === 'HALT' ? '2px solid #ef4444' : '1px solid #cbd5e1', background: config.mode === 'HALT' ? '#fef2f2' : '#ffffff', color: config.mode === 'HALT' ? '#991b1b' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Ban size={16} /> HALT
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#8b5cf6" /> NODE CONTROL (LOCAL STATUS)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', fontWeight: 600 }}>Áp dụng riêng cho Node ID: #{accountId}</p>
            <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
              <button onClick={() => setConfig({ ...config, account_status: 'NORMAL' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.account_status === 'NORMAL' ? '2px solid #10b981' : '1px solid #cbd5e1', background: config.account_status === 'NORMAL' ? '#dcfce7' : '#ffffff', color: config.account_status === 'NORMAL' ? '#166534' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Activity size={16} /> NORMAL
              </button>
              <button onClick={() => setConfig({ ...config, account_status: 'CLAMPED' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.account_status === 'CLAMPED' ? '2px solid #f59e0b' : '1px solid #cbd5e1', background: config.account_status === 'CLAMPED' ? '#fef3c7' : '#ffffff', color: config.account_status === 'CLAMPED' ? '#b45309' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldAlert size={16} /> CLAMPED
              </button>
              <button onClick={() => setConfig({ ...config, account_status: 'FROZEN' })} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 900, fontSize: '12px', border: config.account_status === 'FROZEN' ? '2px solid #94a3b8' : '1px solid #cbd5e1', background: config.account_status === 'FROZEN' ? '#f1f5f9' : '#ffffff', color: config.account_status === 'FROZEN' ? '#475569' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Ban size={16} /> FROZEN
              </button>
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: DYNAMIC RISK PROFILES */}
        <div style={{ flex: 1, background: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={18} color="#dc2626" /> DYNAMIC RISK PROFILES
            </h3>
            <button onClick={addRiskModel} style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 900, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14}/> ADD PROFILE
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {riskModels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px', fontWeight: 800, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                Chưa có công thức rủi ro nào.
              </div>
            ) : (
              riskModels.map(rm => {
                const cfg = safeJSONParse(rm.configuration || "{}");
                return (
                  <div key={rm.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>{rm.title}</span>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>ENGINE: {cfg.type || 'PERCENT'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto', gap: '16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                        VALUE: {cfg.value || cfg.fraction || 0}{cfg.type === 'FIXED' ? '$' : '%'}
                      </span>
                      <button onClick={() => deleteRiskModel(rm.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '20px', fontWeight: 600, fontStyle: 'italic' }}>*Sử dụng System Library để chỉnh sửa chi tiết các Profile này.</p>
        </div>

      </div>
    </div>
  );
}