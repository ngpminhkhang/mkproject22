use tauri::{AppHandle, Manager};
use rusqlite::{Connection, params};
use std::fs;

// --- 1. KẾT NỐI DB
pub fn get_connection(app_handle: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("mfja_pro.db");
    let conn = Connection::open(db_path)?;
    Ok(conn)
}

// --- 2. HÀM PHỤ: VÁ CỘT (TỰ ĐỘNG THÊM CỘT NẾU THIẾU) ---
fn ensure_column(conn: &Connection, table: &str, col_name: &str, col_def: &str) -> Result<(), String> {
    let count: i64 = conn.query_row(
        &format!("SELECT count(*) FROM pragma_table_info('{}') WHERE name = '{}'", table, col_name),
        [],
        |r| r.get(0)
    ).unwrap_or(0);

    if count == 0 {
        let sql = format!("ALTER TABLE {} ADD COLUMN {} {}", table, col_name, col_def);
        conn.execute(&sql, []).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// --- 3. HÀM KHỞI TẠO (FULL SCHEMA)
pub fn init_db(app_handle: &AppHandle) -> Result<(), String> {
    let conn = get_connection(app_handle).map_err(|e| e.to_string())?;

    conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, balance REAL DEFAULT 10000, currency TEXT DEFAULT 'USD', mql5_path TEXT DEFAULT '', lot_size REAL DEFAULT 100000, created_at INTEGER)", []).map_err(|e| e.to_string())?;
    
    let count: i64 = conn.query_row("SELECT count(*) FROM accounts", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 { conn.execute("INSERT INTO accounts (name, balance, currency, lot_size, created_at) VALUES (?1, ?2, ?3, ?4, ?5)", params!["Default Account", 10000.0, "USD", 100000.0, chrono::Utc::now().timestamp()]).map_err(|e| e.to_string())?; }

    conn.execute("CREATE TABLE IF NOT EXISTS scenarios (uuid TEXT PRIMARY KEY, account_id INTEGER DEFAULT 1, outlook_id TEXT, pair TEXT, direction TEXT, setup_id INTEGER, status TEXT DEFAULT 'PENDING', entry_price REAL DEFAULT 0, sl_price REAL DEFAULT 0, tp_price REAL DEFAULT 0, volume REAL DEFAULT 0.01, pnl REAL DEFAULT 0, exit_price REAL DEFAULT 0, close_time INTEGER DEFAULT 0, analysis_details TEXT DEFAULT '', pre_trade_checklist TEXT DEFAULT '', risk_data TEXT DEFAULT '', images TEXT DEFAULT '[]', result_images TEXT DEFAULT '[]', review_data TEXT DEFAULT '', mt5_ticket INTEGER DEFAULT 0, created_at INTEGER)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS weekly_outlooks (id TEXT PRIMARY KEY, account_id INTEGER DEFAULT 1, week_start_date TEXT, macro_analysis TEXT DEFAULT '', dxy_analysis TEXT DEFAULT '', pairs_analysis TEXT DEFAULT '', news_events TEXT DEFAULT '', final_bias TEXT DEFAULT 'NEUTRAL', fa_bias TEXT DEFAULT '', ta_bias TEXT DEFAULT '', script_plan TEXT DEFAULT '', created_at INTEGER)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS library_items (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, title TEXT, content TEXT, image_path TEXT, tags TEXT, created_at INTEGER)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS missed_trades (uuid TEXT PRIMARY KEY, account_id INTEGER DEFAULT 1, week_start_date TEXT, pair TEXT, direction TEXT, reason TEXT DEFAULT 'CANCELLED', analysis_details TEXT DEFAULT '', images TEXT DEFAULT '[]', created_at INTEGER)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS weekly_reviews (id TEXT PRIMARY KEY, account_id INTEGER DEFAULT 1, week_start_date TEXT, total_trades INTEGER DEFAULT 0, win_rate REAL DEFAULT 0, net_pnl REAL DEFAULT 0, fa_accuracy INTEGER DEFAULT 5, ta_accuracy INTEGER DEFAULT 5, fusion_score INTEGER DEFAULT 5, review_details TEXT DEFAULT '{}', created_at INTEGER)", []).map_err(|e| e.to_string())?;
    
    // PORTFOLIO TABLES
    conn.execute("CREATE TABLE IF NOT EXISTS portfolio_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, max_daily_risk_percent REAL DEFAULT 2.0, max_concurrent_risk_r REAL DEFAULT 5.0, mode TEXT DEFAULT 'NORMAL', created_at INTEGER)", []).map_err(|e| e.to_string())?;
    let ps_count: i64 = conn.query_row("SELECT count(*) FROM portfolio_settings", [], |r| r.get(0)).unwrap_or(0);
    if ps_count == 0 { conn.execute("INSERT INTO portfolio_settings (max_daily_risk_percent, max_concurrent_risk_r, mode, created_at) VALUES (?1, ?2, ?3, ?4)", params![2.0, 5.0, "NORMAL", chrono::Utc::now().timestamp()]).map_err(|e| e.to_string())?; }
    
    conn.execute("CREATE TABLE IF NOT EXISTS account_weights (account_id INTEGER PRIMARY KEY, weight_percent REAL DEFAULT 0, last_updated INTEGER)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE TABLE IF NOT EXISTS portfolio_snapshots (timestamp INTEGER PRIMARY KEY, total_equity REAL DEFAULT 0, total_open_risk REAL DEFAULT 0, total_exposure_usd REAL DEFAULT 0)", []).map_err(|e| e.to_string())?;
    
    // [NEW PHASE 2] BẢNG LOG KIỂM LÂM CỦA CEO
    conn.execute(
        "CREATE TABLE IF NOT EXISTS portfolio_risk_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER, account_id INTEGER, pair TEXT, direction TEXT,
            requested_vol REAL, status TEXT, reason TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    ensure_column(&conn, "accounts", "mql5_path", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "accounts", "lot_size", "REAL DEFAULT 100000")?;
    ensure_column(&conn, "scenarios", "account_id", "INTEGER DEFAULT 1")?;
    ensure_column(&conn, "scenarios", "result_images", "TEXT DEFAULT '[]'")?;
    ensure_column(&conn, "weekly_outlooks", "ta_bias", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "scenarios", "htf_trend", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "scenarios", "market_phase", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "scenarios", "dealing_range", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "scenarios", "narrative", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "scenarios", "scenario_type", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "library_items", "configuration", "TEXT DEFAULT '{}'")?;
    ensure_column(&conn, "scenarios", "compliance_data", "TEXT DEFAULT '{}'")?; 
    ensure_column(&conn, "scenarios", "trade_class", "TEXT DEFAULT ''")?; 
    ensure_column(&conn, "scenarios", "root_cause", "TEXT DEFAULT ''")?;
    ensure_column(&conn, "settings", "daily_loss_limit_percent", "TEXT DEFAULT '5.0'")?; 
    ensure_column(&conn, "scenarios", "execution_score", "REAL DEFAULT 0")?;

    Ok(())
}