import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronDown, User } from 'lucide-react'; 

interface Account {
  id: number;
  account_number: string;
  broker: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

export default function AccountSwitcher() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeAcc, setActiveAcc] = useState<Account | null>(null);

  const loadAccounts = async () => {
    try {
      const res = await invoke<Account[]>("get_accounts");
      setAccounts(res);
      const active = res.find(a => a.is_active);
      if (active) setActiveAcc(active);
    } catch (e) {
      console.error("Load accounts error:", e);
    }
  };

  useEffect(() => {
    loadAccounts();
    // Polling nhẹ để cập nhật số dư nếu có thay đổi từ trang khác
    const interval = setInterval(loadAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitch = async (id: number) => {
    await invoke("set_active_account", { accountId: id });
    await loadAccounts();
    setIsOpen(false);
    // Reload trang để toàn bộ App nhận diện Account ID mới và refresh dữ liệu
    window.location.reload(); 
  };

  return (
    <div style={{position: 'relative', zIndex: 100}}>
        {/* NÚT BẤM (Giao diện Dark Mode cho Header) */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255, 255, 255, 0.1)', // Nền kính mờ
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px', padding: '6px 12px',
                color: 'white', cursor: 'pointer', minWidth: '180px',
                transition: 'background 0.2s',
                outline: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
            {/* Avatar tròn */}
            <div style={{
                width:'32px', height:'32px', borderRadius:'50%', 
                background:'rgba(255,255,255,0.2)', display:'flex', 
                alignItems:'center', justifyContent:'center', color:'white'
            }}>
                <User size={16} />
            </div>
            
            {/* Thông tin Text */}
            <div style={{flex: 1, textAlign: 'left', overflow: 'hidden'}}>
                <div style={{fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing:'0.5px'}}>Account</div>
                <div style={{fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {activeAcc ? activeAcc.account_number : "Loading..."}
                </div>
            </div>
            
            <ChevronDown size={16} style={{opacity: 0.7}} />
        </button>

        {/* MENU DROPDOWN (Nền trắng, chữ đen, đè lên các thành phần khác) */}
        {isOpen && (
            <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '260px',
                background: 'white', borderRadius: '10px', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', 
                border: '1px solid #e2e8f0', padding: '8px',
                display: 'flex', flexDirection: 'column', gap: '4px',
                color: '#1e293b' // Chữ đen cho dropdown dễ đọc
            }}>
                <div style={{
                    padding: '8px', fontSize: '0.75rem', fontWeight: 'bold', 
                    color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '4px'
                }}>
                    SWITCH ACCOUNT
                </div>
                
                {accounts.map(acc => (
                    <button
                        key={acc.id}
                        onClick={() => handleSwitch(acc.id)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px', borderRadius: '6px',
                            background: acc.is_active ? '#eff6ff' : 'transparent',
                            color: acc.is_active ? '#1e40af' : '#334155',
                            border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%'
                        }}
                        onMouseOver={(e) => { if(!acc.is_active) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseOut={(e) => { if(!acc.is_active) e.currentTarget.style.background = 'transparent' }}
                    >
                        <div>
                            <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{acc.account_number}</div>
                            <div style={{fontSize: '0.75rem', color: '#64748b'}}>
                                {acc.broker} • ${acc.balance.toLocaleString()}
                            </div>
                        </div>
                        {acc.is_active && <Check size={16} className="text-blue-600"/>}
                    </button>
                ))}

                {accounts.length === 0 && (
                    <div style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem'}}>
                        No accounts found.
                    </div>
                )}
            </div>
        )}
    </div>
  );
}