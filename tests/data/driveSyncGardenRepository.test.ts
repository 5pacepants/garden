import { describe, expect, it } from "vitest";
import { createDemoGardenState } from "../../src/domain/fixtures";
import type { GardenState } from "../../src/domain/models";
import type { GardenRepository } from "../../src/data/gardenRepository";
import { DriveSyncGardenRepository, type DriveSyncStorage } from "../../src/data/driveSyncGardenRepository";

class MemoryGardenRepository implements GardenRepository {
  savedState: GardenState | null = null;
  hasStored = false;

  constructor(private readonly fallbackState: GardenState = createDemoGardenState()) {}

  async load(): Promise<GardenState> {
    return this.savedState ?? this.fallbackState;
  }

  async save(state: GardenState): Promise<void> {
    this.savedState = state;
    this.hasStored = true;
  }

  hasStoredState(): boolean {
    return this.hasStored;
  }

  exportJson(state: GardenState): string {
    return JSON.stringify(state, null, 2);
  }

  importJson(json: string): GardenState {
    return JSON.parse(json) as GardenState;
  }
}

class MemoryDriveSyncStorage implements DriveSyncStorage {
  json: string | null = null;

  async read(): Promise<string | null> {
    return this.json;
  }

  async write(json: string): Promise<void> {
    this.json = json;
  }
}

describe("drive sync garden repository", () => {
  it("saves to the local repository and mirrors the exported JSON to drive storage", async () => {
    const localRepository = new MemoryGardenRepository();
    const driveStorage = new MemoryDriveSyncStorage();
    const repository = new DriveSyncGardenRepository(localRepository, driveStorage);
    const state = createDemoGardenState();
    state.map.name = "Drive-synkad tradgard";

    await repository.save(state);

    expect(localRepository.savedState?.map.name).toBe("Drive-synkad tradgard");
    expect(JSON.parse(driveStorage.json ?? "{}").map.name).toBe("Drive-synkad tradgard");
  });

  it("loads from drive storage when local storage is empty", async () => {
    const fallbackState = createDemoGardenState();
    fallbackState.plants = [];
    const localRepository = new MemoryGardenRepository(fallbackState);
    const driveStorage = new MemoryDriveSyncStorage();
    const driveState = createDemoGardenState();
    driveState.map.name = "Fran Drive";
    driveStorage.json = JSON.stringify(driveState);
    const repository = new DriveSyncGardenRepository(localRepository, driveStorage);

    const loaded = await repository.load();

    expect(loaded.map.name).toBe("Fran Drive");
    expect(localRepository.savedState?.map.name).toBe("Fran Drive");
  });

  it("restores drive storage when the local state is an empty desktop state", async () => {
    const localState = createDemoGardenState();
    localState.plants = [];
    localState.beds = [];
    localState.zones = [];
    localState.tasks = [];
    localState.historyEvents = [];
    localState.photos = [];
    const localRepository = new MemoryGardenRepository(localState);
    localRepository.savedState = localState;
    localRepository.hasStored = true;
    const driveStorage = new MemoryDriveSyncStorage();
    const driveState = createDemoGardenState();
    driveState.plants[0] = { ...driveState.plants[0], swedishName: "Sparad planta" };
    driveStorage.json = JSON.stringify(driveState);
    const repository = new DriveSyncGardenRepository(localRepository, driveStorage);

    const loaded = await repository.load();

    expect(loaded.plants.map((plant) => plant.swedishName)).toContain("Sparad planta");
    expect(localRepository.savedState?.plants.map((plant) => plant.swedishName)).toContain("Sparad planta");
  });
});
