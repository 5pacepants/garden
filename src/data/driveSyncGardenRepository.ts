import type { GardenState } from "../domain/models";
import type { GardenRepository } from "./gardenRepository";

export interface DriveSyncStorage {
  read(): Promise<string | null>;
  write(json: string): Promise<void>;
}

type LocalGardenRepository = GardenRepository & {
  hasStoredState?: () => boolean;
};

export class DriveSyncGardenRepository implements GardenRepository {
  constructor(
    private readonly localRepository: LocalGardenRepository,
    private readonly driveStorage: DriveSyncStorage,
  ) {}

  async load(): Promise<GardenState> {
    if (this.localRepository.hasStoredState && !this.localRepository.hasStoredState()) {
      const driveJson = await this.driveStorage.read();

      if (driveJson) {
        const driveState = this.importJson(driveJson);
        await this.localRepository.save(driveState);
        return driveState;
      }
    }

    const localState = await this.localRepository.load();
    const driveJson = await this.driveStorage.read();

    if (!driveJson) {
      return localState;
    }

    const driveState = this.importJson(driveJson);

    if (isEmptyGardenState(localState) && !isEmptyGardenState(driveState)) {
      await this.localRepository.save(driveState);
      return driveState;
    }

    return localState;
  }

  async save(state: GardenState): Promise<void> {
    await this.localRepository.save(state);
    await this.driveStorage.write(this.exportJson(state));
  }

  exportJson(state: GardenState): string {
    return this.localRepository.exportJson(state);
  }

  importJson(json: string): GardenState {
    return this.localRepository.importJson(json);
  }
}

function isEmptyGardenState(state: GardenState): boolean {
  return (
    state.beds.length === 0 &&
    state.zones.length === 0 &&
    state.plants.length === 0 &&
    state.tasks.length === 0 &&
    state.historyEvents.length === 0 &&
    state.photos.length === 0
  );
}
