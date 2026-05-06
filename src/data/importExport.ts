import type { GardenState } from "../domain/models";

export function exportGardenState(state: GardenState): string {
  return JSON.stringify(state, null, 2);
}

export function importGardenState(json: string): GardenState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Could not parse garden data");
  }

  if (hasUnsupportedVersion(parsed)) {
    throw new Error("Unsupported garden data version");
  }

  if (!isGardenState(parsed)) {
    throw new Error("Invalid garden data");
  }

  return parsed;
}

function hasUnsupportedVersion(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && "version" in value && (value as { version?: unknown }).version !== 1);
}

function isGardenState(value: unknown): value is GardenState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GardenState>;

  return (
    typeof candidate.version === "number" &&
    Boolean(candidate.map) &&
    Array.isArray(candidate.beds) &&
    Array.isArray(candidate.zones) &&
    Array.isArray(candidate.plants) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.historyEvents) &&
    Array.isArray(candidate.photos)
  );
}
