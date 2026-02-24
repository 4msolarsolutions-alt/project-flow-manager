import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import {
  PANEL_OPTIONS, type PanelOption, type PanelOrientation, type RoofType,
  type StructureType, type ClampType, type ObstacleItem, type WalkwayItem,
  type PipelineItem, type DesignStats, type RCCDetails, type MetalRoofDetails,
  type ComplianceStatus,
  polygonAreaM2, optimalTilt, getWindZone, shrinkPolygon,
  calculateDesignStats, calculateRCCLoad, calculateMetalRoof, checkCompliance,
} from "@/utils/solarCalculations";

export type DrawTool = "none" | "roof" | "obstacle" | "walkway" | "pipeline" | "safety_edge" | "drain";

interface SolarLayoutState {
  // Location
  latitude: number;
  longitude: number;
  setLatitude: (v: number) => void;
  setLongitude: (v: number) => void;
  windZone: string;
  fireComplianceRequired: boolean;
  setFireComplianceRequired: (v: boolean) => void;

  // Roof
  roofType: RoofType;
  setRoofType: (v: RoofType) => void;
  structureType: StructureType;
  setStructureType: (v: StructureType) => void;
  deadLoadLimit: number;
  setDeadLoadLimit: (v: number) => void;
  purlinSpacing: number;
  setPurlinSpacing: (v: number) => void;
  clampType: ClampType;
  setClampType: (v: ClampType) => void;

  // Panel
  selectedPanelIdx: number;
  setSelectedPanelIdx: (v: number) => void;
  selectedPanel: PanelOption;
  orientation: PanelOrientation;
  setOrientation: (v: PanelOrientation) => void;
  tiltAngle: number;
  setTiltAngle: (v: number) => void;

  // Roof polygon
  roofPath: google.maps.LatLngLiteral[];
  setRoofPath: (v: google.maps.LatLngLiteral[]) => void;
  safetyBoundary: google.maps.LatLngLiteral[];
  safetySetback: number;
  setSafetySetback: (v: number) => void;

  // Panels
  panels: { north: number; south: number; east: number; west: number }[];
  setPanels: (v: { north: number; south: number; east: number; west: number }[]) => void;

  // Obstacles
  obstacles: ObstacleItem[];
  setObstacles: (v: ObstacleItem[]) => void;
  addObstacle: (o: ObstacleItem) => void;
  removeObstacle: (id: string) => void;

  // Walkways
  walkways: WalkwayItem[];
  setWalkways: (v: WalkwayItem[]) => void;
  perimeterWalkwayWidth: number;
  setPerimeterWalkwayWidth: (v: number) => void;
  centralWalkwayWidth: number;
  setCentralWalkwayWidth: (v: number) => void;
  hasPerimeterWalkway: boolean;
  setHasPerimeterWalkway: (v: boolean) => void;
  hasCentralWalkway: boolean;
  setHasCentralWalkway: (v: boolean) => void;

  // Pipelines
  pipelines: PipelineItem[];
  setPipelines: (v: PipelineItem[]) => void;

  // Drawing
  activeTool: DrawTool;
  setActiveTool: (v: DrawTool) => void;
  drawPoints: google.maps.LatLngLiteral[];
  setDrawPoints: (v: google.maps.LatLngLiteral[]) => void;

  // Tabs
  activeTab: string;
  setActiveTab: (v: string) => void;

  // Calculated
  stats: DesignStats;
  rccDetails: RCCDetails | null;
  metalRoofDetails: MetalRoofDetails | null;
  compliance: ComplianceStatus;
  roofAreaM2: number;
  usableAreaM2: number;

  // Project context
  projectCategory: string | null;
  setProjectCategory: (v: string | null) => void;
}

const SolarLayoutContext = createContext<SolarLayoutState | null>(null);

export function useSolarLayout() {
  const ctx = useContext(SolarLayoutContext);
  if (!ctx) throw new Error("useSolarLayout must be used within SolarLayoutProvider");
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
  initialLatitude?: number;
  initialLongitude?: number;
  projectCategory?: string | null;
}

