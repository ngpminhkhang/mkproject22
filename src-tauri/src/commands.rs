use tauri::{command, AppHandle, Manager};
use crate::db;
use std::time::{SystemTime, UNIX_EPOCH};
use rusqlite::{params, OptionalExtension, named_params};
use std::fs;
use std::path::Path;
use base64::{engine::general_purpose, Engine as _};
use serde::{Serialize, Deserialize};
use serde_json::json;
use tauri_plugin_dialog::DialogExt; 

//--- 1. IMAGE UTILS ---
#[command]
pub fn pick_and_copy_images(app: AppHandle) -> Result<Vec<String>, String> {
    let files = app.dialog().file()
        .add_filter("Images", &["png", "jpg", "jpeg", "webp"])
        .blocking_pick_files(); 
        
    let mut saved_paths = Vec::new();
    if let Some(paths) = files {
        let app_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
        let images_dir = app_dir.join("trade_images");
        if !images_dir.exists() {
             fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
        }
        for path in paths {
            let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
            let path_buf = path.into_path().map_err(|e| e.to_string())?;
            let file_name = path_buf.file_name().unwrap().to_string_lossy();
            let new_name = format!("{}_{}", timestamp, file_name);
            let dest_path = images_dir.join(&new_name);
            fs::copy(&path_buf, &dest_path).map_err(|e| e.to_string())?;
            saved_paths.push(dest_path.to_string_lossy().to_string());
        }
    }
    Ok(saved_paths)
}

#[command]
pub fn load_image_base64(path: String) -> Result<String, String> {
    let clean_path = if path.trim().starts_with('[') {
        if let Ok(paths) = serde_json::from_str::<Vec<String>>(&path) {
            paths.first().cloned().unwrap_or(path)
        } else { path }
    } else { path };

    let bytes = fs::read(&clean_path).map_err(|e| e.to_string())?;
    let b64 = general_purpose::STANDARD.encode(bytes);
    let mime = if clean_path.ends_with("png") { "image/png" } else { "image/jpeg" };
    Ok(format!("data:{};base64,{}", mime, b64))
}

//--- 2. ACCOUNTS & SETTINGS ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Account {
    id: i64, name: String, balance: f64, currency: String, mql5_path: String, lot_size: f64
}

#[command]
pub fn init_db(app: AppHandle) -> Result<(), String> { db::init_db(&app) }

#[command]
pub fn get_accounts(app: AppHandle) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, balance, currency, mql5_path, lot_size FROM accounts ORDER BY id ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Account {
            id: row.get(0)?, name: row.get(1)?, balance: row.get(2)?, currency: row.get(3)?,
            mql5_path: row.get(4).unwrap_or_default(), lot_size: row.get(5).unwrap_or(100000.0),
        })
    }).map_err(|e| e.to_string())?;
    let mut list = Vec::new();
    for r in rows { list.push(r.map_err(|e| e.to_string())?); }
    Ok(serde_json::to_string(&list).map_err(|e| e.to_string())?)
}

#[command]
pub fn create_account(app: AppHandle, name: String) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO accounts (name, balance, currency, mql5_path, lot_size, created_at) VALUES (?1, 10000, 'USD', '', 100000, strftime('%s','now'))",
        params![name]
    ).map_err(|e| e.to_string())?;
    Ok("Created".to_string())
}

#[command]
pub fn update_account_settings(app: AppHandle, account_id: i64, name: String, balance: f64, currency: String, mql5_path: String, lot_size: f64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE accounts SET name=?1, balance=?2, currency=?3, mql5_path=?4, lot_size=?5 WHERE id=?6",
        params![name, balance, currency, mql5_path, lot_size, account_id]
    ).map_err(|e| e.to_string())?;
    Ok("Updated".to_string())
}

#[command]
pub fn delete_account(app: AppHandle, account_id: i64) -> Result<String, String> {
    if account_id == 1 { return Err("Cannot delete default account".to_string()); }
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM accounts WHERE id=?1", params![account_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM scenarios WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    Ok("Deleted".to_string())
}

#[command]
pub fn reset_account_data(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM scenarios WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM weekly_outlooks WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM weekly_reviews WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM missed_trades WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    Ok("Reset".to_string())
}

#[derive(Serialize)]
struct AppSettings { initial_balance: f64, currency: String, lot_size: f64, mql5_path: String }

#[command]
pub fn get_app_settings(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let acc_res = conn.query_row(
        "SELECT balance, currency, lot_size, mql5_path FROM accounts WHERE id=?1",
        params![account_id],
        |row| Ok((row.get::<_, f64>(0)?, row.get::<_, String>(1)?, row.get::<_, f64>(2).unwrap_or(100000.0), row.get::<_, String>(3).unwrap_or_default()))
    ).optional().map_err(|e| e.to_string())?;
    let (bal, curr, lot, path) = acc_res.unwrap_or((10000.0, "USD".to_string(), 100000.0, "".to_string()));
    Ok(serde_json::to_string(&AppSettings { initial_balance: bal, currency: curr, lot_size: lot, mql5_path: path }).map_err(|e| e.to_string())?)
}

#[command]
pub fn update_app_settings(_app: AppHandle, _account_id: i64, _initial_balance: f64, _currency: String, _lot_size: f64) -> Result<(), String> { Ok(()) }

#[command]
pub fn save_setting(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params![key, value]).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn get_setting(app: AppHandle, key: String) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let value: Option<String> = conn.query_row("SELECT value FROM settings WHERE key=?1", params![key], |r| r.get(0)).optional().map_err(|e| e.to_string())?;
    Ok(value.unwrap_or_default())
}

//--- 3. SCENARIO CORE ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Scenario {
    uuid: String, pair: String, direction: String, status: String, pnl: f64,
    analysis_details: String, pre_trade_checklist: String, images: String,
    setup_id: Option<i64>, entry_price: f64, sl_price: f64, tp_price: f64,
    volume: f64, exit_price: f64,
    review_data: String, result_images: String, account_id: i64, created_at: i64,
    script_plan: String, close_time: Option<i64>,
    htf_trend: String, market_phase: String, dealing_range: String, narrative: String, scenario_type: String,
    execution_score: f64
}

#[derive(Deserialize)]
pub struct ScenarioInput {
    pair: String, direction: String, entry_price: f64, sl_price: f64, tp_price: f64,
    volume: f64, outlook_id: Option<String>, account_id: Option<i64>
}

