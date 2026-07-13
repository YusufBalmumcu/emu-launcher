use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Serialize;
use serde_json::Value;
use tauri::Manager;

const CONFIG_FILE: &str = "emulators.json";
const SCAN_DEFAULT_DEPTH: usize = 4;
const SCAN_MAX_RESULTS: usize = 5000;

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Config directory could not be resolved: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Config directory could not be created: {e}"))?;
    Ok(dir.join(CONFIG_FILE))
}

// The config is stored and returned as opaque JSON: the frontend owns the
// schema (emulators, groups, settings…), so new fields can be added without
// touching the backend. Returns whatever is on disk (may be the legacy bare
// emulator array or the newer state object); the frontend migrates it.
#[tauri::command]
fn load_data(app: tauri::AppHandle) -> Result<Value, String> {
    let path = config_path(&app)?;
    if !path.exists() {
        return Ok(Value::Null);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Config could not be read: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Config file is corrupted: {e}"))
}

#[tauri::command]
fn save_data(app: tauri::AppHandle, data: Value) -> Result<(), String> {
    let path = config_path(&app)?;
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Config could not be serialized: {e}"))?;
    // Write to a temp file first so a crash mid-write can't corrupt the config.
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| format!("Config could not be written: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("Config could not be saved: {e}"))?;
    Ok(())
}

#[tauri::command]
fn launch_emulator(exe_path: String) -> Result<(), String> {
    let path = Path::new(&exe_path);
    if !path.exists() {
        return Err(format!("File not found: {exe_path}"));
    }

    let mut cmd = Command::new(path);
    // Many emulators resolve their own config/BIOS files relative to the
    // working directory, so launch from the exe's folder.
    if let Some(parent) = path.parent() {
        cmd.current_dir(parent);
    }
    // No creation flags: mirror Explorer's behaviour. Console-subsystem
    // emulators (e.g. Ryujinx, which sets its console title on startup) get
    // their own console automatically, while GUI emulators get none. Using
    // DETACHED_PROCESS here left console apps without a valid console handle,
    // crashing them with an IOException. The child stays independent of the
    // launcher either way.
    cmd.spawn().map_err(|e| format!("Could not start: {e}"))?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ExeEntry {
    path: String,
    file_name: String,
    dir_name: String,
}

// Recursively collects .exe files under `dir`, so the frontend can match them
// against known emulator signatures. Depth-limited and capped to avoid runaway
// scans on huge trees.
#[tauri::command]
fn scan_directory(dir: String, max_depth: Option<usize>) -> Result<Vec<ExeEntry>, String> {
    let root = Path::new(&dir);
    if !root.is_dir() {
        return Err(format!("Not a folder: {dir}"));
    }
    let mut out = Vec::new();
    scan_recursive(root, max_depth.unwrap_or(SCAN_DEFAULT_DEPTH), &mut out);
    Ok(out)
}

fn scan_recursive(dir: &Path, depth: usize, out: &mut Vec<ExeEntry>) {
    if out.len() >= SCAN_MAX_RESULTS {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return, // unreadable dir (permissions etc.) — skip silently
    };
    for entry in entries.flatten() {
        if out.len() >= SCAN_MAX_RESULTS {
            return;
        }
        let path = entry.path();
        let file_type = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        if file_type.is_dir() {
            if depth == 0 {
                continue;
            }
            let dname = entry.file_name().to_string_lossy().to_lowercase();
            // Skip hidden and obvious non-emulator dirs.
            if dname.starts_with('.') || dname == "node_modules" || dname == "$recycle.bin" {
                continue;
            }
            scan_recursive(&path, depth - 1, out);
        } else if file_type.is_file()
            && path
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| e.eq_ignore_ascii_case("exe"))
                .unwrap_or(false)
        {
            let file_name = path
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_default();
            let dir_name = path
                .parent()
                .and_then(|p| p.file_name())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            out.push(ExeEntry {
                path: path.to_string_lossy().to_string(),
                file_name,
                dir_name,
            });
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            launch_emulator,
            scan_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
