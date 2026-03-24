// Định nghĩa kiểu dữ liệu chuẩn cho toàn App

export interface Account {
  id: number;
  account_number: string;
  broker?: string;
  balance: number;
  currency: string;
  lot_size: number;
  risk_config?: string;
  is_active: boolean;
}

export interface Outlook {
  id: number;
  pair: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe: string;
  notes: string;
  created_at: string;
}

export interface Scenario {
  uuid: string;         // ID dạng chuỗi (UUID)
  outlook_id?: number;
  pair: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  
  // Trading Plan
  direction: 'BUY' | 'SELL';
  entry_price: number;
  sl_price: number;
  tp_price: number;
  volume: number;

  // Metadata
  dynamic_data?: string; // Chứa JSON checklist, ảnh...
  created_at?: string;
}

// Cấu trúc Form nhập liệu
export interface ScenarioInput {
  outlook_id?: number;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  sl_price: number;
  tp_price: number;
  volume: number;
  dynamic_data?: string;
}