#[command]
pub fn create_scenario(app: AppHandle, input: ScenarioInput) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let uuid = uuid::Uuid::new_v4().to_string();
    let acc_id = input.account_id.unwrap_or(1);
    let created_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    conn.execute(
        "INSERT INTO scenarios (uuid, pair, direction, entry_price, sl_price, tp_price, volume, outlook_id, status, created_at, account_id, execution_score) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'PENDING', ?9, ?10, 0)",
        params![uuid, input.pair, input.direction, input.entry_price, input.sl_price, input.tp_price, input.volume, input.outlook_id, created_at, acc_id]
    ).map_err(|e| e.to_string())?;
    Ok(uuid)
}

#[command]
pub fn get_scenarios(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let sql = "SELECT s.uuid, s.pair, s.direction, s.status, s.pnl, s.analysis_details, 
               s.pre_trade_checklist, s.images, s.setup_id, s.entry_price, s.sl_price, s.tp_price,
               s.volume, s.review_data, s.result_images, s.account_id, s.created_at, w.script_plan, s.close_time,
               s.htf_trend, s.market_phase, s.dealing_range, s.narrative, s.scenario_type, s.exit_price, s.execution_score
               FROM scenarios s 
               LEFT JOIN weekly_outlooks w ON s.outlook_id = w.id
               WHERE s.account_id = ?1
               ORDER BY s.created_at DESC LIMIT 200";
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![account_id], |row| {
        Ok(Scenario {
            uuid: row.get(0)?, pair: row.get(1)?, direction: row.get(2)?, status: row.get(3)?,
            pnl: row.get(4).unwrap_or(0.0), analysis_details: row.get(5).unwrap_or_default(),
            pre_trade_checklist: row.get(6).unwrap_or_default(), images: row.get(7).unwrap_or("[]".to_string()),
            setup_id: row.get(8).ok(), entry_price: row.get(9).unwrap_or(0.0),
            sl_price: row.get(10).unwrap_or(0.0), tp_price: row.get(11).unwrap_or(0.0),
            volume: row.get(12).unwrap_or(0.0), review_data: row.get(13).unwrap_or_default(),
            result_images: row.get(14).unwrap_or("[]".to_string()), account_id: row.get(15).unwrap_or(1),
            created_at: row.get(16).unwrap_or(0), script_plan: row.get(17).unwrap_or_default(),
            close_time: row.get(18).ok(),
            htf_trend: row.get(19).unwrap_or_default(), market_phase: row.get(20).unwrap_or_default(),
            dealing_range: row.get(21).unwrap_or_default(), narrative: row.get(22).unwrap_or_default(),
            scenario_type: row.get(23).unwrap_or_default(),
            exit_price: row.get(24).unwrap_or(0.0),
            execution_score: row.get(25).unwrap_or(0.0)
        })
    }).map_err(|e| e.to_string())?;
    let mut list = Vec::new();
    for r in rows { list.push(r.map_err(|e| e.to_string())?); }
    Ok(serde_json::to_string(&list).map_err(|e| e.to_string())?)
}

#[command]
pub fn set_scenario_status(app: AppHandle, uuid: String, status: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("UPDATE scenarios SET status=?1 WHERE uuid=?2", params![status, uuid]).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn delete_scenario(app: AppHandle, uuid: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM scenarios WHERE uuid=?1", params![uuid]).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Deserialize)]
pub struct UpdateScenarioInput {
    uuid: String, analysis: String, checklist: String, risk_data: String, images: String,
    setup_id: Option<i64>, entry_price: f64, sl_price: f64, tp_price: f64, volume: f64,
    htf_trend: String, market_phase: String, dealing_range: String, narrative: String, scenario_type: String
}

#[command]
pub fn update_scenario_full(app: AppHandle, input: UpdateScenarioInput) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE scenarios SET analysis_details=?1, pre_trade_checklist=?2, risk_data=?3, images=?4, setup_id=?5, 
         entry_price=?6, sl_price=?7, tp_price=?8, volume=?9,
         htf_trend=?10, market_phase=?11, dealing_range=?12, narrative=?13, scenario_type=?14 WHERE uuid=?15",
        params![
            input.analysis, input.checklist, input.risk_data, input.images, input.setup_id,
            input.entry_price, input.sl_price, input.tp_price, input.volume,
            input.htf_trend, input.market_phase, input.dealing_range, input.narrative, input.scenario_type, input.uuid
        ]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

//--- 4. SHARED DATA (LIBRARY) ---
#[derive(Serialize)]
struct LibraryItem { id: i64, category: String, title: String, content: String, image_path: String, tags: String, created_at: i64, configuration: String }
#[derive(Deserialize)]
pub struct LibraryItemInput { id: Option<i64>, category: String, title: String, description: String, tags: String, configuration: Option<String> }

#[command]
pub fn get_library_items(app: AppHandle, category: String) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let sql = if category == "ALL" {
        "SELECT id, category, title, content, image_path, tags, created_at, configuration FROM library_items ORDER BY created_at DESC".to_string()
    } else {
        format!("SELECT id, category, title, content, image_path, tags, created_at, configuration FROM library_items WHERE category='{}' ORDER BY created_at DESC", category)
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(LibraryItem {
            id: row.get(0)?, category: row.get(1)?, title: row.get(2)?, content: row.get(3)?,
            image_path: row.get(4).unwrap_or_default(), tags: row.get(5).unwrap_or_default(),
            created_at: row.get(6).unwrap_or(0), configuration: row.get(7).unwrap_or("{}".to_string())
        })
    }).map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    for r in rows { items.push(r.map_err(|e| e.to_string())?); }
    Ok(serde_json::to_string(&items).map_err(|e| e.to_string())?)
}

