import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, Rectangle } from "@react-google-maps/api";
import { Loader2, Save, Trash2, Sun, Zap, Battery, BarChart3, ArrowLeft, RotateCw, Ruler } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyB6enoBp3iI2JYmI0pcu3QQfAh5CYKe3ro";
const PANEL_WATT = 550;
const LIBRARIES: ("drawing" | "geometry")[] = ["drawing", "geometry"];

// Panel physical dimensions in meters
const PANEL_LENGTH_M = 2.278; // ~2.3m
const PANEL_WIDTH_M = 1.134;  // ~1.1m

const mapContainerStyle = { width: "100%", height: "500px", borderRadius: "12px" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

type PanelOrientation = "landscape" | "portrait";

interface SolarLayoutData {
  roofPolygon: { lat: number; lng: number }[];
  panels: { north: number; south: number; east: number; west: number }[];
  panelCount: number;
  capacityKW: number;
  orientation?: PanelOrientation;
  tiltAngle?: number;
}

function getInverterSuggestion(capacityKW: number): string {
  if (capacityKW <= 5) return "5kW Inverter";
  if (capacityKW <= 10) return "10kW Inverter";
  return `Multiple 10kW Inverters (${Math.ceil(capacityKW / 10)}x)`;
}

// Convert meters to approximate lat/lng degrees (rough, near equator ~111,320 m/deg)
function metersToLatDeg(m: number) { return m / 111320; }
function metersToLngDeg(m: number, lat: number) { return m / (111320 * Math.cos((lat * Math.PI) / 180)); }

export default function SolarLayout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const { data: project, isLoading: projectLoading } = useProject(projectId || undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [roofPath, setRoofPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [panels, setPanels] = useState<{ north: number; south: number; east: number; west: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [orientation, setOrientation] = useState<PanelOrientation>("landscape");
  const [tiltAngle, setTiltAngle] = useState(15);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const panelCount = panels.length;
  const capacityKW = (panelCount * PANEL_WATT) / 1000;
  // Tilt affects effective irradiance — simple cos adjustment
  const tiltFactor = Math.cos(((tiltAngle - 15) * Math.PI) / 180); // optimal ~15° for south India
  const dailyEnergy = capacityKW * 5.5 * 0.75 * Math.max(tiltFactor, 0.7);
  const annualEnergy = dailyEnergy * 365;
  const inverterSuggestion = getInverterSuggestion(capacityKW);

  // Load saved layout
  useEffect(() => {
    if (project?.solar_layout) {
      const layout = project.solar_layout as unknown as SolarLayoutData;
      if (layout.roofPolygon) setRoofPath(layout.roofPolygon);
      if (layout.panels) setPanels(layout.panels);
      if (layout.orientation) setOrientation(layout.orientation);
      if (layout.tiltAngle !== undefined) setTiltAngle(layout.tiltAngle);
    }
  }, [project]);

  const autoFitPanels = useCallback((path: google.maps.LatLngLiteral[], orient: PanelOrientation) => {
    if (path.length < 3) return;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const centerLat = (ne.lat() + sw.lat()) / 2;

    // Panel dimensions based on orientation
    const panelH = orient === "landscape" ? PANEL_WIDTH_M : PANEL_LENGTH_M;
    const panelW = orient === "landscape" ? PANEL_LENGTH_M : PANEL_WIDTH_M;

    const panelLatSize = metersToLatDeg(panelH + 0.1); // 10cm gap
    const panelLngSize = metersToLngDeg(panelW + 0.1, centerLat);

    const newPanels: { north: number; south: number; east: number; west: number }[] = [];
    const poly = new google.maps.Polygon({ paths: path });

    for (let lat = sw.lat(); lat < ne.lat(); lat += panelLatSize) {
      for (let lng = sw.lng(); lng < ne.lng(); lng += panelLngSize) {
        const center = new google.maps.LatLng(lat + panelLatSize / 2, lng + panelLngSize / 2);
        if (google.maps.geometry?.poly?.containsLocation(center, poly)) {
          newPanels.push({
            north: lat + panelLatSize,
            south: lat,
            east: lng + panelLngSize,
            west: lng,
          });
        }
      }
    }

    setPanels(newPanels);
  }, []);

  // Re-fit panels when orientation changes and we have a roof
  useEffect(() => {
    if (roofPath.length >= 3) {
      autoFitPanels(roofPath, orientation);
    }
  }, [orientation, autoFitPanels, roofPath]);

  const onPolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      polygonRef.current = polygon;

      const path = polygon
        .getPath()
        .getArray()
        .map((p) => ({ lat: p.lat(), lng: p.lng() }));
      setRoofPath(path);
      autoFitPanels(path, orientation);
      polygon.setVisible(false);
    },
    [autoFitPanels, orientation]
  );

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const layoutData: SolarLayoutData = {
        roofPolygon: roofPath,
        panels,
        panelCount,
        capacityKW,
        orientation,
        tiltAngle,
      };
      const { error } = await supabase
        .from("projects")
        .update({ solar_layout: layoutData as any })
        .eq("id", projectId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      toast({ title: "Layout Saved", description: "Solar layout has been saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setRoofPath([]);
    setPanels([]);
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (mapRef.current && roofPath.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      roofPath.forEach((p) => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
    }
  }, [roofPath]);

  if (projectLoading) {
    return (
      <AppLayout title="Solar Layout">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Solar Layout">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Solar Layout — ${project.project_name}`}>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Projects
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || panels.length === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Layout
          </Button>
        </div>
      </div>

      {/* Panel Settings */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col gap-2 min-w-[180px]">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <RotateCw className="h-4 w-4" /> Panel Orientation
            </Label>
            <Select value={orientation} onValueChange={(v) => setOrientation(v as PanelOrientation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape (horizontal)</SelectItem>
                <SelectItem value="portrait">Portrait (vertical)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {orientation === "landscape"
                ? `${PANEL_LENGTH_M}m × ${PANEL_WIDTH_M}m`
                : `${PANEL_WIDTH_M}m × ${PANEL_LENGTH_M}m`}
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Ruler className="h-4 w-4" /> Tilt Angle: {tiltAngle}°
            </Label>
            <Slider
              value={[tiltAngle]}
              onValueChange={(v) => setTiltAngle(v[0])}
              min={0}
              max={45}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0° (flat)</span>
              <span>15° (optimal)</span>
              <span>45° (steep)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden mb-6">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={roofPath.length > 0 ? roofPath[0] : defaultCenter}
            zoom={20}
            mapTypeId="satellite"
            onLoad={onMapLoad}
          >
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingMode: google.maps.drawing.OverlayType.POLYGON as any,
                drawingControl: true,
                drawingControlOptions: {
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON as any],
                },
                polygonOptions: {
                  fillColor: "#ffeb3b",
                  fillOpacity: 0.3,
                  strokeColor: "#f44336",
                  strokeWeight: 2,
                  editable: true,
                },
              }}
            />

            {roofPath.length > 0 && (
              <Polygon
                paths={roofPath}
                options={{
                  fillColor: "#ffeb3b",
                  fillOpacity: 0.2,
                  strokeColor: "#f44336",
                  strokeWeight: 2,
                }}
              />
            )}

            {panels.map((panel, i) => (
              <Rectangle
                key={i}
                bounds={panel}
                options={{
                  fillColor: "#1e90ff",
                  fillOpacity: 0.6,
                  strokeColor: "#0d47a1",
                  strokeWeight: 1,
                }}
              />
            ))}
          </GoogleMap>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center gap-2">
          <Sun className="h-6 w-6 text-amber-500" />
          <span className="text-2xl font-bold">{panelCount}</span>
          <span className="text-xs text-muted-foreground">Panels ({PANEL_WATT}W each)</span>
        </Card>
        <Card className="p-4 flex flex-col items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">{capacityKW.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">Capacity (kW)</span>
        </Card>
        <Card className="p-4 flex flex-col items-center gap-2">
          <Battery className="h-6 w-6 text-green-500" />
          <span className="text-2xl font-bold text-center text-sm">{inverterSuggestion}</span>
          <span className="text-xs text-muted-foreground">Inverter</span>
        </Card>
        <Card className="p-4 flex flex-col items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <span className="text-2xl font-bold">{dailyEnergy.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">Daily kWh ({tiltAngle}° tilt)</span>
          <span className="text-xs text-muted-foreground">{annualEnergy.toFixed(0)} kWh/year</span>
        </Card>
      </div>
    </AppLayout>
  );
}
