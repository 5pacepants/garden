export type MapSelection =
  | { type: "plant"; id: string }
  | { type: "bed"; id: string }
  | { type: "zone"; id: string }
  | null;

export function isSelected(selection: MapSelection, type: NonNullable<MapSelection>["type"], id: string): boolean {
  return selection?.type === type && selection.id === id;
}