#[command]
pub fn save_library_item(app: AppHandle, data: LibraryItemInput) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let config_str = data.configuration.unwrap_or("{}".to_string());
    if let Some(id) = data.id {
        conn.execute("UPDATE library_items SET category=?1, title=?2, content=?3, tags=?4, configuration=?5 WHERE id=?6",
            params![data.category, data.title, data.description, data.tags, config_str, id]).map_err(|e| e.to_string())?;
    } else {
        conn.execute("INSERT INTO library_items (category, title, content, tags, configuration, image_path, created_at) VALUES (?1, ?2, ?3, ?4, ?5, '', ?6)",
            params![data.category, data.title, data.description, data.tags, config_str, SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64]).map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[command]
pub fn delete_library_item(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM library_items WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}
#[command]
pub fn seed_default_library(app: AppHandle) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    let types = vec!["FVG Continuation", "FVG Reversal", "Liquidity Sweep Reversal", "Range Re-entry", "News Fake Move", "Killzone Scalping"];
    for t in types {
        let exists: i64 = conn.query_row("SELECT count(*) FROM library_items WHERE category='SCENARIO_TYPE' AND title=?1", params![t], |r| r.get(0)).unwrap_or(0);
        if exists == 0 {
            conn.execute("INSERT INTO library_items (category, title, content, tags, configuration, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params!["SCENARIO_TYPE", t, "Mẫu kịch bản mặc định", "system", "{}", now]).map_err(|e| e.to_string())?;
        }
    }
    let chk_count: i64 = conn.query_row("SELECT count(*) FROM library_items WHERE category='CHECKLIST'", [], |r| r.get(0)).unwrap_or(0);
    if chk_count == 0 {
        let checklist_config = json!({"items": ["Cấu trúc rõ ràng (BOS/MSS)?", "Có FVG/OB hợp lệ?", "Quét thanh khoản (Sweep)?", "Risk:Reward > 2R?"]}).to_string();
        conn.execute("INSERT INTO library_items (category, title, content, tags, configuration, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params!["CHECKLIST", "SMC Standard Checklist", "Bộ quy tắc vào lệnh SMC cơ bản", "smc,conservative", checklist_config, now]).map_err(|e| e.to_string())?;
    }
    Ok(())
}

//--- 5. OUTLOOK & REVIEW ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WeeklyOutlookData { id: Option<String>, week_start_date: String, fa_bias: String, ta_bias: String, final_bias: String, script_plan: String, account_id: Option<i64> }

#[command]
pub fn save_weekly_outlook(app: AppHandle, data: WeeklyOutlookData) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let id_string = format!("WEEK-{}", data.week_start_date);
    let acc_id = data.account_id.unwrap_or(1);
    conn.execute(
        "INSERT OR REPLACE INTO weekly_outlooks (id, week_start_date, fa_bias, ta_bias, final_bias, script_plan, account_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id_string, data.week_start_date, data.fa_bias, data.ta_bias, data.final_bias, data.script_plan, acc_id]
    ).map_err(|e| e.to_string())?;
    Ok("Saved".into())
}
#[command]
pub fn get_outlook_by_week(app: AppHandle, week_date: String) -> Result<Option<WeeklyOutlookData>, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let id_search = format!("WEEK-{}", week_date);
    let result = conn.query_row(
        "SELECT id, week_start_date, fa_bias, ta_bias, final_bias, script_plan, account_id FROM weekly_outlooks WHERE id=?1",
        params![id_search],
        |row| Ok(WeeklyOutlookData {
            id: row.get(0)?, week_start_date: row.get(1)?, fa_bias: row.get(2)?, ta_bias: row.get(3).unwrap_or_default(),
            final_bias: row.get(4)?, script_plan: row.get(5)?, account_id: row.get(6).ok()
        })
    ).optional().map_err(|e| e.to_string())?;
    Ok(result)
}
#[command]
pub fn get_review_by_week(app: AppHandle, week_date: String) -> Result<Option<String>, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let id_search = format!("REV-{}", week_date);
    let result = conn.query_row(
        "SELECT total_trades, win_rate, net_pnl, fa_accuracy, ta_accuracy, fusion_score, review_details FROM weekly_reviews WHERE id=?1",
        params![id_search],
        |row| {
            Ok(serde_json::json!({
                "total_trades": row.get::<_, i64>(0).unwrap_or(0), "win_rate": row.get::<_, f64>(1).unwrap_or(0.0),
                "net_pnl": row.get::<_, f64>(2).unwrap_or(0.0), "fa_accuracy": row.get::<_, i64>(3).unwrap_or(5),
                "ta_accuracy": row.get::<_, i64>(4).unwrap_or(5), "fusion_score": row.get::<_, i64>(5).unwrap_or(5),
                "review_details": row.get::<_, String>(6).unwrap_or_default()
            }).to_string())
        }
    ).optional().map_err(|e| e.to_string())?;
    Ok(result)
}
#[derive(Deserialize)]
pub struct WeeklyReviewInput { week_start_date: String, review_details: String, account_id: Option<i64>, total_trades: i64, win_rate: f64, net_pnl: f64, fa_accuracy: i64, ta_accuracy: i64, fusion_score: i64 }
#[command]
pub fn save_weekly_review(app: AppHandle, data: WeeklyReviewInput) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let id_string = format!("REV-{}", data.week_start_date);
    let acc_id = data.account_id.unwrap_or(1);
    conn.execute(
        "INSERT OR REPLACE INTO weekly_reviews (id, week_start_date, total_trades, win_rate, net_pnl, fa_accuracy, ta_accuracy, fusion_score, review_details, account_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id_string, data.week_start_date, data.total_trades, data.win_rate, data.net_pnl, data.fa_accuracy, data.ta_accuracy, data.fusion_score, data.review_details, acc_id]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

//--- 6. TRADE JOURNAL V2 ---
#[derive(Deserialize)]
pub struct TradeFilter { pub date_from: Option<String>, pub date_to: Option<String>, pub outcome: Option<String>, pub pair: Option<String> }

#[command]
pub fn get_trades_v2(app: AppHandle, account_id: i64, filter: TradeFilter) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let sql = "
        SELECT 
            s.uuid, s.pair, s.direction, s.status, s.pnl,
            s.analysis_details, s.pre_trade_checklist, s.images, 
            s.setup_id, s.entry_price, s.sl_price, s.tp_price, s.volume,
            s.review_data, s.result_images, s.account_id, s.created_at, 
            w.script_plan, s.close_time,
            s.htf_trend, s.market_phase, s.dealing_range, s.narrative, s.scenario_type, s.exit_price, s.execution_score
        FROM scenarios s
        LEFT JOIN weekly_outlooks w ON s.outlook_id = w.id
        WHERE s.account_id = :account_id
        AND (:pair IS NULL OR s.pair = :pair)
        AND (
            :outcome IS NULL 
            OR (:outcome = 'WIN' AND s.pnl > 0 AND s.status = 'CLOSED')
            OR (:outcome = 'LOSS' AND s.pnl <= 0 AND s.status = 'CLOSED')
            OR (:outcome NOT IN ('WIN', 'LOSS') AND s.status = :outcome)
        )
        AND (:date_from IS NULL OR date(s.created_at, 'unixepoch') >= :date_from)
        AND (:date_to IS NULL OR date(s.created_at, 'unixepoch') <= :date_to)
        ORDER BY s.created_at DESC
        LIMIT 200";

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(named_params! {
        ":account_id": account_id, ":pair": filter.pair, ":outcome": filter.outcome,
        ":date_from": filter.date_from, ":date_to": filter.date_to,
    }, |row| {
        Ok(Scenario {
            uuid: row.get(0)?, pair: row.get(1)?, direction: row.get(2)?, status: row.get(3)?,
            pnl: row.get(4).unwrap_or(0.0), analysis_details: row.get(5).unwrap_or_default(),
            pre_trade_checklist: row.get(6).unwrap_or_default(), images: row.get(7).unwrap_or("[]".to_string()),
            setup_id: row.get(8).ok(), entry_price: row.get(9).unwrap_or(0.0),
            sl_price: row.get(10).unwrap_or(0.0), tp_price: row.get(11).unwrap_or(0.0),
            volume: row.get(12).unwrap_or(0.0), review_data: row.get(13).unwrap_or_default(),
            result_images: row.get(14).unwrap_or("[]".to_string()), account_id: row.get(15).unwrap_or(1),
            created_at: row.get(16).unwrap_or(0), script_plan: row.get(17).unwrap_or_default(),
            close_time: row.get(18).ok(),
            htf_trend: row.get(19).unwrap_or_default(), market_phase: row.get(20).unwrap_or_default(),
            dealing_range: row.get(21).unwrap_or_default(), narrative: row.get(22).unwrap_or_default(),
            scenario_type: row.get(23).unwrap_or_default(),
            exit_price: row.get(24).unwrap_or(0.0),
            execution_score: row.get(25).unwrap_or(0.0)
        })
    }).map_err(|e| { e.to_string() })?;

    let mut list = Vec::new();
    for r in rows { list.push(r.map_err(|e| e.to_string())?); }
    Ok(serde_json::to_string(&list).map_err(|e| e.to_string())?)
}

