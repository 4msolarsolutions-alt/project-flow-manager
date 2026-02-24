// ========== EPC-Grade Solar Design Calculations ==========

export const PANEL_OPTIONS = [
  { label: "630Wp Bifacial G12", watt: 630, length: 2.465, width: 1.303, weight: 35, cellType: "G12 210mm", efficiency: 23.3 },
  { label: "620Wp Bifacial", watt: 620, length: 2.384, width: 1.303, weight: 34, cellType: "N-Type Bifacial", efficiency: 23.0 },
  { label: "615Wp TOPCon", watt: 615, length: 2.278, width: 1.134, weight: 31, cellType: "N-Type TOPCon", efficiency: 22.8 },
  { label: "550W Panel", watt: 550, length: 2.278, width: 1.134, weight: 28.6, cellType: "Mono PERC", efficiency: 21.3 },
  { label: "540W Panel", watt: 540, length: 2.278, width: 1.134, weight: 28.2, cellType: "Mono PERC", efficiency: 21.0 },
  { label: "500W Panel", watt: 500, length: 2.187, width: 1.102, weight: 26.5, cellType: "Mono PERC", efficiency: 20.5 },
  { label: "450W Panel", watt: 450, length: 2.094, width: 1.038, weight: 24.0, cellType: "Mono PERC", efficiency: 19.8 },
  { label: "400W Panel", watt: 400, length: 1.956, width: 1.002, weight: 22.0, cellType: "Mono PERC", efficiency: 19.2 },
  { label: "335W Panel", watt: 335, length: 1.690, width: 0.996, weight: 18.5, cellType: "Poly", efficiency: 17.1 },
] as const;

export type PanelOption = typeof PANEL_OPTIONS[number];
export type PanelOrientation = "landscape" | "portrait";
export type RoofType = "rcc" | "metal_sheet" | "tile" | "ground_mount";
export type StructureType = "ballast" | "anchor";
export type ClampType = "mid_clamp" | "end_clamp" | "l_foot";

export interface ObstacleItem {
  id: string;
  type: "water_tank" | "lift_room" | "staircase" | "ac_unit" | "parapet_wall" | "custom";
  position: [number, number, number];
  length: number;
  width: number;
  height: number;
  label?: string;
}

export interface WalkwayItem {
  id: string;
  type: "perimeter" | "central" | "custom";
  width: number;
  path: { lat: number; lng: number }[];
}

export interface PipelineItem {
  id: string;
  width: number;
  clearance: number;
  path: { lat: number; lng: number }[];
}

export interface DesignStats {
  totalPanels: number;
  totalCapacityKW: number;
  totalRoofAreaM2: number;
  usableAreaM2: number;
  occupiedAreaM2: number;
  roofUtilization: number;
  dailyEnergyKWh: number;
  annualEnergyKWh: number;
  rowSpacingM: number;
  panelsPerRow: number;
  totalRows: number;
  structuralLoadKgM2: number;
  inverterSuggestion: string;
  epcRevenue: number;
  materialCost: number;
  grossProfit: number;
}

export interface RCCDetails {
  structureType: StructureType;
  deadLoadLimit: number; // kg/m2
  totalLoad: number;
  isSafe: boolean;
}

export interface MetalRoofDetails {
  purlinSpacing: number; // mm
  clampType: ClampType;
  clampCount: number;
  railCount: number;
  fastenerCount: number;
}

export interface ComplianceStatus {
  perimeterWalkway: boolean;
  centralAccess: boolean;
  stairClearance: boolean;
  fireSafe: boolean;
  overallCompliant: boolean;
}

// ========== Conversion Helpers ==========
export function metersToLatDeg(m: number): number { return m / 111320; }
export function metersToLngDeg(m: number, lat: number): number { return m / (111320 * Math.cos((lat * Math.PI) / 180)); }

