use tauri_plugin_shell;
use tauri_plugin_fs;
use tauri_plugin_dialog;
pub mod db;
pub mod bridge;
pub mod commands;
pub mod file_bridge;
pub mod watcher;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
 tauri::Builder::default()
 .plugin(tauri_plugin_shell::init())
 .plugin(tauri_plugin_fs::init())
 .plugin(tauri_plugin_dialog::init())
 .setup(|app| {
 // KHỞI TẠO DATABASE TỰ ĐỘNG
 // Dùng &app.handle() để lấy đúng kiểu dữ liệu init_db cần
 let handle = app.handle();
 db::init_db(&handle).expect("Error initializing database");
 Ok(())
 })
 .invoke_handler(tauri::generate_handler![
 // --- SYSTEM & DB
 commands::init_db,
 commands::get_accounts,
 commands::create_account,
 commands::save_setting,
 commands::get_setting,
 commands::update_account_settings,
 commands::reset_account_data,
 commands::delete_account,
 // --- IMAGES
 commands::pick_and_copy_images,
 commands::load_image_base64,
 //--- SCENARIO & EXECUTION ---
 commands::create_scenario,
 commands::get_scenarios,
 commands::update_scenario_log,
 commands::execute_trade,
 commands::sync_mt5_history, // Hàm mới sync PnL
 commands::check_daily_lockout, // Hàm mới check khóa mõm

 // [ĐÃ SỬA]: Dùng bridge thay cho commands cũ
 bridge::read_mt5_image,
 bridge::sync_bridge_data,
 commands::check_heartbeat,

 commands::set_scenario_status,
 commands::delete_scenario,
 commands::update_scenario_full,
 //--- LIBRARY ---
 commands::get_library_items,
 commands::save_library_item,
 commands::delete_library_item,
 commands::seed_default_library,
 //--- WEEKLY OUTLOOK & REVIEW
 commands::save_weekly_outlook,
 commands::get_outlook_by_week,
 commands::save_weekly_review,
 commands::get_review_by_week,
 // --- TRADE JOURNAL & FILTERS
 commands::get_trades_v2,
 commands::update_trade_review,
 // --- MISSED TRADES
 commands::create_missed_trade,
 commands::delete_missed_trade,
 commands::get_missed_trades_by_week,
 // --- DASHBOARD & STATS
 commands::get_equity_curve,
 commands::get_dashboard_stats,
 commands::get_app_settings,
 commands::update_app_settings,

 commands::reset_all_data,
 commands::export_trades_json,
 commands::import_trades_json,
 // [ĐÃ SỬA]: Dùng bridge thay cho commands cũ
 bridge::sync_bridge_data,
 bridge::read_mt5_image,

 commands::force_close_trade,
 commands::watch_market_signals,

 commands::get_portfolio_metrics,
 commands::update_portfolio_mode,
 commands::get_portfolio_state,
 commands::apply_portfolio_rebalance,
 commands::get_performance_analytics
 ])
 .run(tauri::generate_context!())
 .expect("error while running tauri application");
}