//--- 7. MISSED TRADES ---
#[command]
pub fn get_missed_trades_by_week(app: AppHandle, week_start_date: String, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM missed_trades WHERE week_start_date=?1 AND account_id=?2 ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![week_start_date, account_id], |row| {
        Ok(json!({
            "uuid": row.get::<_, String>(0)?, "account_id": row.get::<_, i64>(1)?,
            "week_start_date": row.get::<_, String>(2)?, "pair": row.get::<_, String>(3)?,
            "direction": row.get::<_, String>(4)?, "reason": row.get::<_, String>(5)?,
            "analysis_details": row.get::<_, String>(6)?, "images": row.get::<_, String>(7)?,
            "created_at": row.get::<_, i64>(8)?
        }).to_string())
    }).map_err(|e| e.to_string())?;
    let trades: Vec<_> = rows.collect::<Result<_, _>>().map_err(|e| e.to_string())?;
    Ok(serde_json::to_string(&trades).map_err(|e| e.to_string())?)
}
#[derive(Deserialize)]
pub struct TradeReviewInput { uuid: String, review_data: String, result_images: String }
#[command]
pub fn update_trade_review(app: AppHandle, input: TradeReviewInput) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("UPDATE scenarios SET review_data=?1, result_images=?2 WHERE uuid=?3",
        params![input.review_data, input.result_images, input.uuid]).map_err(|e| e.to_string())?;
    Ok(())
}
#[command]
pub fn create_missed_trade(app: AppHandle, uuid: String, account_id: i64, week_start_date: String, pair: String, direction: String, reason: String, analysis_details: String, images: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let created_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    conn.execute(
        "INSERT INTO missed_trades (uuid, account_id, week_start_date, pair, direction, reason, analysis_details, images, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![uuid, account_id, week_start_date, pair, direction, reason, analysis_details, images, created_at]
    ).map_err(|e| e.to_string())?;
    Ok(())
}
#[command]
pub fn delete_missed_trade(app: AppHandle, uuid: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM missed_trades WHERE uuid=?1", params![uuid]).map_err(|e| e.to_string())?;
    Ok(())
}
#[command]
pub fn force_close_trade(app: AppHandle, uuid: String, pnl: f64) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let close_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    conn.execute("UPDATE scenarios SET status='CLOSED', pnl=?1, close_time=?2 WHERE uuid=?3", params![pnl, close_time, uuid]).map_err(|e| e.to_string())?;
    Ok(())
}

//--- 8. DASHBOARD & MISC ---
#[derive(Serialize)] pub struct BreakdownItem { name: String, trades: i64, win_rate: f64, pf: f64, net_r: f64, pnl: f64 }
#[derive(Serialize)] pub struct DashboardStatsV2 { current_equity: f64, net_pnl: f64, pnl_percent: f64, max_drawdown: f64, profit_factor: f64, expectancy: f64, consecutive_losses: i64, days_since_peak: i64, avg_risk_per_trade: f64, win_rate: f64, net_r_total: f64, setup_performance: Vec<BreakdownItem>, warn_pf: bool, warn_dd: bool, warn_discipline: bool, long_ratio: f64 }
#[command] pub fn get_dashboard_stats(app: AppHandle, account_id: i64, _filter: Option<TradeFilter>) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let balance: f64 = conn.query_row("SELECT balance FROM accounts WHERE id=?1", params![account_id], |r| r.get(0)).unwrap_or(10000.0);
    let stats = DashboardStatsV2 {
        current_equity: balance, net_pnl: 0.0, pnl_percent: 0.0, max_drawdown: 0.0, profit_factor: 0.0, expectancy: 0.0,
        consecutive_losses: 0, days_since_peak: 0, avg_risk_per_trade: 0.0, win_rate: 0.0, net_r_total: 0.0, setup_performance: vec![],
        warn_pf: false, warn_dd: false, warn_discipline: false, long_ratio: 50.0
    };
    Ok(serde_json::to_string(&stats).map_err(|e| e.to_string())?)
}
#[command] pub fn get_equity_curve(_app: AppHandle, _account_id: i64) -> Result<String, String> { Ok("[]".to_string()) }
#[command] pub fn reset_all_data(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM scenarios WHERE account_id=?1", params![account_id]).map_err(|e| e.to_string())?;
    Ok("Reset Done".to_string())
}
#[command] pub fn update_scenario_log(app: AppHandle, uuid: String, notes: String, images: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("UPDATE scenarios SET analysis_details=?1, images=?2 WHERE uuid=?3", params![notes, images, uuid]).map_err(|e| e.to_string())?;
    Ok(())
}

