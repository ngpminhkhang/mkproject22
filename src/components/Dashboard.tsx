import { useState, useEffect } from "react";
import { 
  Calculator, Activity, ShieldAlert, Zap, 
  TrendingUp, TrendingDown, Target, ListOrdered, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

// MOCK DATA CỦA TẦNG 2
const NODE_DATABASE: Record<number, any> = {
  1: { id: 1, name: "Forex Alpha Node", allocated_capital: 625225, risk_limit: 1.0, win_rate: 68, active_trades: 2,
    positions: [
      { id: "FX-8821", asset: "EUR/USD", type: "LONG", size: "5.5 Lots", entry: 1.0854, pnl: 1250.50 },
      { id: "FX-8822", asset: "GBP/JPY", type: "SHORT", size: "3.2 Lots", entry: 190.25, pnl: -450.00 }
    ]
  },
  2: { id: 2, name: "Crypto Quant Node", allocated_capital: 375135, risk_limit: 2.0, win_rate: 45, active_trades: 0, positions: [] },
  3: { id: 3, name: "US Equities Node", allocated_capital: 250090, risk_limit: 0.5, win_rate: 72, active_trades: 1,
    positions: [
      { id: "EQ-109", asset: "NVDA", type: "SHORT", size: "500 Shares", entry: 850.50, pnl: 3400.25 }
    ] 
  },
};

export default function Dashboard() {
  const [activeAccountId, setActiveAccountId] = useState<number>(1);
  const [nodeData, setNodeData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [riskPercent, setRiskPercent] = useState<string>("1.0");
  const [stopLossPips, setStopLossPips] = useState<string>("20");
  const pipValue = 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const data = NODE_DATABASE[activeAccountId];
    setNodeData(data);
    setRiskPercent(data.risk_limit.toString());
  }, [activeAccountId]);

  if (!nodeData) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu...</div>;

  const numericRisk = parseFloat(riskPercent) || 0;
  const numericSL = parseFloat(stopLossPips) || 0;
  const isOverLimit = numericRisk > nodeData.risk_limit;
  
  const riskAmount = (nodeData.allocated_capital * numericRisk) / 100;
  const calculatedLotSize = numericSL > 0 ? riskAmount / (numericSL * pipValue) : 0;

  const handleExecute = () => {
    if (isOverLimit) return;
    toast.success(`FIRE! Lệnh ${calculatedLotSize.toFixed(2)} đơn vị đã được đẩy vào thị trường.`, { style: { background: '#10b981', color: 'white', fontWeight: 'bold' }});
  };

  return (
    <div style={{ padding: isMobile ? '16px 10px' : '10px 16px', minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* MENU ĐỔI TƯỚNG - TẨY TRẮNG, THANH THOÁT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color="#3b82f6" />
          <span style={{ color: '#0f172a', fontWeight: 900, fontSize: '14px', letterSpacing: '1px' }}>ACTIVE NODE COMMAND</span>
        </div>
        <div style={{ position: 'relative' }}>
          <select 
            value={activeAccountId} 
            onChange={(e) => setActiveAccountId(Number(e.target.value))}
            style={{ appearance: 'none', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 32px 8px 16px', borderRadius: '6px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
          >
            {Object.values(NODE_DATABASE).map(node => (
              <option key={node.id} value={node.id}>{node.name}</option>
            ))}
          </select>
          <ChevronDown size={14} color="#3b82f6" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* KHỐI 1: NGÂN SÁCH - GIẢM ĐỘ CAO, METRICS 1 DÒNG, NỘI DUNG CANH GIỮA */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Activity size={14} color="#3b82f6" />
            <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>BUDGET ALLOCATED</span>
          </div>
          <span style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            ${nodeData.allocated_capital.toLocaleString()}
          </span>
        </div>

        {/* CEO RISK LIMIT & ACTIVE TRADES - dạng cột, canh giữa */}
        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#991b1b', marginBottom: '4px' }}>CEO RISK LIMIT</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#dc2626' }}>{nodeData.risk_limit}%</span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}>ACTIVE TRADES</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#3b82f6' }}>{nodeData.active_trades} POS</span>
          </div>
        </div>
      </div>

      {/* KHỐI 2: MÁY TÍNH KHỐI LƯỢNG */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
        <div style={{ flex: 2, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Calculator size={16} color="#0f172a" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>POSITION SIZING ENGINE</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>RISK ALLOCATION (%)</label>
              <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${isOverLimit ? '#ef4444' : '#cbd5e1'}`, fontSize: '16px', fontWeight: 900, color: isOverLimit ? '#ef4444' : '#0f172a', backgroundColor: isOverLimit ? '#fef2f2' : '#f8fafc', outline: 'none' }} />
              {isOverLimit && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>⚠️ QUÁ HẠN MỨC CHO PHÉP!</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>STOP LOSS (PIPS / POINTS)</label>
              <input type="number" value={stopLossPips} onChange={(e) => setStopLossPips(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 900, color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* NÚT EXECUTE - NỘI DUNG ĐƯỢC CANH GIỮA */}
        <div style={{ flex: 1, backgroundColor: isOverLimit ? '#fef2f2' : '#eff6ff', borderRadius: '10px', border: `1px solid ${isOverLimit ? '#fecaca' : '#bfdbfe'}`, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: isOverLimit ? '#991b1b' : '#1e40af', marginBottom: '6px' }}>AMOUNT AT RISK</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginBottom: '16px' }}>${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            
            <div style={{ fontSize: '11px', fontWeight: 900, color: isOverLimit ? '#991b1b' : '#1e40af', marginBottom: '4px' }}>RECOMMENDED SIZE</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: isOverLimit ? '#f87171' : '#3b82f6', letterSpacing: '-1px' }}>{isOverLimit ? '---' : calculatedLotSize.toFixed(2)}</div>
          </div>

          <button 
            onClick={handleExecute} 
            disabled={isOverLimit}
            style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: isOverLimit ? '#cbd5e1' : '#3b82f6', color: isOverLimit ? '#64748b' : '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: isOverLimit ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {isOverLimit ? <ShieldAlert size={16} /> : <Zap size={16} />} 
            {isOverLimit ? 'TRADE LOCKED' : 'EXECUTE TRADE'}
          </button>
        </div>
      </div>

      {/* KHỐI 3: DANH SÁCH LỆNH ĐANG CHẠY */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <ListOrdered size={16} color="#0f172a" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>ACTIVE POSITIONS RADAR</h3>
        </div>

        {nodeData.positions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 800, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            NO ACTIVE POSITIONS IN THIS NODE.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeData.positions.map((pos: any) => (
              <div key={pos.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', gap: '12px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: pos.type === 'LONG' ? '#dcfce7' : '#fef2f2', color: pos.type === 'LONG' ? '#16a34a' : '#dc2626' }}>
                    <Target size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{pos.asset} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginLeft: '4px' }}>#{pos.id}</span></span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: pos.type === 'LONG' ? '#16a34a' : '#dc2626' }}>{pos.type} • {pos.size}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: isMobile ? 'left' : 'right' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>ENTRY PRICE</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{pos.entry}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>FLOATING PNL</span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: pos.pnl >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {pos.pnl >= 0 ? '+' : ''}${Math.abs(pos.pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}