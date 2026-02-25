import { useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { GoogleMap, useJsApiLoader, Polygon, Rectangle } from "@react-google-maps/api";
import { Loader2, Sun, Zap, Battery, BarChart3 } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBdAjpPwn-S1QzJ1nQGsiCSbNXelewGPRE";
const LIBRARIES: ("geometry" | "places")[] = ["geometry", "places"];
const PANEL_WATT = 550;

const mapContainerStyle = { width: "100%", height: "400px", borderRadius: "12px" };

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

export default function CustomerSolarView() {
  const { projects, isLoading } = useCustomerProjects();
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Get first project with solar layout
  const project = projects?.find((p: any) => p.solar_layout);
  const layout = project?.solar_layout as unknown as SolarLayoutData | null;

  const panelCount = layout?.panelCount || 0;
  const capacityKW = layout?.capacityKW || 0;
  const dailyEnergy = capacityKW * 5.5 * 0.75;
  const annualEnergy = dailyEnergy * 365;
  const inverterSuggestion = getInverterSuggestion(capacityKW);

  useEffect(() => {
    if (mapRef.current && layout?.roofPolygon?.length) {
      const bounds = new google.maps.LatLngBounds();
      layout.roofPolygon.forEach((p) => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
    }
  }, [layout]);

  if (isLoading) {
    return (
      <AppLayout title="Solar Layout">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!layout) {
    return (
      <AppLayout title="Solar Layout">
        <div className="text-center py-12">
          <Sun className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No solar layout designed yet for your project.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Your Solar Layout">
      <Card className="overflow-hidden mb-6">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={layout.roofPolygon[0] || { lat: 13.0827, lng: 80.2707 }}
            zoom={20}
            mapTypeId="satellite"
            onLoad={(map) => { mapRef.current = map; }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {layout.roofPolygon.length > 0 && (
              <Polygon
                paths={layout.roofPolygon}
                options={{ fillColor: "#ffeb3b", fillOpacity: 0.2, strokeColor: "#f44336", strokeWeight: 2 }}
              />
            )}
            {layout.panels.map((panel, i) => (
              <Rectangle
                key={i}
                bounds={panel}
                options={{ fillColor: "#1e90ff", fillOpacity: 0.6, strokeColor: "#0d47a1", strokeWeight: 1 }}
              />
            ))}
          </GoogleMap>
        )}
      </Card>

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