//--- 9. BACKUP/RESTORE ---
#[derive(Serialize, Deserialize)]
struct BackupData {
    account_info: Option<Account>,
    scenarios: Vec<Scenario>,
    outlooks: Vec<WeeklyOutlookData>,
    reviews: Vec<serde_json::Value>,
    missed_trades: Vec<serde_json::Value>,
    timestamp: i64
}

#[command]
pub fn export_trades_json(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;

    let account_info = conn.query_row(
        "SELECT id, name, balance, currency, mql5_path, lot_size FROM accounts WHERE id = ?1",
        params![account_id],
        |row| Ok(Account {
            id: row.get(0)?, name: row.get(1)?, balance: row.get(2)?, currency: row.get(3)?,
            mql5_path: row.get(4).unwrap_or_default(), lot_size: row.get(5).unwrap_or(100000.0),
        })
    ).optional().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT uuid, pair, direction, status, pnl, analysis_details, pre_trade_checklist, images, setup_id, entry_price, sl_price, tp_price, volume, review_data, result_images, account_id, created_at, close_time, htf_trend, market_phase, dealing_range, narrative, scenario_type, exit_price, execution_score FROM scenarios WHERE account_id = ?1").map_err(|e| e.to_string())?;
    let scenarios = stmt.query_map(params![account_id], |row| {
        Ok(Scenario {
            uuid: row.get(0)?, pair: row.get(1)?, direction: row.get(2)?, status: row.get(3)?,
            pnl: row.get(4).unwrap_or(0.0), analysis_details: row.get(5).unwrap_or_default(),
            pre_trade_checklist: row.get(6).unwrap_or_default(), images: row.get(7).unwrap_or("[]".to_string()),
            setup_id: row.get(8).ok(), entry_price: row.get(9).unwrap_or(0.0),
            sl_price: row.get(10).unwrap_or(0.0), tp_price: row.get(11).unwrap_or(0.0),
            volume: row.get(12).unwrap_or(0.0), review_data: row.get(13).unwrap_or_default(),
            result_images: row.get(14).unwrap_or("[]".to_string()), account_id: row.get(15).unwrap_or(1),
            created_at: row.get(16).unwrap_or(0), script_plan: "".to_string(), 
            close_time: row.get(17).ok(),
            htf_trend: row.get(18).unwrap_or_default(), market_phase: row.get(19).unwrap_or_default(),
            dealing_range: row.get(20).unwrap_or_default(), narrative: row.get(21).unwrap_or_default(),
            scenario_type: row.get(22).unwrap_or_default(),
            exit_price: row.get(23).unwrap_or(0.0),
            execution_score: row.get(24).unwrap_or(0.0),
        })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, week_start_date, fa_bias, ta_bias, final_bias, script_plan, account_id FROM weekly_outlooks WHERE account_id = ?1").map_err(|e| e.to_string())?;
    let outlooks = stmt.query_map(params![account_id], |row| {
        Ok(WeeklyOutlookData {
            id: row.get(0)?, week_start_date: row.get(1)?, fa_bias: row.get(2)?, ta_bias: row.get(3).unwrap_or_default(),
            final_bias: row.get(4)?, script_plan: row.get(5)?, account_id: row.get(6).ok()
        })
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT uuid, account_id, week_start_date, pair, direction, reason, analysis_details, images, created_at FROM missed_trades WHERE account_id = ?1").map_err(|e| e.to_string())?;
    let missed_trades = stmt.query_map(params![account_id], |row| {
        Ok(json!({
            "uuid": row.get::<_, String>(0)?, "account_id": row.get::<_, i64>(1)?,
            "week_start_date": row.get::<_, String>(2)?, "pair": row.get::<_, String>(3)?,
            "direction": row.get::<_, String>(4)?, "reason": row.get::<_, String>(5)?,
            "analysis_details": row.get::<_, String>(6)?, "images": row.get::<_, String>(7)?,
            "created_at": row.get::<_, i64>(8)?
        }))
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, week_start_date, total_trades, win_rate, net_pnl, fa_accuracy, ta_accuracy, fusion_score, review_details, account_id FROM weekly_reviews WHERE account_id = ?1").map_err(|e| e.to_string())?;
    let reviews = stmt.query_map(params![account_id], |row| {
        Ok(json!({
            "id": row.get::<_, String>(0)?, "week_start_date": row.get::<_, String>(1)?,
            "total_trades": row.get::<_, i64>(2)?, "win_rate": row.get::<_, f64>(3)?,
            "net_pnl": row.get::<_, f64>(4)?, "fa_accuracy": row.get::<_, i64>(5)?,
            "ta_accuracy": row.get::<_, i64>(6)?, "fusion_score": row.get::<_, i64>(7)?,
            "review_details": row.get::<_, String>(8)?, "account_id": row.get::<_, i64>(9)?
        }))
    }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    let backup = BackupData {
        account_info, scenarios, outlooks, reviews, missed_trades,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64,
    };

    let json = serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())?;

    let file_path = app.dialog().file()
        .add_filter("JSON", &["json"])
        .set_file_name("mfja_backup.json")
        .blocking_save_file();

    if let Some(path) = file_path {
        fs::write(path.into_path().unwrap(), json).map_err(|e| e.to_string())?;
        Ok("Backup Saved Successfully".to_string())
    } else {
        Ok("Cancelled".to_string())
    }
}

#[command]
pub fn import_trades_json(app: AppHandle, account_id: i64) -> Result<String, String> {
    let file_path = app.dialog().file().add_filter("JSON", &["json"]).blocking_pick_file();

    if let Some(path) = file_path {
        let content = fs::read_to_string(path.into_path().unwrap()).map_err(|e| e.to_string())?;
        let backup: BackupData = serde_json::from_str(&content).map_err(|e| format!("Invalid Backup File: {}", e))?;
        let conn = db::get_connection(&app).map_err(|e| e.to_string())?;

        for s in backup.scenarios {
            let _ = conn.execute(
                "INSERT OR REPLACE INTO scenarios (uuid, pair, direction, status, pnl, analysis_details, pre_trade_checklist, images, setup_id, entry_price, sl_price, tp_price, volume, review_data, result_images, account_id, created_at, close_time, htf_trend, market_phase, dealing_range, narrative, scenario_type, exit_price, execution_score) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25)",
                params![
                    s.uuid, s.pair, s.direction, s.status, s.pnl, s.analysis_details, s.pre_trade_checklist, s.images, s.setup_id, 
                    s.entry_price, s.sl_price, s.tp_price, s.volume, s.review_data, s.result_images, account_id,
                    s.created_at, s.close_time, s.htf_trend, s.market_phase, s.dealing_range, s.narrative, s.scenario_type, s.exit_price, s.execution_score
                ]
            );
        }

        for o in backup.outlooks {
            let _ = conn.execute("INSERT OR REPLACE INTO weekly_outlooks (id, week_start_date, fa_bias, ta_bias, final_bias, script_plan, account_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![o.id, o.week_start_date, o.fa_bias, o.ta_bias, o.final_bias, o.script_plan, account_id]);
        }

        for m in backup.missed_trades {
             if let (Some(uuid), Some(week), Some(pair), Some(dir), Some(res), Some(ana), Some(img), Some(cat)) = 
                (m["uuid"].as_str(), m["week_start_date"].as_str(), m["pair"].as_str(), m["direction"].as_str(), m["reason"].as_str(), m["analysis_details"].as_str(), m["images"].as_str(), m["created_at"].as_i64()) {
                 let _ = conn.execute("INSERT OR REPLACE INTO missed_trades (uuid, account_id, week_start_date, pair, direction, reason, analysis_details, images, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                    params![uuid, account_id, week, pair, dir, res, ana, img, cat]);
             }
        }

        for r in backup.reviews {
             if let (Some(id), Some(week), Some(tot), Some(win), Some(pnl), Some(fa), Some(ta), Some(fus), Some(det)) = 
                (r["id"].as_str(), r["week_start_date"].as_str(), r["total_trades"].as_i64(), r["win_rate"].as_f64(), r["net_pnl"].as_f64(), r["fa_accuracy"].as_i64(), r["ta_accuracy"].as_i64(), r["fusion_score"].as_i64(), r["review_details"].as_str()) {
                 let _ = conn.execute("INSERT OR REPLACE INTO weekly_reviews (id, week_start_date, total_trades, win_rate, net_pnl, fa_accuracy, ta_accuracy, fusion_score, review_details, account_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                    params![id, week, tot, win, pnl, fa, ta, fus, det, account_id]);
             }
        }

        Ok("Imported Successfully".to_string())
    } else {
        Ok("Cancelled".to_string())
    }
}

// --- 10. MONITOR SIGNALS ---
#[derive(Serialize, Deserialize, Debug)] 
pub struct MarketSignal { symbol: String, direction: String, active_tags: Vec<String>, is_alerting: bool, score: i32, timestamp: i64 }

#[command]
pub fn watch_market_signals(app: AppHandle) -> Result<Vec<MarketSignal>, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let path_res: Option<String> = conn.query_row("SELECT mql5_path FROM accounts WHERE id = 1", [], |r| r.get(0)).optional().map_err(|e| e.to_string())?;
    let mql5_path = match path_res { Some(p) if !p.trim().is_empty() => p.trim().to_string(), _ => return Ok(Vec::new()), };
    let dir_path = Path::new(&mql5_path);
    if !dir_path.exists() { return Ok(Vec::new()); }

    let mut signals = Vec::new();
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("signal_") && name.ends_with(".json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(parsed_list) = serde_json::from_str::<Vec<MarketSignal>>(&content) {
                            if let Some(first) = parsed_list.first() {
                                signals.push(MarketSignal { symbol: first.symbol.clone(), direction: first.direction.clone(), active_tags: first.active_tags.clone(), is_alerting: first.is_alerting, score: first.score, timestamp: first.timestamp });
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(signals)
}

#[command]
pub fn check_heartbeat(app: AppHandle) -> Result<i64, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let path_res: Option<String> = conn.query_row("SELECT mql5_path FROM accounts WHERE id = 1", [], |r| r.get(0)).optional().unwrap_or(None);
    let mql5_path = match path_res { Some(p) if !p.trim().is_empty() => p.trim().to_string(), _ => return Ok(0) };
    let path = Path::new(&mql5_path).join("heartbeat.json");
    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(ts) = json.get("timestamp").and_then(|v| v.as_i64()) { return Ok(ts); }
        }
    }
    Ok(0)
}

// =====================================================================
// 11. PORTFOLIO & CEO MODE (PHASE 1, 2, 3 + GOD'S EYE)
// =====================================================================
#[derive(Serialize)]
pub struct PortfolioAccount {
    id: i64,
    name: String,
    balance: f64,
    allocation_percent: f64,
    status: String,
    net_pnl: f64,          // [NEW] Mắt thần: Lãi/Lỗ
    drawdown_percent: f64, // [NEW] Mắt thần: Chảy máu
    win_rate: f64,         // [NEW] Mắt thần: Tỷ lệ thắng
}

#[derive(Serialize)]
pub struct PortfolioMetrics {
    total_equity: f64,
    mode: String,
    max_daily_risk: f64,
    accounts: Vec<PortfolioAccount>,
    open_risk_usd: f64, 
}

#[command]
pub fn get_portfolio_metrics(app: AppHandle) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    
    let count: i64 = conn.query_row("SELECT count(*) FROM pragma_table_info('account_weights') WHERE name = 'status'", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 { let _ = conn.execute("ALTER TABLE account_weights ADD COLUMN status TEXT DEFAULT 'NORMAL'", []); }

    let (mode, max_risk): (String, f64) = conn.query_row(
        "SELECT mode, max_daily_risk_percent FROM portfolio_settings LIMIT 1", [], |row| Ok((row.get(0)?, row.get(1)?))
    ).unwrap_or(("NORMAL".to_string(), 2.0));

    let mut stmt = conn.prepare("SELECT a.id, a.name, a.balance, w.weight_percent, w.status FROM accounts a LEFT JOIN account_weights w ON a.id = w.account_id").unwrap();
    
    let mut total_equity = 0.0;
    let mut temp_accs = Vec::new();
    let accounts_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, f64>(2)?,
            row.get::<_, Option<f64>>(3)?.unwrap_or(-1.0), 
            row.get::<_, Option<String>>(4)?.unwrap_or("NORMAL".to_string())
        ))
    }).unwrap();

    for acc in accounts_iter {
        if let Ok(a) = acc { total_equity += a.2; temp_accs.push(a); }
    }

    let mut accounts = Vec::new();
    for (id, name, bal, weight, status) in temp_accs {
        let alloc = if weight >= 0.0 { weight } else { if total_equity > 0.0 { (bal / total_equity) * 100.0 } else { 0.0 } };
        
        // [NEW] SOI LỊCH SỬ TRADE CỦA TỪNG ACCOUNT
        let mut stmt_trades = conn.prepare("SELECT pnl FROM scenarios WHERE account_id = ?1 AND status = 'CLOSED'").unwrap();
        let trades_iter = stmt_trades.query_map(params![id], |r| r.get::<_, f64>(0)).unwrap();
        
        let mut net_pnl = 0.0;
        let mut wins = 0;
        let mut total_trades = 0;
        
        for t in trades_iter {
            if let Ok(p) = t {
                net_pnl += p;
                total_trades += 1;
                if p > 0.0 { wins += 1; }
            }
        }
        
        let win_rate = if total_trades > 0 { (wins as f64 / total_trades as f64) * 100.0 } else { 0.0 };
        // Giả định Baseline là 10,000 để soi Drawdown
        let drawdown_percent = if bal < 10000.0 { ((10000.0 - bal) / 10000.0) * 100.0 } else { 0.0 };

        accounts.push(PortfolioAccount { 
            id, name, balance: bal, allocation_percent: alloc, status,
            net_pnl, drawdown_percent, win_rate
        });
    }
    
    let metrics = PortfolioMetrics { total_equity, mode, max_daily_risk: max_risk, accounts, open_risk_usd: 0.0 };
    Ok(serde_json::to_string(&metrics).map_err(|e| e.to_string())?)
}

#[command]
pub fn update_portfolio_mode(app: AppHandle, mode: String) -> Result<(), String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    conn.execute("UPDATE portfolio_settings SET mode = ?1", params![mode]).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Deserialize)]
pub struct RebalancePayload {
    account_id: i64,
    weight_percent: f64,
    status: String,
}

#[command]
pub fn apply_portfolio_rebalance(app: AppHandle, payload: Vec<RebalancePayload>) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    
    let count: i64 = conn.query_row("SELECT count(*) FROM pragma_table_info('account_weights') WHERE name = 'status'", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 { let _ = conn.execute("ALTER TABLE account_weights ADD COLUMN status TEXT DEFAULT 'NORMAL'", []); }

    for item in payload {
        conn.execute(
            "INSERT OR REPLACE INTO account_weights (account_id, weight_percent, last_updated, status) VALUES (?1, ?2, ?3, ?4)",
            params![item.account_id, item.weight_percent, now, item.status]
        ).map_err(|e| e.to_string())?;
    }
    Ok("Đã áp dụng cấu trúc vốn mới thành công!".to_string())
}

fn get_usd_bias(pair: &str, direction: &str) -> i32 {
    let p = pair.to_uppercase(); let is_buy = direction.to_uppercase() == "BUY";
    if p.starts_with("USD") { if is_buy { 1 } else { -1 } } 
    else if p.ends_with("USD") || p.starts_with("XAU") || p.starts_with("BTC") || p.starts_with("US30") || p.starts_with("NAS") { if is_buy { -1 } else { 1 } } 
    else { 0 }
}

#[derive(Serialize)]
pub struct PortfolioState { mode: String, current_usd_bias: i32, account_status: String, account_weight: f64, total_equity: f64, }

#[command]
pub fn get_portfolio_state(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let mode: String = conn.query_row("SELECT mode FROM portfolio_settings LIMIT 1", [], |r| r.get(0)).unwrap_or("NORMAL".to_string());
    
    let mut stmt_active = conn.prepare("SELECT pair, direction FROM scenarios WHERE status IN ('ACTIVE', 'FILLED')").unwrap();
    let active_trades = stmt_active.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))).unwrap();
    let mut total_usd_bias = 0;
    for t in active_trades { if let Ok((p, d)) = t { total_usd_bias += get_usd_bias(&p, &d); } }

    let mut total_equity = 0.0;
    let mut stmt_eq = conn.prepare("SELECT balance FROM accounts").unwrap();
    let eq_iter = stmt_eq.query_map([], |r| r.get::<_, f64>(0)).unwrap();
    for bal in eq_iter { if let Ok(b) = bal { total_equity += b; } }

    let (weight, status): (f64, String) = conn.query_row("SELECT weight_percent, status FROM account_weights WHERE account_id = ?1", params![account_id], |r| Ok((r.get(0)?, r.get(1)?))).unwrap_or((-1.0, "NORMAL".to_string()));

    let state = PortfolioState { mode, current_usd_bias: total_usd_bias, account_status: status, account_weight: weight, total_equity };
    Ok(serde_json::to_string(&state).map_err(|e| e.to_string())?)
}

