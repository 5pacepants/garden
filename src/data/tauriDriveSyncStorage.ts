import { invoke } from "@tauri-apps/api/core";
import type { DriveSyncStorage } from "./driveSyncGardenRepository";

export class TauriDriveSyncStorage implements DriveSyncStorage {
  read(): Promise<string | null> {
    return invoke<string | null>("read_drive_sync_backup");
  }

  write(json: string): Promise<void> {
    return invoke("write_drive_sync_backup", { json });
  }
}
