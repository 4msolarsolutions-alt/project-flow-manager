import { useState, useMemo, useCallback, useRef, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls, Grid, Environment, Sky } from "@react-three/drei";
import { Building3D } from "./Building3D";
import { Roof3D } from "./Roof3D";
import { Panel3D } from "./Panel3D";
import { Blocker3D, BlockerType } from "./Blocker3D";
import { SunPath3D } from "./SunPath3D";
import { StringZone3D, autoGenerateStrings } from "./StringZone3D";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sun, Zap, Battery, BarChart3, Eye,
  Clock, Box, Cable, Maximize, Minimize, RotateCw,
} from "lucide-react";

export interface PolygonPoint { lat: number; lng: number; }

interface SolarDesign3DProps {
  roofPolygon: PolygonPoint[];
  panelCount: number;
  capacityKW: number;
  dailyEnergy: number;
  annualEnergy: number;
  inverterSuggestion: string;
  tiltAngle: number;
  orientation: "landscape" | "portrait";
  panelWatt: number;
  panelLength: number;
  panelWidth: number;
  latitude?: number;
  buildingHeight?: number;
}

interface BlockerItem {
  id: string;
  type: BlockerType;
  position: [number, number, number];
  size: [number, number, number];
}

function polygonToLocal(polygon: PolygonPoint[]): { x: number; z: number }[] {
  if (polygon.length === 0) return [];
  const centerLat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const centerLng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
  return polygon.map((p) => ({
    x: (p.lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180),
    z: -(p.lat - centerLat) * 111320,
  }));
}

function fitPanelsInPolygon(
  polygon: { x: number; z: number }[],
  panelW: number,
  panelH: number,
  tiltAngle: number,
  gap: number = 0.15,
  blockers: BlockerItem[] = []
): [number, number, number][] {
  if (polygon.length < 3) return [];

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  polygon.forEach((p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  });

  const tiltRad = (tiltAngle * Math.PI) / 180;
  const shadowGap = panelH * Math.tan(tiltRad);
  const rowSpacing = panelH + Math.max(shadowGap, 0.3);
  const stepX = panelW + gap;
  const margin = 0.3;

  // Phase 1: Scan all valid positions grouped by row
  const rows: [number, number, number][][] = [];
  for (let z = minZ + panelH / 2 + margin; z < maxZ - panelH / 2 - margin; z += rowSpacing) {
    const rowPanels: [number, number, number][] = [];
    for (let x = minX + panelW / 2 + margin; x < maxX - panelW / 2 - margin; x += stepX) {
      if (isPointInPolygon(x, z, polygon) && !isBlockedByObstacle(x, z, panelW, panelH, blockers)) {
        rowPanels.push([x, 0.15, z]);
      }
    }
    if (rowPanels.length > 0) rows.push(rowPanels);
  }

  if (rows.length === 0) return fitPanelsSimple(polygon, panelW, panelH, stepX, rowSpacing, blockers);

  // Phase 2: Build uniform rectangular block
  // Use median row count for uniform width
  const counts = rows.map(r => r.length).sort((a, b) => a - b);
  const uniformPerRow = counts[Math.floor(counts.length / 2)];

  // Filter rows that can hold uniform count
  const validRows = rows.filter(r => r.length >= uniformPerRow);
  if (validRows.length === 0) return fitPanelsSimple(polygon, panelW, panelH, stepX, rowSpacing, blockers);

  // Center rows vertically on the roof
  const totalRowSpan = (validRows.length - 1) * rowSpacing;
  const midZ = (minZ + maxZ) / 2;
  const startZ = midZ - totalRowSpan / 2;

  const positions: [number, number, number][] = [];
  // Find the horizontal center from the widest valid row
  const refRow = validRows.reduce((best, r) => r.length > best.length ? r : best, validRows[0]);
  const refMinX = Math.min(...refRow.map(p => p[0]));
  const refMaxX = Math.max(...refRow.map(p => p[0]));
  const blockCenterX = (refMinX + refMaxX) / 2;
  const blockHalfW = ((uniformPerRow - 1) * stepX) / 2;

  validRows.forEach((row, ri) => {
    const newZ = startZ + ri * rowSpacing;
    for (let ci = 0; ci < uniformPerRow; ci++) {
      const x = blockCenterX - blockHalfW + ci * stepX;
      if (isPointInPolygon(x, newZ, polygon)) {
        positions.push([x, 0.15, newZ]);
      }
    }
  });

  return positions.length > 0 ? positions : fitPanelsSimple(polygon, panelW, panelH, stepX, rowSpacing, blockers);
}