#[command]
pub fn execute_trade(app: AppHandle, scenario_uuid: String, order_type: String) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT pair, volume, entry_price, sl_price, tp_price, account_id FROM scenarios WHERE uuid = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![scenario_uuid]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let symbol: String = row.get(0).unwrap_or_default();
        let volume: f64 = row.get(1).unwrap_or(0.01);
        let price: f64 = row.get(2).unwrap_or(0.0);
        let sl: f64 = row.get(3).unwrap_or(0.0);
        let tp: f64 = row.get(4).unwrap_or(0.0);
        let account_id: i64 = row.get(5).unwrap_or(1); 

        let mode: String = conn.query_row("SELECT mode FROM portfolio_settings LIMIT 1", [], |r| r.get(0)).unwrap_or("NORMAL".to_string());
        if mode == "HALT" {
            let _ = conn.execute("INSERT INTO portfolio_risk_log (timestamp, account_id, pair, direction, requested_vol, status, reason) VALUES (?1, ?2, ?3, ?4, ?5, 'REJECTED', 'CEO HALT')", params![chrono::Utc::now().timestamp(), account_id, symbol, order_type, volume]);
            return Err("CEO TỪ CHỐI LỆNH: Hệ thống đang bị ĐÓNG BĂNG (HALT)!".to_string());
        }

        let direction = if order_type.contains("BUY") { "BUY" } else { "SELL" };
        let new_bias = get_usd_bias(&symbol, direction);
        let mut stmt_active = conn.prepare("SELECT pair, direction FROM scenarios WHERE status IN ('ACTIVE', 'FILLED')").unwrap();
        let active_trades = stmt_active.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))).unwrap();
        let mut total_usd_bias = 0;
        for t in active_trades { if let Ok((p, d)) = t { total_usd_bias += get_usd_bias(&p, &d); } }

        if total_usd_bias >= 2 && new_bias > 0 { return Err("CEO TỪ CHỐI LỆNH: Quỹ đang QUÁ MUA USD. Vi phạm rủi ro Tương quan!".to_string()); }
        if total_usd_bias <= -2 && new_bias < 0 { return Err("CEO TỪ CHỐI LỆNH: Quỹ đang QUÁ BÁN USD. Vi phạm rủi ro Tương quan!".to_string()); }

        let _ = conn.execute("INSERT INTO portfolio_risk_log (timestamp, account_id, pair, direction, requested_vol, status, reason) VALUES (?1, ?2, ?3, ?4, ?5, 'APPROVED', 'PASS')", params![chrono::Utc::now().timestamp(), account_id, symbol, direction, volume]);

        let path_str: String = conn.query_row("SELECT mql5_path FROM accounts WHERE id = ?1", params![account_id], |row| row.get(0)).unwrap_or_default();
        let mt5_path = std::path::Path::new(path_str.trim());
        if !mt5_path.exists() { return Err(format!("App không thấy thư mục này: '{}'", path_str)); }

        let cmd = serde_json::json!({ "scenario_id": scenario_uuid.clone(), "action": "NEW", "symbol": symbol, "order_type": order_type, "volume": volume, "price": price, "sl": sl, "tp": tp });
        let json_str = serde_json::to_string(&cmd).map_err(|e| e.to_string())?;
        fs::write(mt5_path.join("plan_to_mt5.json"), json_str).map_err(|e| format!("Lỗi ghi file: {}", e))?;

        Ok("Lệnh đã được CEO phê duyệt và gửi đi!".to_string())
    } else { Err("Scenario not found!".to_string()) }
}

