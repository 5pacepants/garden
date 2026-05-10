use std::{env, fs};
use std::path::{Path, PathBuf};

const GARDEN_LATITUDE: f64 = 58.092754;
const GARDEN_LONGITUDE: f64 = 14.533179;
const WEATHER_USER_AGENT: &str = "MinTradgard/0.1.0 private garden desktop app";

#[tauri::command]
fn read_drive_sync_backup() -> Result<Option<String>, String> {
    let path = drive_sync_backup_path();

    if !path.exists() {
        return Ok(None);
    }

    fs::read_to_string(path).map(Some).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_drive_sync_backup(json: String) -> Result<(), String> {
    let path = drive_sync_backup_path();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(path, json).map_err(|error| error.to_string())
}

#[tauri::command]
fn fetch_weather_forecast() -> Result<String, String> {
    let url = format!(
        "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={:.6}&lon={:.6}",
        GARDEN_LATITUDE, GARDEN_LONGITUDE
    );

    ureq::get(&url)
        .set("User-Agent", WEATHER_USER_AGENT)
        .call()
        .map_err(|error| error.to_string())?
        .into_string()
        .map_err(|error| error.to_string())
}

fn drive_sync_backup_path() -> PathBuf {
    if let Some(path) = configured_drive_sync_dir() {
        return path.join("garden-state.json");
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    for ancestor in manifest_dir.ancestors() {
        let drive_sync_dir = ancestor.join("drive-sync");

        if drive_sync_dir.exists() {
            return drive_sync_dir.join("garden-state.json");
        }
    }

    manifest_dir.join("drive-sync").join("garden-state.json")
}

fn configured_drive_sync_dir() -> Option<PathBuf> {
    if let Some(path) = env::var_os("GARDEN_DRIVE_SYNC_DIR").map(PathBuf::from) {
        return Some(path);
    }

    env::var_os("USERPROFILE")
        .map(PathBuf::from)
        .map(|home| home.join(Path::new("Documents").join("Koderi").join("Garden").join("drive-sync")))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_drive_sync_backup,
            write_drive_sync_backup,
            fetch_weather_forecast
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