export function latLngToMeters(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========== Polygon Area (Shoelace) ==========
export function polygonAreaM2(polygon: { lat: number; lng: number }[]): number {
  if (polygon.length < 3) return 0;
  const local = polygonToLocal(polygon);
  let area = 0;
  for (let i = 0, j = local.length - 1; i < local.length; j = i++) {
    area += local[j].x * local[i].z - local[i].x * local[j].z;
  }
  return Math.abs(area / 2);
}

export function polygonToLocal(polygon: { lat: number; lng: number }[]): { x: number; z: number }[] {
  if (polygon.length === 0) return [];
  const centerLat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const centerLng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
  return polygon.map((p) => ({
    x: (p.lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180),
    z: -(p.lat - centerLat) * 111320,
  }));
}

// ========== Optimal Tilt ==========
export function optimalTilt(latitude: number): number {
  return Math.round(Math.abs(latitude));
}

// ========== Wind Zone (India-based) ==========
export function getWindZone(lat: number, lng: number): string {
  // Simplified Indian wind zone classification
  if (lat > 22 && lng > 85) return "Zone IV (47 m/s)";
  if (lat > 20 && lng < 75) return "Zone III (44 m/s)";
  if (lat > 15) return "Zone II (39 m/s)";
  return "Zone I (33 m/s)";
}

// ========== Row Spacing ==========
export function calculateRowSpacing(panelHeight: number, tiltAngle: number): number {
  const tiltRad = (tiltAngle * Math.PI) / 180;
  return panelHeight * Math.tan(tiltRad);
}

// ========== Panel Placement Engine ==========
export function calculatePanelLayout(
  roofAreaM2: number,
  usableAreaM2: number,
  panel: PanelOption,
  orientation: PanelOrientation,
  tiltAngle: number
): { panelsPerRow: number; totalRows: number; totalPanels: number } {
  const panelW = orientation === "landscape" ? panel.length : panel.width;
  const panelH = orientation === "landscape" ? panel.width : panel.length;
  const rowSpacing = calculateRowSpacing(panelH, tiltAngle);
  const effectiveRowHeight = panelH + Math.max(rowSpacing, 0.3);

  // Approximate using square root of area for dimensions
  const side = Math.sqrt(usableAreaM2);
  const panelsPerRow = Math.floor(side / (panelW + 0.1));
  const totalRows = Math.floor(side / effectiveRowHeight);
  const totalPanels = panelsPerRow * totalRows;

  return { panelsPerRow, totalRows, totalPanels };
}

// ========== Design Stats Calculation ==========
export function calculateDesignStats(
  panelCount: number,
  panel: PanelOption,
  orientation: PanelOrientation,
  tiltAngle: number,
  roofAreaM2: number,
  usableAreaM2: number,
  latitude: number
): DesignStats {
  const capacityKW = (panelCount * panel.watt) / 1000;
  const tiltFactor = Math.cos(((tiltAngle - optimalTilt(latitude)) * Math.PI) / 180);
  const dailyEnergy = capacityKW * 5.5 * 0.75 * Math.max(tiltFactor, 0.7);
  const annualEnergy = dailyEnergy * 365;

  const panelW = orientation === "landscape" ? panel.length : panel.width;
  const panelH = orientation === "landscape" ? panel.width : panel.length;
  const rowSpacing = calculateRowSpacing(panelH, tiltAngle);
  const panelArea = panelW * panelH;
  const occupiedArea = panelCount * panelArea;

  const totalWeight = panelCount * panel.weight + panelCount * 5; // 5kg for mounting per panel
  const structuralLoad = usableAreaM2 > 0 ? totalWeight / usableAreaM2 : 0;

  // Approximate layout
  const side = Math.sqrt(usableAreaM2);
  const panelsPerRow = Math.max(1, Math.floor(side / (panelW + 0.1)));
  const totalRows = panelCount > 0 ? Math.ceil(panelCount / panelsPerRow) : 0;

  const epcRevenue = capacityKW * 60000;
  const materialCost = capacityKW * 42000;

  return {
    totalPanels: panelCount,
    totalCapacityKW: capacityKW,
    totalRoofAreaM2: roofAreaM2,
    usableAreaM2,
    occupiedAreaM2: occupiedArea,
    roofUtilization: roofAreaM2 > 0 ? (occupiedArea / roofAreaM2) * 100 : 0,
    dailyEnergyKWh: dailyEnergy,
    annualEnergyKWh: annualEnergy,
    rowSpacingM: rowSpacing,
    panelsPerRow,
    totalRows,
    structuralLoadKgM2: structuralLoad,
    inverterSuggestion: getInverterSuggestion(capacityKW),
    epcRevenue,
    materialCost,
    grossProfit: epcRevenue - materialCost,
  };
}

export function getInverterSuggestion(capacityKW: number): string {
  if (capacityKW <= 3) return "3kW Inverter";
  if (capacityKW <= 5) return "5kW Inverter";
  if (capacityKW <= 8) return "8kW Inverter";
  if (capacityKW <= 10) return "10kW Inverter";
  if (capacityKW <= 15) return "15kW Inverter";
  if (capacityKW <= 20) return "20kW Inverter";
  if (capacityKW <= 30) return "30kW Inverter";
  if (capacityKW <= 50) return "2× 25kW Inverters";
  return `${Math.ceil(capacityKW / 50)}× 50kW Inverters`;
}

// ========== RCC Calculations ==========
export function calculateRCCLoad(
  panelCount: number,
  panelWeight: number,
  structureType: StructureType,
  roofAreaM2: number,
  deadLoadLimit: number
): RCCDetails {
  const mountWeight = structureType === "ballast" ? 15 : 8; // kg per panel
  const totalLoad = panelCount * (panelWeight + mountWeight);
  const loadPerM2 = roofAreaM2 > 0 ? totalLoad / roofAreaM2 : 0;

  return {
    structureType,
    deadLoadLimit,
    totalLoad,
    isSafe: loadPerM2 <= deadLoadLimit,
  };
}

// ========== Metal Roof Calculations ==========
export function calculateMetalRoof(
  panelCount: number,
  orientation: PanelOrientation,
  panelLength: number,
  purlinSpacing: number,
  clampType: ClampType,
  roofWidthM?: number
): MetalRoofDetails {
  // Rail count based on roof width / 1.2m standard rail spacing
  const railCount = roofWidthM && roofWidthM > 0
    ? Math.ceil(roofWidthM / 1.2)
    : Math.ceil(panelCount * (orientation === "landscape" ? 2 : 3) * 0.5);

  // 4 clamps per panel
  const clampCount = panelCount * 4;

  // 2 fasteners per clamp
  const fastenerCount = clampCount * 2;

  return {
    purlinSpacing,
    clampType,
    clampCount,
    railCount,
    fastenerCount,
  };
}

// ========== Wind Load Warning ==========
export function getWindLoadWarning(panelLength: number, windZone: string): string | null {
  if (panelLength > 2.3 && windZone.toLowerCase().includes("iv")) {
    return "High wind risk – Recommend additional anchoring";
  }
  if (panelLength > 2.3 && windZone.toLowerCase().includes("iii")) {
    return "Moderate wind risk – Verify anchor design";
  }
  return null;
}

// ========== Safety Edge ==========
export function shrinkPolygon(
  polygon: { lat: number; lng: number }[],
  setbackMeters: number
): { lat: number; lng: number }[] {
  if (polygon.length < 3) return polygon;

  // Convert to local coords, shrink, convert back
  const local = polygonToLocal(polygon);
  const centerLat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const centerLng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;

  // Calculate centroid of local polygon
  const cx = local.reduce((s, p) => s + p.x, 0) / local.length;
  const cz = local.reduce((s, p) => s + p.z, 0) / local.length;

  // Shrink each point toward centroid
  const shrunk = local.map((p) => {
    const dx = p.x - cx;
    const dz = p.z - cz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist === 0) return p;
    const factor = Math.max(0, (dist - setbackMeters) / dist);
    return { x: cx + dx * factor, z: cz + dz * factor };
  });

  // Convert back
  return shrunk.map((p) => ({
    lat: centerLat - p.z / 111320,
    lng: centerLng + p.x / (111320 * Math.cos((centerLat * Math.PI) / 180)),
  }));
}

