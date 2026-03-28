import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AlphaEngine from './components/AlphaEngine';
import RiskEngine from './components/RiskEngine';
import BehavioralAnalytics from './components/BehavioralAnalytics';
import { 
  LayoutDashboard, Zap, ShieldAlert, BarChart3, DatabaseZap, 
  Settings, LogOut, BriefcaseBusiness, Menu, X
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // LOGIC MENU MỚI:
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Xử lý hover Desktop/Tablet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Xử lý Hamburger Mobile

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'AUM Terminal', icon: <LayoutDashboard size={20} />, description: 'Overview & High-Conviction Trades' },
    { id: 'alpha', label: 'Alpha Engine', icon: <Zap size={20} />, description: 'MQL5 constraints' },
    { id: 'risk', label: 'Risk Engine', icon: <ShieldAlert size={20} />, description: 'Dynamic Kelly sizing' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, description: 'Behavioral diagnostics' },
    { id: 'infrastructure', label: 'Ops', icon: <DatabaseZap size={20} />, description: 'Audit & Ledger' },
  ];

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); // Chọn xong thì đóng Menu Mobile ngay
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900 overflow-x-hidden relative">
      
      {/* --- 1. HEADER MOBILE (Chỉ hiện khi < 768px) --- */}
      {/* Cố định ở đáy màn hình, gap nhỏ */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 p-2.5 flex items-center justify-between z-40 md:hidden shadow-sm">
        <div className="flex items-center gap-2">
            <BriefcaseBusiness className="text-blue-600" size={22} />
            <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">MK QUANT</h1>
        </div>
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-slate-100 rounded-lg text-slate-700 active:scale-95 transition-all">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* --- 2. MENU MOBILE FULL SCREEN (Overlay) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white w-full max-w-xs h-full p-4 flex flex-col space-y-2.5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 mb-2 border-b border-slate-200 gap-2">
                    <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="text-blue-600" size={22} />
                        <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">MK QUANT</h1>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                </div>
                
                {menuItems.map((item) => (
                    <button key={item.id} onClick={() => handleMenuClick(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-700 hover:bg-blue-50'}`}>
                        <div className={activeTab === item.id ? 'text-white' : 'text-slate-400'}>{item.icon}</div>
                        <div>
                            <span className="block font-extrabold text-sm">{item.label}</span>
                            <span className={`block text-[10px] ${activeTab === item.id ? 'text-blue-100' : 'text-slate-500'}`}>{item.description}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* --- 3. THANH MENU DỌC (Desktop & Tablet & Laptop > 768px) --- */}
      {/* CHUYỂN DỊCH VÀ CO GIÃN THEO HOVER */}
      <aside 
        className={`bg-white border-r border-slate-200 p-2 flex flex-col flex-shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out group hidden md:flex
          ${isSidebarHovered ? 'w-64' : 'w-[60px]'}`} // Co giãn chiều rộng theo hover
        onMouseEnter={() => setIsSidebarHovered(true)} // Hover chuột vào -> Bung
        onMouseLeave={() => setIsSidebarHovered(false)} // Chuột ra -> Thu
      >
        
        {/* Header: Chỉ hiện chữ khi bung */}
        <div className="flex items-center gap-2.5 pt-3.5 pb-5 border-b border-slate-200 mb-5 relative overflow-hidden h-[40px] pl-2">
          <BriefcaseBusiness className="text-blue-600 flex-shrink-0" size={24} />
          {/* text-opacity-0 khi thu, 100 khi bung */}
          <div className={`transition-all duration-300 whitespace-nowrap ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">MK Quant</h1>
          </div>
        </div>

        {/* Danh sách Icons/Text */}
        <nav className="flex-1 space-y-1.5 relative">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3rounded-xl text-left transition-all duration-200 overflow-hidden h-[45px] p-2.5
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
              >
                {/* Icon: Đổi màu theo active */}
                <div className={`flex-shrink-0 w-8 flex justify-center ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                
                {/* Text: Chỉ hiện khi bung */}
                <div className={`transition-all duration-300 whitespace-nowrap pl-2.5 flex-1 ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                  <span className={`block font-extrabold text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-950'}`}>
                    {item.label}
                  </span>
                  <span className={`block text-[10px] font-medium -mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* --- CỘT 2: MAIN CONTENT (ĐÃ HÚT MỠ VIỀN) --- */}
      <main className="flex-1 p-1.5 md:p-3 bg-slate-50 relative pt-16 md:pt-3 flex flex-col">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'alpha' && <AlphaEngine />}
        {activeTab === 'risk' && <RiskEngine />}
        {activeTab === 'analytics' && <BehavioralAnalytics />}
        
        {/* Tab trống (Ops) khè AdCom */}
        {activeTab === 'infrastructure' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
              <DatabaseZap size={48} className='text-slate-200' strokeWidth={1.5}/>
              <h2 className='text-xl font-black text-slate-800 tracking-tight uppercase'>Secure Infrastructure Ops</h2>
              <p className='text-slate-500 max-w-sm leading-relaxed text-xs font-medium'>Encrypted Ledger and Audit Trails are restricted to local environment instances.</p>
          </div>
        )}
      </main>

    </div>
  );
};

export default App;