// =====================================================================
// 12. KHÔI PHỤC HÀM CŨ (MT5 SYNC & DAILY LOCKOUT)
// =====================================================================
#[command]
pub fn sync_mt5_history(_app: AppHandle, _account_id: i64) -> Result<String, String> { Ok("MT5 Sync Triggered".to_string()) }

#[command]
pub fn check_daily_lockout(app: AppHandle, account_id: i64) -> Result<bool, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    let (balance, limit_str): (f64, Option<String>) = conn.query_row("SELECT balance, (SELECT value FROM settings WHERE key='daily_loss_limit_percent') FROM accounts WHERE id=?1", params![account_id], |r| Ok((r.get(0)?, r.get(1)?))).unwrap_or((10000.0, Some("5.0".to_string())));
    let limit_pct: f64 = limit_str.unwrap_or("5.0".to_string()).parse().unwrap_or(5.0);
    let max_loss = balance * (limit_pct / 100.0);
    let today_start = chrono::Local::now().date_naive().and_hms_opt(0, 0, 0).unwrap().timestamp();
    let today_pnl: f64 = conn.query_row("SELECT SUM(pnl) FROM scenarios WHERE account_id=?1 AND status='CLOSED' AND close_time >= ?2", params![account_id, today_start], |r| r.get(0)).unwrap_or(0.0);
    if today_pnl < 0.0 && today_pnl.abs() >= max_loss { Ok(true) } else { Ok(false) }
}