export function SolarLayoutProvider({ children, initialLatitude = 13.0827, initialLongitude = 80.2707, projectCategory: initCategory = null }: ProviderProps) {
  // Location
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [fireComplianceRequired, setFireComplianceRequired] = useState(false);

  // Roof
  const [roofType, setRoofType] = useState<RoofType>("rcc");
  const [structureType, setStructureType] = useState<StructureType>("anchor");
  const [deadLoadLimit, setDeadLoadLimit] = useState(50);
  const [purlinSpacing, setPurlinSpacing] = useState(1200);
  const [clampType, setClampType] = useState<ClampType>("mid_clamp");

  // Panel
  const [selectedPanelIdx, setSelectedPanelIdx] = useState(0);
  const [orientation, setOrientation] = useState<PanelOrientation>("landscape");
  const [tiltAngle, setTiltAngle] = useState(15);

  // Roof polygon
  const [roofPath, setRoofPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [safetySetback, setSafetySetback] = useState(0.6);

  // Panels
  const [panels, setPanels] = useState<{ north: number; south: number; east: number; west: number }[]>([]);

  // Obstacles
  const [obstacles, setObstacles] = useState<ObstacleItem[]>([]);

  // Walkways
  const [walkways, setWalkways] = useState<WalkwayItem[]>([]);
  const [perimeterWalkwayWidth, setPerimeterWalkwayWidth] = useState(0.6);
  const [centralWalkwayWidth, setCentralWalkwayWidth] = useState(1.0);
  const [hasPerimeterWalkway, setHasPerimeterWalkway] = useState(false);
  const [hasCentralWalkway, setHasCentralWalkway] = useState(false);

  // Pipelines
  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);

  // Drawing
  const [activeTool, setActiveTool] = useState<DrawTool>("none");
  const [drawPoints, setDrawPoints] = useState<google.maps.LatLngLiteral[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState("2d");

  // Project
  const [projectCategory, setProjectCategory] = useState<string | null>(initCategory);

  const selectedPanel = PANEL_OPTIONS[selectedPanelIdx];
  const windZone = useMemo(() => getWindZone(latitude, longitude), [latitude, longitude]);

  // Safety boundary
  const safetyBoundary = useMemo(() => {
    if (roofPath.length < 3 || safetySetback <= 0) return [];
    return shrinkPolygon(roofPath, safetySetback);
  }, [roofPath, safetySetback]);

  // Areas
  const roofAreaM2 = useMemo(() => polygonAreaM2(roofPath), [roofPath]);
  const usableAreaM2 = useMemo(() => {
    let area = safetyBoundary.length >= 3 ? polygonAreaM2(safetyBoundary) : roofAreaM2;
    // Deduct walkway areas (approximate)
    if (hasPerimeterWalkway && roofPath.length >= 3) {
      const perimeterLength = roofPath.reduce((sum, p, i) => {
        const next = roofPath[(i + 1) % roofPath.length];
        const dx = (next.lng - p.lng) * 111320 * Math.cos((p.lat * Math.PI) / 180);
        const dz = (next.lat - p.lat) * 111320;
        return sum + Math.sqrt(dx * dx + dz * dz);
      }, 0);
      area -= perimeterLength * perimeterWalkwayWidth;
    }
    if (hasCentralWalkway) {
      const side = Math.sqrt(area);
      area -= side * centralWalkwayWidth;
    }
    // Deduct obstacle areas
    obstacles.forEach((o) => {
      area -= o.length * o.width;
    });
    return Math.max(0, area);
  }, [safetyBoundary, roofAreaM2, hasPerimeterWalkway, hasCentralWalkway, perimeterWalkwayWidth, centralWalkwayWidth, obstacles, roofPath]);

  // Design stats
  const panelCount = panels.length;
  const stats = useMemo(
    () => calculateDesignStats(panelCount, selectedPanel, orientation, tiltAngle, roofAreaM2, usableAreaM2, latitude),
    [panelCount, selectedPanel, orientation, tiltAngle, roofAreaM2, usableAreaM2, latitude]
  );

  // RCC
  const rccDetails = useMemo(() => {
    if (roofType !== "rcc") return null;
    return calculateRCCLoad(panelCount, selectedPanel.weight, structureType, roofAreaM2, deadLoadLimit);
  }, [roofType, panelCount, selectedPanel.weight, structureType, roofAreaM2, deadLoadLimit]);

  // Metal roof
  const metalRoofDetails = useMemo(() => {
    if (roofType !== "metal_sheet") return null;
    return calculateMetalRoof(panelCount, orientation, selectedPanel.length, purlinSpacing, clampType);
  }, [roofType, panelCount, orientation, selectedPanel.length, purlinSpacing, clampType]);

  // Compliance
  const compliance = useMemo(
    () => checkCompliance(projectCategory, hasPerimeterWalkway, perimeterWalkwayWidth, hasCentralWalkway, centralWalkwayWidth, true),
    [projectCategory, hasPerimeterWalkway, perimeterWalkwayWidth, hasCentralWalkway, centralWalkwayWidth]
  );

  const addObstacle = useCallback((o: ObstacleItem) => setObstacles((prev) => [...prev, o]), []);
  const removeObstacle = useCallback((id: string) => setObstacles((prev) => prev.filter((o) => o.id !== id)), []);

  // Auto-set tilt from latitude
  useEffect(() => {
    setTiltAngle(optimalTilt(latitude));
  }, [latitude]);

  const value: SolarLayoutState = {
    latitude, longitude, setLatitude, setLongitude, windZone, fireComplianceRequired, setFireComplianceRequired,
    roofType, setRoofType, structureType, setStructureType, deadLoadLimit, setDeadLoadLimit,
    purlinSpacing, setPurlinSpacing, clampType, setClampType,
    selectedPanelIdx, setSelectedPanelIdx, selectedPanel, orientation, setOrientation, tiltAngle, setTiltAngle,
    roofPath, setRoofPath, safetyBoundary, safetySetback, setSafetySetback,
    panels, setPanels,
    obstacles, setObstacles, addObstacle, removeObstacle,
    walkways, setWalkways, perimeterWalkwayWidth, setPerimeterWalkwayWidth,
    centralWalkwayWidth, setCentralWalkwayWidth, hasPerimeterWalkway, setHasPerimeterWalkway,
    hasCentralWalkway, setHasCentralWalkway,
    pipelines, setPipelines,
    activeTool, setActiveTool, drawPoints, setDrawPoints,
    activeTab, setActiveTab,
    stats, rccDetails, metalRoofDetails, compliance, roofAreaM2, usableAreaM2,
    projectCategory, setProjectCategory,
  };

  return <SolarLayoutContext.Provider value={value}>{children}</SolarLayoutContext.Provider>;
}
