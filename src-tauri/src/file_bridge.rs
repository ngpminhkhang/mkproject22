use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::io::Write;

// Cấu trúc gói tin gửi đi (Plan A, Plan B...)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlanPayload {
    pub header: PlanHeader,
    pub command: PlanCommand,
    pub extensions: PlanExtensions,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlanHeader {
    pub version: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlanCommand {
    pub action: String, // "NEW", "MODIFY", "DELETE"
    pub scenario_id: String, // UUID sếp tạo
    pub symbol: String,
    pub order_type: String, // "BUY_LIMIT", "SELL_STOP"...
    pub volume: f64,
    pub price: f64,
    pub sl: f64,
    pub tp: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlanExtensions {
    pub required_pattern: Option<String>, // Dành cho EA Vệ Tinh
    pub checklist_verified: bool,
}

// Cấu trúc phản hồi từ MT5
#[derive(Debug, Serialize, Deserialize)]
pub struct TradeStatus {
    pub scenario_id: String,
    pub mt5_ticket: i64,
    pub status: String, // "PENDING", "FILLED", "CLOSED"
    pub current_price: f64,
    pub pnl: f64,
    pub comment: Option<String>,
}

// Hàm ghi file lệnh ra thư mục MQL5/Files
// path_str: Là đường dẫn tới thư mục MQL5/Files (Sẽ lấy từ Setting sau)
pub fn write_plan_to_file(base_path: &str, payload: PlanPayload) -> Result<String, String> {
    let mut path = PathBuf::from(base_path);
    // Tên file: plan_to_mt5.json (Hoặc thêm ID để tránh conflict nếu cần)
    path.push("plan_to_mt5.json");

    let json_data = serde_json::to_string_pretty(&payload)
        .map_err(|e| format!("Failed to serialize plan: {}", e))?;

    let mut file = fs::File::create(path.clone())
        .map_err(|e| format!("Failed to create file at {:?}: {}", path, e))?;

    file.write_all(json_data.as_bytes())
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(format!("Plan sent successfully to {:?}", path))
}

// Hàm đọc file status từ MT5
pub fn read_status_file(base_path: &str) -> Result<Option<TradeStatus>, String> {
    let mut path = PathBuf::from(base_path);
    path.push("trade_status.json");

    if !path.exists() {
        return Ok(None); // Chưa có file thì thôi
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read status file: {}", e))?;

    let status: TradeStatus = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse status JSON: {}", e))?;

    Ok(Some(status))
}