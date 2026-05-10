use std::{env, fs};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const GARDEN_LATITUDE: f64 = 58.092754;
const GARDEN_LONGITUDE: f64 = 14.533179;
const WEATHER_USER_AGENT: &str = "MinTradgard/0.1.0 private garden desktop app";
const MEDIA_REFERENCE_PREFIX: &str = "appmedia://";

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredMedia {
    reference: String,
    file_name: String,
    url: String,
}

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

#[tauri::command]
fn pick_and_store_image(app: AppHandle) -> Result<Option<StoredMedia>, String> {
    let Some(source_path) = rfd::FileDialog::new()
        .add_filter("Images", &["avif", "bmp", "gif", "jpg", "jpeg", "png", "webp"])
        .pick_file()
    else {
        return Ok(None);
    };

    let media_dir = media_dir(&app)?;
    fs::create_dir_all(&media_dir).map_err(|error| error.to_string())?;

    let file_name = stored_media_file_name(&source_path)?;
    let target_path = media_dir.join(&file_name);
    fs::copy(&source_path, &target_path).map_err(|error| error.to_string())?;

    Ok(Some(StoredMedia {
        reference: format!("{MEDIA_REFERENCE_PREFIX}{file_name}"),
        file_name,
        url: target_path.to_string_lossy().to_string(),
    }))
}

#[tauri::command]
fn resolve_media_url(app: AppHandle, reference: String) -> Result<String, String> {
    let path = media_path_from_reference(&app, &reference)?;
    Ok(path.to_string_lossy().to_string())
}

fn media_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("media"))
        .map_err(|error| error.to_string())
}

fn media_path_from_reference(app: &AppHandle, reference: &str) -> Result<PathBuf, String> {
    let file_name = reference
        .strip_prefix(MEDIA_REFERENCE_PREFIX)
        .ok_or_else(|| "Ogiltig mediareferens.".to_string())?;

    if file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err("Ogiltig mediareferens.".to_string());
    }

    Ok(media_dir(app)?.join(file_name))
}

fn stored_media_file_name(source_path: &Path) -> Result<String, String> {
    let extension = source_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_else(|| "jpg".to_string());
    let stem = source_path
        .file_stem()
        .and_then(|value| value.to_str())
        .map(sanitize_file_stem)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "image".to_string());
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();

    Ok(format!("{stem}-{timestamp}.{extension}"))
}

fn sanitize_file_stem(value: &str) -> String {
    value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '-'
            }
        })
        .collect()
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
            fetch_weather_forecast,
            pick_and_store_image,
            resolve_media_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