// ========== Walkway Area Deduction ==========
export function calculateWalkwayArea(
  perimeterLength: number,
  perimeterWidth: number,
  centralLength: number,
  centralWidth: number
): number {
  return perimeterLength * perimeterWidth + centralLength * centralWidth;
}

// ========== Compliance Check ==========
export function checkCompliance(
  projectCategory: string | null,
  hasPerimeterWalkway: boolean,
  perimeterWidth: number,
  hasCentralAccess: boolean,
  centralWidth: number,
  hasStairClearance: boolean
): ComplianceStatus {
  const isCommercial = projectCategory === "commercial" || projectCategory === "industrial";

  if (!isCommercial) {
    return {
      perimeterWalkway: true,
      centralAccess: true,
      stairClearance: true,
      fireSafe: true,
      overallCompliant: true,
    };
  }

  const perimeterOk = hasPerimeterWalkway && perimeterWidth >= 0.6;
  const centralOk = hasCentralAccess && centralWidth >= 1.0;
  const stairOk = hasStairClearance;
  const fireSafe = perimeterOk && centralOk;

  return {
    perimeterWalkway: perimeterOk,
    centralAccess: centralOk,
    stairClearance: stairOk,
    fireSafe,
    overallCompliant: perimeterOk && centralOk && stairOk,
  };
}

