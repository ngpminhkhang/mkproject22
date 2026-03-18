use tauri::{AppHandle, Emitter}; // [ĐÃ SỬA] Bỏ Manager để hết warning
use std::fs;
use std::path::PathBuf;
use std::thread;
use std::time::Duration;
use crate::db;
use serde::{Deserialize, Serialize};
use rusqlite::OptionalExtension;

#[derive(Debug, Deserialize, Serialize)]
struct TradeStatusFile {
    scenario_id: String,
    mt5_ticket: i64,
    status: String,
    message: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct TradeClosedFile {
    scenario_id: String,
    pnl: f64,
    close_price: f64,
    close_time: i64,
}

pub fn start_background_watcher(app: AppHandle) {
    thread::spawn(move || {
        loop {
            // Kiểm tra mỗi 2 giây
            thread::sleep(Duration::from_secs(2));

            // Lấy đường dẫn MQL5 từ DB
            let mql5_path = match get_mql5_path(&app) {
                Ok(Some(p)) => p,
                _ => continue, // Nếu chưa cấu hình path hoặc lỗi thì bỏ qua vòng lặp này
            };

            // Xử lý Status (Lệnh mới đặt)
            if let Err(e) = process_trade_status(&app, &mql5_path) {
                println!("Watcher Error (Status): {}", e);
            }

            // Xử lý Closed (Lệnh đã đóng)
            if let Err(e) = process_trade_closed(&app, &mql5_path) {
                println!("Watcher Error (Closed): {}", e);
            }
        }
    });
}

fn get_mql5_path(app: &AppHandle) -> Result<Option<String>, String> {
    let conn = db::get_connection(app).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'mql5_path'").map_err(|e| e.to_string())?;
    let value: Option<String> = stmt.query_row([], |row| row.get(0)).optional().map_err(|e| e.to_string())?;
    Ok(value)
}

fn process_trade_status(app: &AppHandle, base_path: &str) -> Result<(), String> {
    let mut path = PathBuf::from(base_path);
    path.push("trade_status.json");

    if !path.exists() { return Ok(()); }

    // Dùng closure để xử lý logic, đảm bảo file luôn được xóa dù có lỗi logic bên trong
    let result = (|| -> Result<(), String> {
        let bytes = fs::read(&path).map_err(|e| format!("Read Error: {}", e))?;
        let content = String::from_utf8_lossy(&bytes).to_string();
        
        let data: TradeStatusFile = serde_json::from_str(&content).map_err(|e| format!("JSON Error: {}", e))?;
        println!(">>> WATCHER: Received Status: '{}' | Msg: '{}'", data.status, data.message);

        let conn = db::get_connection(app).map_err(|e| e.to_string())?;
        
        let new_status = if data.status.trim() == "PLACED" { "ACTIVE" } else { "ERROR" };
        
        // Trim UUID
        let clean_uuid = data.scenario_id.trim();

        conn.execute(
            "UPDATE scenarios SET status = ?1, mt5_ticket = ?2 WHERE uuid = ?3",
            (new_status, data.mt5_ticket, clean_uuid),
        ).map_err(|e| format!("DB Error: {}", e))?;

        // Báo cho Frontend reload lại danh sách
        app.emit("reload-scenarios", ()).map_err(|e| e.to_string())?;

        Ok(())
    })();

    // Xóa file sau khi xử lý xong (hoặc xử lý lỗi) để tránh lặp lại
    let _ = fs::remove_file(&path);
    result
}

fn process_trade_closed(app: &AppHandle, base_path: &str) -> Result<(), String> {
    let mut path = PathBuf::from(base_path);
    path.push("trade_closed.json");

    if !path.exists() { return Ok(()); }

    let result = (|| -> Result<(), String> {
        let bytes = fs::read(&path).map_err(|e| format!("Read Error: {}", e))?;
        let content = String::from_utf8_lossy(&bytes).to_string();
        
        let data: TradeClosedFile = serde_json::from_str(&content).map_err(|e| format!("JSON Error: {}", e))?;

        let conn = db::get_connection(app).map_err(|e| e.to_string())?;

        // 1. Cắt tỉa sạch sẽ UUID
        let clean_uuid = data.scenario_id.trim();
        
        // 2. Tạo mẫu tìm kiếm: "UUID này + bất cứ cái gì phía sau" (%)
        // Kỹ thuật này xử lý trường hợp MT5 comment bị giới hạn ký tự làm cụt UUID
        let search_pattern = format!("{}%", clean_uuid);

        // 3. Dùng LIKE thay vì =
        let updated_rows = conn.execute(
            "UPDATE scenarios SET status = 'CLOSED', pnl = ?1, exit_price = ?2, close_time = ?3 WHERE uuid LIKE ?4",
            (data.pnl, data.close_price, data.close_time, search_pattern),
        ).map_err(|e| format!("DB Error (Closed): {}", e))?;

        if updated_rows > 0 {
            // Lấy 8 ký tự đầu của UUID để log cho gọn
            let short_id = if clean_uuid.len() > 8 { &clean_uuid[0..8] } else { clean_uuid };
            println!(">>> HARVEST SUCCESS: Updated DB for ID (partial) {}... | PnL: {}$", short_id, data.pnl);
        } else {
            println!(">>> HARVEST WARNING: Still mismatch! ID in file: '{}'. Database may be empty or ID is wrong.", clean_uuid);
        }

        app.emit("reload-scenarios", ()).map_err(|e| e.to_string())?;
        Ok(())
    })();

    let _ = fs::remove_file(&path);
    result
}