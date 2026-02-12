import { Html } from "@react-three/drei";

export interface StringZone {
  id: string;
  panelIndices: number[];
  color: string;
  label: string;
}

interface StringZone3DProps {
  zone: StringZone;
  panelPositions: [number, number, number][];
  visible: boolean;
}

const ZONE_COLORS = [
  "#F44336", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0",
  "#00BCD4", "#CDDC39", "#E91E63", "#3F51B5", "#009688",
];

export function getZoneColor(index: number): string {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}

export function StringZone3D({ zone, panelPositions, visible }: StringZone3DProps) {
  if (!visible || zone.panelIndices.length === 0) return null;

  // Calculate zone center
  const centerX = zone.panelIndices.reduce((sum, i) => sum + (panelPositions[i]?.[0] || 0), 0) / zone.panelIndices.length;
  const centerZ = zone.panelIndices.reduce((sum, i) => sum + (panelPositions[i]?.[2] || 0), 0) / zone.panelIndices.length;

  return (
    <group>
      <Html position={[centerX, 1.5, centerZ]} center>
        <div
          className="px-2 py-1 rounded text-xs font-bold text-white shadow-lg whitespace-nowrap"
          style={{ backgroundColor: zone.color }}
        >
          {zone.label} ({zone.panelIndices.length} panels)
        </div>
      </Html>
    </group>
  );
}

/** Auto-generate string zones based on panel count and inverter specs */
export function autoGenerateStrings(
  panelCount: number,
  panelWatt: number,
  panelsPerString: number = 12
): StringZone[] {
  const zones: StringZone[] = [];
  let panelIdx = 0;

  while (panelIdx < panelCount) {
    const stringSize = Math.min(panelsPerString, panelCount - panelIdx);
    const indices = Array.from({ length: stringSize }, (_, i) => panelIdx + i);
    zones.push({
      id: `string-${zones.length + 1}`,
      panelIndices: indices,
      color: getZoneColor(zones.length),
      label: `String ${zones.length + 1}`,
    });
    panelIdx += stringSize;
  }

  return zones;
}