// ========== Auto-fill panels on Google Maps ==========
export function autoFitPanelsOnMap(
  roofPath: google.maps.LatLngLiteral[],
  safetyBoundary: google.maps.LatLngLiteral[],
  orient: PanelOrientation,
  panel: PanelOption,
  tiltAngle: number,
  obstacles: ObstacleItem[],
  walkways: WalkwayItem[],
  pipelines: PipelineItem[],
  targetKW?: number
): { north: number; south: number; east: number; west: number }[] {
  const usePath = safetyBoundary.length >= 3 ? safetyBoundary : roofPath;
  if (usePath.length < 3) return [];

  const bounds = new google.maps.LatLngBounds();
  usePath.forEach((p) => bounds.extend(p));

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const centerLat = (ne.lat() + sw.lat()) / 2;
  const centerLng = (ne.lng() + sw.lng()) / 2;

  const panelH = orient === "landscape" ? panel.width : panel.length;
  const panelW = orient === "landscape" ? panel.length : panel.width;
  const rowSpacing = calculateRowSpacing(panelH, tiltAngle);
  const effectiveRowH = panelH + Math.max(rowSpacing, 0.3);
  const effectiveColW = panelW + 0.1;

  const panelLatSize = metersToLatDeg(effectiveRowH);
  const panelLngSize = metersToLngDeg(effectiveColW, centerLat);
  const pureLatSize = metersToLatDeg(panelH);
  const pureLngSize = metersToLngDeg(panelW, centerLat);

  // Required panels for target kW
  const maxPanelsNeeded = targetKW && targetKW > 0
    ? Math.ceil((targetKW * 1000) / panel.watt)
    : Infinity;

  const poly = new google.maps.Polygon({ paths: usePath });

  // Build obstacle exclusion zones (lat/lng rects with 0.5m buffer)
  const obstacleZones = obstacles.map((obs) => {
    const obsLat = centerLat + obs.position[2] / 111320;
    const obsLng = centerLng + obs.position[0] / (111320 * Math.cos((centerLat * Math.PI) / 180));
    const bufferM = 0.5;
    const halfW = (obs.width / 2 + bufferM);
    const halfL = (obs.length / 2 + bufferM);
    return {
      south: obsLat - metersToLatDeg(halfL),
      north: obsLat + metersToLatDeg(halfL),
      west: obsLng - metersToLngDeg(halfW, centerLat),
      east: obsLng + metersToLngDeg(halfW, centerLat),
    };
  });

  // Walkway exclusion zones
  const walkwayZones = walkways.flatMap((w) => {
    if (w.path.length < 2) return [];
    const zones: { south: number; north: number; west: number; east: number }[] = [];
    for (let i = 0; i < w.path.length - 1; i++) {
      const p1 = w.path[i], p2 = w.path[i + 1];
      const halfW = metersToLngDeg(w.width / 2, centerLat);
      const halfH = metersToLatDeg(w.width / 2);
      zones.push({
        south: Math.min(p1.lat, p2.lat) - halfH,
        north: Math.max(p1.lat, p2.lat) + halfH,
        west: Math.min(p1.lng, p2.lng) - halfW,
        east: Math.max(p1.lng, p2.lng) + halfW,
      });
    }
    return zones;
  });

  // Pipeline exclusion zones (with clearance)
  const pipelineZones = pipelines.flatMap((p) => {
    if (p.path.length < 2) return [];
    const zones: { south: number; north: number; west: number; east: number }[] = [];
    const totalW = p.width + p.clearance * 2;
    for (let i = 0; i < p.path.length - 1; i++) {
      const p1 = p.path[i], p2 = p.path[i + 1];
      const halfW = metersToLngDeg(totalW / 2, centerLat);
      const halfH = metersToLatDeg(totalW / 2);
      zones.push({
        south: Math.min(p1.lat, p2.lat) - halfH,
        north: Math.max(p1.lat, p2.lat) + halfH,
        west: Math.min(p1.lng, p2.lng) - halfW,
        east: Math.max(p1.lng, p2.lng) + halfW,
      });
    }
    return zones;
  });

  const allExclusions = [...obstacleZones, ...walkwayZones, ...pipelineZones];

  function isExcluded(lat: number, lng: number): boolean {
    return allExclusions.some(z =>
      lat >= z.south && lat <= z.north && lng >= z.west && lng <= z.east
    );
  }

  // Phase 1: Scan entire grid to find all valid cells
  const allCells: { row: number; col: number; lat: number; lng: number }[] = [];
  let rowIdx = 0;
  for (let lat = sw.lat(); lat < ne.lat(); lat += panelLatSize) {
    let colIdx = 0;
    for (let lng = sw.lng(); lng < ne.lng(); lng += panelLngSize) {
      const cLat = lat + panelLatSize / 2;
      const cLng = lng + panelLngSize / 2;
      const center = new google.maps.LatLng(cLat, cLng);
      if (google.maps.geometry?.poly?.containsLocation(center, poly) && !isExcluded(cLat, cLng)) {
        allCells.push({ row: rowIdx, col: colIdx, lat, lng });
      }
      colIdx++;
    }
    rowIdx++;
  }

  if (allCells.length === 0) return [];

  // Phase 2: Group by row, sort rows
  const rowMap = new Map<number, typeof allCells>();
  allCells.forEach(c => {
    if (!rowMap.has(c.row)) rowMap.set(c.row, []);
    rowMap.get(c.row)!.push(c);
  });

  // Sort rows from south to north, columns left to right
  const sortedRows = Array.from(rowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, cells]) => cells.sort((a, b) => a.col - b.col));

  if (sortedRows.length === 0) return [];

  // Phase 3: Build a PERFECT rectangular block
  // Find the uniform panel count per row (use the minimum across all rows for a clean rectangle)
  const panelsPerRowCounts = sortedRows.map(r => r.length);
  // Use the median row width for best utilization, but cap jagged rows
  const sortedCounts = [...panelsPerRowCounts].sort((a, b) => a - b);
  const medianPerRow = sortedCounts[Math.floor(sortedCounts.length / 2)];
  // Use median as the uniform width — rows shorter than this are excluded
  const uniformPerRow = medianPerRow;

  // Filter rows that can fit the uniform count
  const validRows = sortedRows.filter(r => r.length >= uniformPerRow);

  // Determine how many rows we need for target
  const rowsNeeded = targetKW && targetKW > 0
    ? Math.ceil(maxPanelsNeeded / uniformPerRow)
    : validRows.length;

  // How many panels per row for target (may be less than uniformPerRow in last row)
  const perRowForTarget = targetKW && targetKW > 0
    ? Math.min(uniformPerRow, maxPanelsNeeded)
    : uniformPerRow;

  // Center rows vertically
  const actualRows = Math.min(validRows.length, rowsNeeded);
  const rowStart = Math.max(0, Math.floor((validRows.length - actualRows) / 2));
  const rowEnd = rowStart + actualRows;

  const panels: { north: number; south: number; east: number; west: number }[] = [];
  let placed = 0;

  for (let ri = rowStart; ri < rowEnd && placed < maxPanelsNeeded; ri++) {
    const row = validRows[ri];
    // Number of panels this row
    const panelsInRow = Math.min(perRowForTarget, maxPanelsNeeded - placed);

    // Center horizontally within the row
    const colStart = Math.floor((row.length - panelsInRow) / 2);
    const colEnd = colStart + panelsInRow;

    for (let ci = colStart; ci < colEnd && placed < maxPanelsNeeded; ci++) {
      const cell = row[ci];
      panels.push({
        north: cell.lat + pureLatSize,
        south: cell.lat,
        east: cell.lng + pureLngSize,
        west: cell.lng,
      });
      placed++;
    }
  }

  return panels;
}
