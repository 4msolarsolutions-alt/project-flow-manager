import { useState, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Html, Environment, ContactShadows } from "@react-three/drei";
import { Roof3D } from "./Roof3D";
import { Panel3D } from "./Panel3D";
import { Blocker3D, BlockerType } from "./Blocker3D";
import { SunPath3D } from "./SunPath3D";
import { StringZone3D, StringZone, autoGenerateStrings, getZoneColor } from "./StringZone3D";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sun, Zap, Battery, BarChart3, Layers, Eye, EyeOff,
  Clock, Box, Trash2, Plus, Cable,
} from "lucide-react";

export interface PolygonPoint {
  lat: number;
  lng: number;
}

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
}

interface BlockerItem {
  id: string;
  type: BlockerType;
  position: [number, number, number];
  size: [number, number, number];
}

// Convert lat/lng polygon to local XZ coordinates (meters from centroid)
function polygonToLocal(polygon: PolygonPoint[]): { x: number; z: number }[] {
  if (polygon.length === 0) return [];
  const centerLat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const centerLng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;

  return polygon.map((p) => ({
    x: (p.lng - centerLng) * 111320 * Math.cos((centerLat * Math.PI) / 180),
    z: -(p.lat - centerLat) * 111320,
  }));
}

// Auto-fit panels inside polygon in local coords
function fitPanelsInPolygon(
  polygon: { x: number; z: number }[],
  panelW: number,
  panelH: number,
  gap: number = 0.15,
  blockers: BlockerItem[] = []
): [number, number, number][] {
  if (polygon.length < 3) return [];

  // Find bounding box
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  polygon.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  });

  const positions: [number, number, number][] = [];
  const stepX = panelW + gap;
  const stepZ = panelH + gap;

  for (let x = minX + panelW / 2; x < maxX - panelW / 2; x += stepX) {
    for (let z = minZ + panelH / 2; z < maxZ - panelH / 2; z += stepZ) {
      if (isPointInPolygon(x, z, polygon) && !isBlockedByObstacle(x, z, panelW, panelH, blockers)) {
        positions.push([x, 0.12, z]);
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

function isBlockedByObstacle(
  x: number,
  z: number,
  panelW: number,
  panelH: number,
  blockers: BlockerItem[]
): boolean {
  const margin = 0.3;
  for (const b of blockers) {
    const bx = b.position[0], bz = b.position[2];
    const bw = b.size[0] / 2 + margin, bd = b.size[2] / 2 + margin;
    if (
      x + panelW / 2 > bx - bw &&
      x - panelW / 2 < bx + bw &&
      z + panelH / 2 > bz - bd &&
      z - panelH / 2 < bz + bd
    ) {
      return true;
    }
  }
  return false;
}

export default function SolarDesign3D({
  roofPolygon,
  panelCount: _propPanelCount,
  capacityKW: _propCapacity,
  dailyEnergy: _propDaily,
  annualEnergy: _propAnnual,
  inverterSuggestion: _propInverter,
  tiltAngle,
  orientation,
  panelWatt,
  panelLength,
  panelWidth,
  latitude = 13.08,
}: SolarDesign3DProps) {
  const [sunHour, setSunHour] = useState(12);
  const [dayOfYear, setDayOfYear] = useState(172); // Summer solstice
  const [showShadows, setShowShadows] = useState(true);
  const [showSunPath, setShowSunPath] = useState(true);
  const [showStrings, setShowStrings] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [addingBlocker, setAddingBlocker] = useState<BlockerType | null>(null);

  const localPolygon = useMemo(() => polygonToLocal(roofPolygon), [roofPolygon]);

  const panelW = orientation === "landscape" ? panelLength : panelWidth;
  const panelH = orientation === "landscape" ? panelWidth : panelLength;

  const panelPositions = useMemo(
    () => fitPanelsInPolygon(localPolygon, panelW, panelH, 0.15, blockers),
    [localPolygon, panelW, panelH, blockers]
  );

  const panelCount = panelPositions.length;
  const capacityKW = (panelCount * panelWatt) / 1000;
  const tiltFactor = Math.cos(((tiltAngle - 15) * Math.PI) / 180);
  const dailyEnergy = capacityKW * 5.5 * 0.75 * Math.max(tiltFactor, 0.7);
  const annualEnergy = dailyEnergy * 365;

  // String sizing
  const panelsPerString = Math.min(12, Math.max(8, Math.floor(600 / (panelWatt * 0.04))));
  const stringCount = Math.ceil(panelCount / panelsPerString);
  const mpptCount = Math.ceil(stringCount / 2);

  const strings = useMemo(
    () => autoGenerateStrings(panelCount, panelWatt, panelsPerString),
    [panelCount, panelWatt, panelsPerString]
  );

  // Inverter matching
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
    const id = `blocker-${Date.now()}`;
    const sizes: Record<BlockerType, [number, number, number]> = {
      water_tank: [1.5, 1.2, 1.5],
      lift_room: [3, 3, 3],
      chimney: [0.5, 2, 0.5],
      vent: [0.6, 0.4, 0.6],
      custom: [2, 1.5, 2],
    };
    setBlockers((prev) => [
      ...prev,
      { id, type, position: [0, sizes[type][1] / 2, 0], size: sizes[type] },
    ]);
    setAddingBlocker(null);
  }, []);

  const removeBlocker = useCallback((id: string) => {
    setBlockers((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBlockerPosition = useCallback((id: string, newPosition: [number, number, number]) => {
    setBlockers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, position: newPosition } : b))
    );
  }, []);

  if (roofPolygon.length < 3) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Draw a roof polygon in the 2D Satellite view first, then switch to 3D Design.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 3D Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sun Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Sun Time: {sunHour}:00
            </Label>
            <Slider
              value={[sunHour]}
              onValueChange={(v) => setSunHour(v[0])}
              min={6}
              max={18}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6 AM</span><span>12 PM</span><span>6 PM</span>
            </div>
          </div>

          {/* Day of Year */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sun className="h-4 w-4" /> Day of Year: {dayOfYear}
            </Label>
            <Slider
              value={[dayOfYear]}
              onValueChange={(v) => setDayOfYear(v[0])}
              min={1}
              max={365}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </div>

          {/* Blockers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Box className="h-4 w-4" /> Obstacles
            </Label>
            <Select value={addingBlocker || ""} onValueChange={(v) => addBlocker(v as BlockerType)}>
              <SelectTrigger>
                <SelectValue placeholder="Add obstacle..." />
              </SelectTrigger>
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
                <Switch checked={showShadows} onCheckedChange={setShowShadows} id="shadows" />
                <Label htmlFor="shadows" className="text-xs">Shadows</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showSunPath} onCheckedChange={setShowSunPath} id="sunpath" />
                <Label htmlFor="sunpath" className="text-xs">Sun Path</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showStrings} onCheckedChange={setShowStrings} id="strings" />
                <Label htmlFor="strings" className="text-xs flex items-center gap-1"><Cable className="h-3 w-3" /> Strings</Label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3D Canvas */}
      <Card className="overflow-hidden">
        <div style={{ width: "100%", height: "500px" }}>
          <Canvas
            shadows={showShadows}
            camera={{ position: [sceneRadius * 0.8, sceneRadius * 0.6, sceneRadius * 0.8], fov: 50 }}
            gl={{ antialias: true, toneMapping: 3, preserveDrawingBuffer: true }}
          >
            <color attach="background" args={["#87CEEB"]} />
            <ambientLight intensity={0.4} />
            
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
              <directionalLight
                position={[10, 15, 10]}
                intensity={1.2}
                castShadow={showShadows}
              />
            )}

            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[sceneRadius * 3, sceneRadius * 3]} />
              <meshStandardMaterial color="#4a7c59" roughness={0.9} />
            </mesh>

            {showGrid && (
              <Grid
                position={[0, 0.01, 0]}
                args={[sceneRadius * 2, sceneRadius * 2]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#555"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#888"
                fadeDistance={sceneRadius * 2}
                fadeStrength={1}
                followCamera={false}
              />
            )}

            {/* Roof */}
            <Roof3D polygon={localPolygon} height={0.1} />

            {/* Panels */}
            {panelPositions.map((pos, i) => {
              const stringZone = showStrings ? strings.find((s) => s.panelIndices.includes(i)) : null;
              return (
                <Panel3D
                  key={i}
                  position={pos}
                  width={panelLength}
                  height={panelWidth}
                  tiltAngle={tiltAngle}
                  orientation={orientation}
                  selected={!!stringZone}
                />
              );
            })}

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
            {showStrings &&
              strings.map((zone) => (
                <StringZone3D
                  key={zone.id}
                  zone={zone}
                  panelPositions={panelPositions}
                  visible={showStrings}
                />
              ))}

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              maxPolarAngle={Math.PI / 2.05}
              minDistance={3}
              maxDistance={sceneRadius * 3}
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
