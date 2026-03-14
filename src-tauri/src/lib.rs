use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_fs::FsExt;

// ── Rust-side granted-dirs persistence ────────────────────────────────────────
// The list of user-granted directories lives in the app's own data dir,
// not in the WebView's localStorage — so a compromised frontend can't touch it.

fn granted_dirs_file(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.path().app_data_dir().ok().map(|d| d.join("granted_dirs.json"))
}

fn load_granted_dirs(app: &tauri::AppHandle) -> Vec<PathBuf> {
    let Some(file) = granted_dirs_file(app) else { return vec![] };
    let Ok(text) = std::fs::read_to_string(&file) else { return vec![] };
    serde_json::from_str::<Vec<String>>(&text)
        .unwrap_or_default()
        .into_iter()
        .map(PathBuf::from)
        .collect()
}

fn save_granted_dirs(app: &tauri::AppHandle, dirs: &[PathBuf]) {
    let Some(file) = granted_dirs_file(app) else { return };
    if let Some(parent) = file.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let strings: Vec<String> = dirs.iter().map(|p| p.to_string_lossy().into_owned()).collect();
    if let Ok(json) = serde_json::to_string(&strings) {
        let _ = std::fs::write(file, json);
    }
}

fn apply_scope(app: &tauri::AppHandle, dirs: &[PathBuf]) {
    for dir in dirs {
        let _ = app.fs_scope().allow_directory(dir, true);
    }
}

// ── Desktop-only command ───────────────────────────────────────────────────────
// The native folder picker runs entirely in Rust. The frontend receives only
// the resulting path string for display — it never gets to specify which path
// is granted. A compromised frontend cannot grant itself access to arbitrary paths.

#[cfg(not(target_os = "android"))]
#[tauri::command]
async fn pick_and_grant_dir(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    use std::sync::mpsc;

    let (tx, rx) = mpsc::channel();

    // pick_folder is callback-based; the plugin dispatches the dialog on the
    // main thread internally, so we must not block here — just schedule it.
    app.dialog().file().pick_folder(move |result| {
        let _ = tx.send(result);
    });

    // Wait on a thread-pool thread so the async executor stays free while the
    // user interacts with the dialog (blocking_pick_folder deadlocks on macOS).
    let maybe = tauri::async_runtime::spawn_blocking(move || rx.recv())
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())?;

    let Some(file_path) = maybe else { return Ok(None) };
    let path_buf = file_path.into_path().map_err(|e| e.to_string())?;
    let path_str = path_buf.to_string_lossy().into_owned();

    app.fs_scope()
        .allow_directory(&path_buf, true)
        .map_err(|e| e.to_string())?;

    let mut dirs = load_granted_dirs(&app);
    if !dirs.iter().any(|d| *d == path_buf) {
        dirs.push(path_buf);
        save_granted_dirs(&app, &dirs);
    }

    Ok(Some(path_str))
}

// ── App entry point ────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_android_fs::init())
        .setup(|app| {
            // Restore fs scope from Rust-side persisted dirs — no frontend call needed.
            // This runs before any WebView code, so the scope is ready immediately.
            #[cfg(not(target_os = "android"))]
            apply_scope(&app.handle(), &load_granted_dirs(&app.handle()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            #[cfg(not(target_os = "android"))]
            pick_and_grant_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
