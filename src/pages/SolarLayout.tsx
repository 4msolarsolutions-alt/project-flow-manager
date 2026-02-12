import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, Rectangle } from "@react-google-maps/api";
import { Loader2, Save, Trash2, Sun, Zap, Battery, BarChart3, ArrowLeft } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyB6enoBp3iI2JYmI0pcu3QQfAh5CYKe3ro";
const PANEL_WATT = 550;
const LIBRARIES: ("drawing")[] = ["drawing"];

const mapContainerStyle = { width: "100%", height: "500px", borderRadius: "12px" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

interface SolarLayoutData {
  roofPolygon: { lat: number; lng: number }[];
  panels: { north: number; south: number; east: number; west: number }[];
  panelCount: number;
  capacityKW: number;
}

function getInverterSuggestion(capacityKW: number): string {
  if (capacityKW <= 5) return "5kW Inverter";
  if (capacityKW <= 10) return "10kW Inverter";
  return `Multiple 10kW Inverters (${Math.ceil(capacityKW / 10)}x)`;
}

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const panelCount = panels.length;
  const capacityKW = (panelCount * PANEL_WATT) / 1000;
  const dailyEnergy = capacityKW * 5.5 * 0.75;
  const annualEnergy = dailyEnergy * 365;
  const inverterSuggestion = getInverterSuggestion(capacityKW);

  // Load saved layout
  useEffect(() => {
    if (project?.solar_layout) {
      const layout = project.solar_layout as unknown as SolarLayoutData;
      if (layout.roofPolygon) setRoofPath(layout.roofPolygon);
      if (layout.panels) setPanels(layout.panels);
    }
  }, [project]);

  const autoFitPanels = useCallback((path: google.maps.LatLngLiteral[]) => {
    if (path.length < 3) return;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const panelHeight = 0.00001;
    const panelWidth = 0.00002;
    const newPanels: { north: number; south: number; east: number; west: number }[] = [];

    // Create a google maps polygon to check containment
    const poly = new google.maps.Polygon({ paths: path });

    for (let lat = sw.lat(); lat < ne.lat(); lat += panelHeight) {
      for (let lng = sw.lng(); lng < ne.lng(); lng += panelWidth) {
        const center = new google.maps.LatLng(lat + panelHeight / 2, lng + panelWidth / 2);
        if (google.maps.geometry?.poly?.containsLocation(center, poly) ?? true) {
          newPanels.push({
            north: lat + panelHeight,
            south: lat,
            east: lng + panelWidth,
            west: lng,
          });
        }
      }
    }

    setPanels(newPanels);
  }, []);

  const onPolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      // Remove previous drawn polygon
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      polygonRef.current = polygon;

      const path = polygon
        .getPath()
        .getArray()
        .map((p) => ({ lat: p.lat(), lng: p.lng() }));
      setRoofPath(path);
      autoFitPanels(path);

      // Hide the drawn polygon since we render our own
      polygon.setVisible(false);
    },
    [autoFitPanels]
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

  // Center map on saved layout
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

            {/* Render roof polygon */}
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

            {/* Render panels */}
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
          <span className="text-xs text-muted-foreground">Daily kWh</span>
          <span className="text-xs text-muted-foreground">{annualEnergy.toFixed(0)} kWh/year</span>
        </Card>
      </div>
    </AppLayout>
  );
}
