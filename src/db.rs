use tauri::{AppHandle, Manager};
use rusqlite::{Connection, params};
use std::fs;

// --- 1. HÀM KẾT NỐI DB (DÙNG CHUNG) ---
pub fn get_connection(app_handle: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("mfja_pro.db");
    let conn = Connection::open(db_path)?;
    Ok(conn)
}

// --- 2. HÀM PHỤ: TỰ ĐỘNG THÊM CỘT NẾU THIẾU (BÁC SĨ DB) ---
fn ensure_column(conn: &Connection, table: &str, col_name: &str, col_def: &str) -> Result<(), String> {
    // Kiểm tra xem cột đã tồn tại chưa
    let count: i64 = conn.query_row(
        &format!("SELECT count(*) FROM pragma_table_info('{}') WHERE name='{}'", table, col_name),
        [], |r| r.get(0)
    ).unwrap_or(0);

    // Nếu chưa có -> Thêm vào ngay
    if count == 0 {
        let sql = format!("ALTER TABLE {} ADD COLUMN {} {}", table, col_name, col_def);
        conn.execute(&sql, []).map_err(|e| e.to_string())?;
        println!("🔧 DB AUTO-FIX: Added column '{}' to table '{}'", col_name, table);
    }
    Ok(())
}

// --- 3. HÀM KHỞI TẠO & NÂNG CẤP DB (CHẠY KHI MỞ APP) ---
pub fn init_db(app_handle: &AppHandle) -> Result<(), String> {
    let conn = get_connection(app_handle).map_err(|e| e.to_string())?;

    // A. BẢNG SETTINGS (Lưu cấu hình hệ thống, Theme, Lang...)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // B. BẢNG ACCOUNTS (QUẢN LÝ ĐA TÀI KHOẢN)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            balance REAL DEFAULT 10000,
            currency TEXT DEFAULT 'USD',
            mql5_path TEXT DEFAULT '', 
            lot_size REAL DEFAULT 100000, -- Thêm lot_size để khớp với Settings PDF
            created_at INTEGER
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // -> Tạo Account mặc định nếu chưa có (Để sếp mở lên là dùng được ngay)
    let count: i64 = conn.query_row("SELECT count(*) FROM accounts", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 {
        conn.execute(
            "INSERT INTO accounts (name, balance, currency, lot_size, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["Default Account", 10000.0, "USD", 100000.0, chrono::Utc::now().timestamp()]
        ).map_err(|e| e.to_string())?;
    }

    // C. BẢNG SCENARIOS (LỆNH GIAO DỊCH)
    // Tạo bảng cơ bản trước (nếu chưa có)
    conn.execute("CREATE TABLE IF NOT EXISTS scenarios (uuid TEXT PRIMARY KEY)", []).map_err(|e| e.to_string())?;

    // -> Dùng "Bác sĩ" vá lỗi thiếu cột (cho DB cũ)
    ensure_column(&conn, "scenarios", "account_id", "INTEGER DEFAULT 1")?; // Gán data cũ vào Acc #1
    ensure_column(&conn, "scenarios", "outlook_id", "TEXT")?;
    ensure_column(&conn, "scenarios", "pair", "TEXT")?;
    ensure_column(&conn, "scenarios", "direction", "TEXT")?;
    ensure_column(&conn, "scenarios", "setup_id", "INTEGER")?;
    ensure_column(&conn, "scenarios", "status", "TEXT DEFAULT 'PENDING'")?;
    ensure_column(&conn, "scenarios", "entry_price", "REAL")?;
    ensure_column(&conn, "scenarios", "sl_price", "REAL")?;
    ensure_column(&conn, "scenarios", "tp_price", "REAL")?;
    ensure_column(&conn, "scenarios", "volume", "REAL")?;
    
    ensure_column(&conn, "scenarios", "pnl", "REAL")?;          // <--- Fix lỗi Dashboard
    ensure_column(&conn, "scenarios", "exit_price", "REAL")?;
    ensure_column(&conn, "scenarios", "close_time", "INTEGER")?;
    
    ensure_column(&conn, "scenarios", "analysis_details", "TEXT")?;
    ensure_column(&conn, "scenarios", "pre_trade_checklist", "TEXT")?;
    ensure_column(&conn, "scenarios", "risk_data", "TEXT")?;
    ensure_column(&conn, "scenarios", "images", "TEXT")?;
    ensure_column(&conn, "scenarios", "result_images", "TEXT")?; // <--- Cột ảnh Exit quan trọng
    ensure_column(&conn, "scenarios", "review_data", "TEXT")?;
    ensure_column(&conn, "scenarios", "created_at", "INTEGER")?;
    ensure_column(&conn, "scenarios", "mt5_ticket", "INTEGER")?;

    // D. BẢNG WEEKLY OUTLOOKS (PHÂN TÍCH TUẦN)
    conn.execute("CREATE TABLE IF NOT EXISTS weekly_outlooks (id TEXT PRIMARY KEY)", []).map_err(|e| e.to_string())?;
    
    // -> Vá cột
    ensure_column(&conn, "weekly_outlooks", "account_id", "INTEGER DEFAULT 1")?; // Cho phép lọc theo acc nếu cần
    ensure_column(&conn, "weekly_outlooks", "ta_bias", "TEXT")?;                 // <--- Fix lỗi Weekly
    ensure_column(&conn, "weekly_outlooks", "week_start_date", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "macro_analysis", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "dxy_analysis", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "pairs_analysis", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "news_events", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "final_bias", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "fa_bias", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "script_plan", "TEXT")?;
    ensure_column(&conn, "weekly_outlooks", "created_at", "INTEGER")?;

    // E. BẢNG LIBRARY (THƯ VIỆN KIẾN THỨC)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS library_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT, 
            title TEXT, 
            content TEXT, 
            image_path TEXT, 
            tags TEXT, 
            created_at INTEGER
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(())
}