// =====================================================================
// 13. PERFORMANCE ENGINE (MÁY BẮT MẠCH HIỆU SUẤT)
// =====================================================================
use std::collections::HashMap;

#[derive(Serialize, Clone)]
pub struct StatMetrics {
    pub total_trades: i32,
    pub wins: i32,
    pub net_pnl: f64,
}

#[derive(Serialize)]
pub struct PerformanceAnalytics {
    pub by_score: HashMap<String, StatMetrics>,
    pub by_phase: HashMap<String, StatMetrics>,
}

#[command]
pub fn get_performance_analytics(app: AppHandle, account_id: i64) -> Result<String, String> {
    let conn = db::get_connection(&app).map_err(|e| e.to_string())?;
    
    // Lấy toàn bộ lệnh đã đóng của Account này
    let mut stmt = conn.prepare("SELECT pnl, pre_trade_checklist, market_phase FROM scenarios WHERE account_id = ?1 AND status = 'CLOSED'").unwrap();
    
    let mut by_score: HashMap<String, StatMetrics> = HashMap::new();
    let mut by_phase: HashMap<String, StatMetrics> = HashMap::new();

    // Khởi tạo sẵn các Hộp chứa Điểm số
    for k in ["A+ (85-100)", "B (70-84)", "C (60-69)", "F (<60)"] {
        by_score.insert(k.to_string(), StatMetrics { total_trades: 0, wins: 0, net_pnl: 0.0 });
    }

    let trades = stmt.query_map(params![account_id], |row| {
        Ok((
            row.get::<_, f64>(0)?, 
            row.get::<_, String>(1)?, 
            row.get::<_, String>(2)?
        ))
    }).unwrap();

    for t in trades {
        if let Ok((pnl, checklist_json, phase)) = t {
            let is_win = if pnl > 0.0 { 1 } else { 0 };
            
            // 1. Bóc tách Signal Score từ chuỗi JSON
            let mut score = 0;
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&checklist_json) {
                if let Some(s) = json.get("score").and_then(|v| v.as_i64()) {
                    score = s;
                }
            }

            // Phân loại vào Hộp Điểm số
            let score_key = if score >= 85 { "A+ (85-100)" }
                            else if score >= 70 { "B (70-84)" }
                            else if score >= 60 { "C (60-69)" }
                            else { "F (<60)" };

            if let Some(entry) = by_score.get_mut(score_key) {
                entry.total_trades += 1;
                entry.wins += is_win;
                entry.net_pnl += pnl;
            }

            // 2. Phân loại vào Hộp Market Phase (Giai đoạn thị trường)
            let phase_key = if phase.trim().is_empty() { "Unknown".to_string() } else { phase };
            let p_entry = by_phase.entry(phase_key).or_insert(StatMetrics { total_trades: 0, wins: 0, net_pnl: 0.0 });
            p_entry.total_trades += 1;
            p_entry.wins += is_win;
            p_entry.net_pnl += pnl;
        }
    }

    let analytics = PerformanceAnalytics { by_score, by_phase };
    Ok(serde_json::to_string(&analytics).map_err(|e| e.to_string())?)
}