function fitPanelsSimple(
  polygon: { x: number; z: number }[],
  panelW: number, panelH: number,
  stepX: number, stepZ: number,
  blockers: BlockerItem[]
): [number, number, number][] {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  polygon.forEach((p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  });
  const positions: [number, number, number][] = [];
  for (let x = minX + panelW / 2; x < maxX - panelW / 2; x += stepX) {
    for (let z = minZ + panelH / 2; z < maxZ - panelH / 2; z += stepZ) {
      if (isPointInPolygon(x, z, polygon) && !isBlockedByObstacle(x, z, panelW, panelH, blockers)) {
        positions.push([x, 0.15, z]);
      }
    }
  }
  return positions;
}

function isPointInPolygon(x: number, z: number, polygon: { x: number; z: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, zi = polygon[i].z;
    const xj = polygon[j].x, zj = polygon[j].z;
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isBlockedByObstacle(x: number, z: number, panelW: number, panelH: number, blockers: BlockerItem[]): boolean {
  const margin = 0.5;
  for (const b of blockers) {
    const bx = b.position[0], bz = b.position[2];
    const bw = b.size[0] / 2 + margin, bd = b.size[2] / 2 + margin;
    if (x + panelW / 2 > bx - bw && x - panelW / 2 < bx + bw && z + panelH / 2 > bz - bd && z - panelH / 2 < bz + bd) return true;
  }
  return false;
}

export default function SolarDesign3D({
  roofPolygon,
  panelCount,
  capacityKW,
  dailyEnergy,
  annualEnergy,
  inverterSuggestion,
  tiltAngle,
  orientation,
  panelWatt,
  panelLength,
  panelWidth,
  latitude = 13.08,
  buildingHeight = 6,
}: SolarDesign3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sunHour, setSunHour] = useState(12);
  const [dayOfYear, setDayOfYear] = useState(172);
  const [showShadows, setShowShadows] = useState(true);
  const [showSunPath, setShowSunPath] = useState(true);
  const [showStrings, setShowStrings] = useState(false);
  const [showBuilding, setShowBuilding] = useState(true);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);

  const localPolygon = useMemo(() => polygonToLocal(roofPolygon), [roofPolygon]);

  const panelW = orientation === "landscape" ? panelLength : panelWidth;
  const panelH = orientation === "landscape" ? panelWidth : panelLength;

  // Fit panels in 3D but limit to the exact count from 2D view
  const allPanelPositions = useMemo(
    () => fitPanelsInPolygon(localPolygon, panelW, panelH, tiltAngle, 0.15, blockers),
    [localPolygon, panelW, panelH, tiltAngle, blockers]
  );

  // Use the panelCount from props (2D view) to keep both views in sync
  const panelPositions = useMemo(
    () => allPanelPositions.slice(0, panelCount),
    [allPanelPositions, panelCount]
  );

  const panelsPerString = Math.min(12, Math.max(8, Math.floor(600 / (panelWatt * 0.04))));
  const stringCount = Math.ceil(panelCount / panelsPerString);

  const strings = useMemo(
    () => autoGenerateStrings(panelCount, panelWatt, panelsPerString),
    [panelCount, panelWatt, panelsPerString]
  );

  const inverterMatch = useMemo(() => {
    if (capacityKW <= 3) return { model: "3kW Single-phase", count: 1, mppt: 1 };
    if (capacityKW <= 5) return { model: "5kW Single-phase", count: 1, mppt: 2 };
    if (capacityKW <= 8) return { model: "8kW Three-phase", count: 1, mppt: 2 };
    if (capacityKW <= 10) return { model: "10kW Three-phase", count: 1, mppt: 2 };
    if (capacityKW <= 15) return { model: "15kW Three-phase", count: 1, mppt: 3 };
    if (capacityKW <= 20) return { model: "20kW Three-phase", count: 1, mppt: 4 };
    if (capacityKW <= 30) return { model: "30kW Three-phase", count: 1, mppt: 4 };
    if (capacityKW <= 50) return { model: "25kW Three-phase", count: 2, mppt: 4 };
    return { model: "50kW Three-phase", count: Math.ceil(capacityKW / 50), mppt: 6 };
  }, [capacityKW]);

  const sceneRadius = useMemo(() => {
    if (localPolygon.length === 0) return 20;
    let maxDist = 0;
    localPolygon.forEach((p) => {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z);
      if (dist > maxDist) maxDist = dist;
    });
    return Math.max(maxDist * 2, 20);
  }, [localPolygon]);

  const addBlocker = useCallback((type: BlockerType) => {
    const sizes: Record<BlockerType, [number, number, number]> = {
      water_tank: [1.5, 1.2, 1.5],
      lift_room: [3, 3, 3],
      chimney: [0.5, 2, 0.5],
      vent: [0.6, 0.4, 0.6],
      custom: [2, 1.5, 2],
    };
    setBlockers((prev) => [
      ...prev,
      { id: `blocker-${Date.now()}`, type, position: [0, sizes[type][1] / 2, 0], size: sizes[type] },
    ]);
  }, []);

  const removeBlocker = useCallback((id: string) => setBlockers((prev) => prev.filter((b) => b.id !== id)), []);
  const updateBlockerPosition = useCallback((id: string, newPosition: [number, number, number]) => {
    setBlockers((prev) => prev.map((b) => (b.id === id ? { ...b, position: newPosition } : b)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Month label from day of year
  const monthLabel = useMemo(() => {
    const d = new Date(2024, 0, dayOfYear);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }, [dayOfYear]);

  if (roofPolygon.length < 3) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Draw a roof polygon in the 2D Satellite view first, then switch to 3D Design.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* 3D Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sun Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Sun Time: {Math.floor(sunHour)}:{String(Math.round((sunHour % 1) * 60)).padStart(2, '0')}
            </Label>
            <Slider value={[sunHour]} onValueChange={(v) => setSunHour(v[0])} min={5} max={19} step={0.25} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 AM</span><span>12 PM</span><span>7 PM</span>
            </div>
          </div>

          {/* Day of Year */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sun className="h-4 w-4" /> Date: {monthLabel}
            </Label>
            <Slider value={[dayOfYear]} onValueChange={(v) => setDayOfYear(v[0])} min={1} max={365} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </div>

          {/* Obstacles */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Box className="h-4 w-4" /> Roof Obstacles
            </Label>
            <Select onValueChange={(v) => addBlocker(v as BlockerType)}>
              <SelectTrigger><SelectValue placeholder="Add obstacle..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="water_tank">Water Tank</SelectItem>
                <SelectItem value="lift_room">Lift Room</SelectItem>
                <SelectItem value="chimney">Chimney</SelectItem>
                <SelectItem value="vent">Vent/Pipe</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {blockers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {blockers.map((b) => (
                  <Badge key={b.id} variant="secondary" className="cursor-pointer text-xs" onClick={() => removeBlocker(b.id)}>
                    {b.type} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visibility</Label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch checked={showShadows} onCheckedChange={setShowShadows} id="shadows3d" />
                <Label htmlFor="shadows3d" className="text-xs">Shadows</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showSunPath} onCheckedChange={setShowSunPath} id="sunpath3d" />
                <Label htmlFor="sunpath3d" className="text-xs">Sun Path</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showBuilding} onCheckedChange={setShowBuilding} id="building3d" />
                <Label htmlFor="building3d" className="text-xs">Building Walls</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showStrings} onCheckedChange={setShowStrings} id="strings3d" />
                <Label htmlFor="strings3d" className="text-xs flex items-center gap-1"><Cable className="h-3 w-3" /> Strings</Label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3D Canvas */}
      <Card className="overflow-hidden relative">
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => controlsRef.current?.reset()}
          >
            <RotateCw className="h-3.5 w-3.5 mr-1" /> Reset Camera
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        <div style={{ width: "100%", height: isFullscreen ? "100vh" : "600px" }}>
          <Canvas
            shadows={showShadows}
            camera={{ position: [sceneRadius * 0.7, sceneRadius * 0.5 + buildingHeight, sceneRadius * 0.7], fov: 50 }}
            gl={{
              antialias: true,
              toneMapping: 3,
              preserveDrawingBuffer: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            dpr={[1, 2]}
          >
            {/* Sky */}
            <Sky
              distance={450000}
              sunPosition={[
                sceneRadius * Math.cos(((sunHour - 12) * 15 * Math.PI) / 180),
                sceneRadius * Math.sin(Math.max(0.1, (sunHour - 6) / 12 * Math.PI / 2)),
                -sceneRadius * 0.5,
              ]}
              inclination={0.5}
              azimuth={0.25}
              rayleigh={0.5}
            />

            <ambientLight intensity={0.25} color="#B3E5FC" />

            {showSunPath && (
              <SunPath3D
                hour={sunHour}
                latitude={latitude}
                dayOfYear={dayOfYear}
                sceneRadius={sceneRadius}
                castShadows={showShadows}
              />
            )}

            {!showSunPath && (
              <>
                <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow={showShadows} />
                <hemisphereLight args={["#87CEEB", "#4a7c59", 0.3]} />
              </>
            )}

            {/* Ground plane with realistic texture */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -buildingHeight - 0.01, 0]} receiveShadow>
              <planeGeometry args={[sceneRadius * 4, sceneRadius * 4]} />
              <meshStandardMaterial color="#6b8c5a" roughness={0.95} metalness={0} />
            </mesh>

            {/* Surrounding area / context */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -buildingHeight, 0]} receiveShadow>
              <planeGeometry args={[sceneRadius * 8, sceneRadius * 8]} />
              <meshStandardMaterial color="#7a9568" roughness={1} metalness={0} />
            </mesh>

            {/* Grid on roof level */}
            <Grid
              position={[0, 0.02, 0]}
              args={[sceneRadius * 2, sceneRadius * 2]}
              cellSize={1}
              cellThickness={0.3}
              cellColor="#666"
              sectionSize={5}
              sectionThickness={0.8}
              sectionColor="#999"
              fadeDistance={sceneRadius * 1.5}
              fadeStrength={1}
              followCamera={false}
            />

            {/* Building with walls and parapet */}
            {showBuilding && (
              <Building3D
                polygon={localPolygon}
                buildingHeight={buildingHeight}
                parapetHeight={0.9}
                roofThickness={0.15}
              />
            )}

            {/* Roof slab fallback when building walls hidden */}
            {!showBuilding && <Roof3D polygon={localPolygon} height={0.15} />}

            {/* Panels */}
            {panelPositions.map((pos, i) => (
              <Panel3D
                key={i}
                position={pos}
                width={panelLength}
                height={panelWidth}
                tiltAngle={tiltAngle}
                orientation={orientation}
                selected={showStrings ? !!strings.find((s) => s.panelIndices.includes(i)) : false}
              />
            ))}

            {/* Blockers */}
            {blockers.map((b) => (
              <Blocker3D
                key={b.id}
                position={b.position}
                size={b.size}
                type={b.type}
                onRemove={() => removeBlocker(b.id)}
                onPositionChange={(pos) => updateBlockerPosition(b.id, pos)}
              />
            ))}

            {/* String Zones */}
            {showStrings && strings.map((zone) => (
              <StringZone3D key={zone.id} zone={zone} panelPositions={panelPositions} visible={showStrings} />
            ))}

            <OrbitControls
              ref={controlsRef as any}
              enablePan
              enableZoom
              enableRotate
              zoomSpeed={1.2}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={10}
              maxDistance={1000}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 flex flex-col items-center gap-1">
          <Sun className="h-5 w-5 text-amber-500" />
          <span className="text-xl font-bold">{panelCount}</span>
          <span className="text-xs text-muted-foreground text-center">Panels ({panelWatt}W)</span>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold">{capacityKW.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">Capacity (kWp)</span>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Battery className="h-5 w-5 text-green-500" />
          <span className="text-xl font-bold text-sm">{inverterMatch.count}× {inverterMatch.model}</span>
          <span className="text-xs text-muted-foreground">{inverterMatch.mppt} MPPT</span>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Cable className="h-5 w-5 text-orange-500" />
          <span className="text-xl font-bold">{stringCount}</span>
          <span className="text-xs text-muted-foreground">Strings ({panelsPerString}/str)</span>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <span className="text-xl font-bold">{dailyEnergy.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">Daily kWh</span>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          <span className="text-xl font-bold">{(annualEnergy / 1000).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">Annual MWh</span>
        </Card>
      </div>
    </div>
  );
}
