use crate::db;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::io::Read;
use tauri::{AppHandle, command};
use rusqlite::params;

// --- STRUCTS DỮ LIỆU ---
#[derive(Serialize, Deserialize)]
struct TradeCommand {
    scenario_id: String,
    action: String,
    symbol: String,
    order_type: String,
    volume: f64,
    price: f64,
    sl: f64,
    tp: f64,
}

#[derive(Serialize, Deserialize, Debug)]
struct MappingData {
    uuid: String,
    mt5_ticket: i64,
    // img: Option<String>, // Không cần dùng nữa vì đã có cơ chế hút ảnh riêng
}

#[derive(Serialize, Deserialize, Debug)]
struct ClosedData {
    mt5_ticket: i64,
    pnl: f64,
    close_price: f64,
    // img: Option<String>,
}

// 🔥 HÀM QUAN TRỌNG NHẤT: Lấy đường dẫn động từ DB theo Account ID
fn get_mt5_path(app: &AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(app).map_err(|e| e.to_string())?;
    
    let path: String = conn.query_row(
        "SELECT mql5_path FROM accounts WHERE id = ?1",
        params![account_id],
        |row| row.get(0),
    ).map_err(|_| "Account not found!".to_string())?;
    
    if path.trim().is_empty() {
        return Err(format!("Account #{} chưa cấu hình đường dẫn MT5! Vào Settings nhập ngay.", account_id));
    }
    Ok(path)
}

// --- 1. HÀM BẮN LỆNH (EXECUTE) ---
// Tự động tìm xem lệnh này thuộc Account nào -> Lấy Path của Account đó -> Bắn file


// --- 2. HÀM ĐỒNG BỘ (SYNC - MÁY HÚT BỤI ĐA NĂNG) ---
// Hàm này sẽ quét TẤT CẢ các tài khoản có đường dẫn hợp lệ để cập nhật trạng thái
#[command]
pub fn sync_bridge_data(app: AppHandle) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    
    // A. Lấy danh sách tất cả Account đang có đường dẫn (mql5_path != '')
    let mut stmt = conn.prepare("SELECT id, mql5_path FROM accounts WHERE mql5_path != ''").map_err(|e| e.to_string())?;
    let accounts_iter = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;

    let mut logs = String::new();

    // B. Duyệt từng Account để quét dọn
    for acc in accounts_iter {
        if let Ok((acc_id, path_str)) = acc {
            let mt5_path = Path::new(&path_str);
            
            // Nếu đường dẫn sai hoặc không tồn tại thì bỏ qua
            if !mt5_path.exists() { continue; } 

            if let Ok(dir) = fs::read_dir(mt5_path) {
                for entry in dir {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        let filename = entry.file_name().to_string_lossy().to_string();

                        // 1. MAPPING (Khớp lệnh Entry)
                        if filename.starts_with("mapping_") && filename.ends_with(".json") {
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Ok(data) = serde_json::from_str::<MappingData>(&content) {
                                    // Update Ticket và chuyển trạng thái FILLED
                                    // Thêm điều kiện AND account_id để đảm bảo an toàn tuyệt đối
                                    let _ = conn.execute(
                                        "UPDATE scenarios SET mt5_ticket = ?1, status = 'FILLED' WHERE uuid = ?2 AND account_id = ?3",
                                        params![data.mt5_ticket, data.uuid, acc_id],
                                    );
                                    logs.push_str(&format!("Linked Ticket #{} (Acc #{})\n", data.mt5_ticket, acc_id));
                                }
                            }
                            let _ = fs::remove_file(&path); // Xóa file sau khi xử lý
                        }
                        // 2. CLOSED (Lệnh đóng - TP/SL)
                        else if filename.starts_with("closed_") && filename.ends_with(".json") {
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Ok(data) = serde_json::from_str::<ClosedData>(&content) {
                                    let _ = conn.execute(
                                        "UPDATE scenarios SET pnl = ?1, exit_price = ?2, status = 'CLOSED', close_time = strftime('%s','now') WHERE mt5_ticket = ?3",
                                        params![data.pnl, data.close_price, data.mt5_ticket],
                                    );
                                    logs.push_str(&format!("Closed Ticket #{} (Acc #{})\n", data.mt5_ticket, acc_id));
                                }
                            }
                            let _ = fs::remove_file(&path);
                        }
                        // 3. ẢNH (Shot - Hút ảnh)
                        else if filename.starts_with("shot_") && filename.ends_with(".png") {
                            let parts: Vec<&str> = filename.split('_').collect();
                            if parts.len() >= 3 {
                                if let Ok(ticket) = parts[1].parse::<i64>() {
                                    let type_part = parts[2]; 
                                    
                                    // Lưu đường dẫn ảnh vào DB dưới dạng JSON Array (để hỗ trợ nhiều ảnh sau này)
                                    // Quan trọng: Lưu đường dẫn tuyệt đối của máy hiện tại
                                    let full_path_json = serde_json::to_string(&vec![path.to_string_lossy().to_string()]).unwrap_or("[]".to_string());

                                    if type_part.starts_with("ENTRY") {
                                        let _ = conn.execute("UPDATE scenarios SET images = ?1 WHERE mt5_ticket = ?2", params![full_path_json, ticket]);
                                    } 
                                    else if type_part.starts_with("EXIT") {
                                        let _ = conn.execute("UPDATE scenarios SET result_images = ?1 WHERE mt5_ticket = ?2", params![full_path_json, ticket]);
                                    }
                                }
                            }
                            // Lưu ý: Không xóa file ảnh, để đó cho App hiển thị
                        }
                    }
                }
            }
        }
    }
    Ok(logs)
}

// --- 3. HÀM ĐỌC ẢNH (Hỗ trợ đọc từ JSON Array string) ---
// Hàm này giúp Frontend đọc được ảnh dù DB lưu dạng '["C:\\..."]' hay 'C:\\...'
#[command]
pub fn read_mt5_image(image_path: String) -> Result<Vec<u8>, String> {
    // Kiểm tra xem chuỗi có phải là JSON Array không
    let clean_path = if image_path.trim().starts_with('[') {
        if let Ok(paths) = serde_json::from_str::<Vec<String>>(&image_path) {
            // Lấy ảnh đầu tiên trong mảng
            paths.first().cloned().unwrap_or(image_path)
        } else {
            // Fallback nếu parse lỗi
            image_path
        }
    } else {
        // Nếu không phải JSON (dữ liệu cũ), dùng nguyên
        image_path
    };

    let mut file = fs::File::open(&clean_path).map_err(|_| "Không tìm thấy ảnh!".to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
    Ok(buffer)
}