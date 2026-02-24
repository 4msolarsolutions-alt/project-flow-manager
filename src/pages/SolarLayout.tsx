import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject, useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleMap, useJsApiLoader, Polygon, Rectangle, Marker } from "@react-google-maps/api";
import { Loader2, Save, Trash2, Sun, Zap, Battery, BarChart3, ArrowLeft, RotateCw, Ruler, MousePointer, CheckCircle2, FileText, Map, Box } from "lucide-react";
import { useQuotations } from "@/hooks/useQuotations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";

const SolarDesign3D = lazy(() => import("@/components/solar-3d/SolarDesign3D"));

const GOOGLE_MAPS_API_KEY = "AIzaSyCo4qVbO5BnurRIkcQ-MWb-CAaTpwX0r_A";
const LIBRARIES: ("geometry")[] = ["geometry"];

// Panel options
const PANEL_OPTIONS = [
  { label: "550W Panel (2.278m × 1.134m)", watt: 550, length: 2.278, width: 1.134 },
  { label: "540W Panel (2.278m × 1.134m)", watt: 540, length: 2.278, width: 1.134 },
  { label: "500W Panel (2.187m × 1.102m)", watt: 500, length: 2.187, width: 1.102 },
  { label: "450W Panel (2.094m × 1.038m)", watt: 450, length: 2.094, width: 1.038 },
  { label: "400W Panel (1.956m × 1.002m)", watt: 400, length: 1.956, width: 1.002 },
  { label: "335W Panel (1.690m × 0.996m)", watt: 335, length: 1.690, width: 0.996 },
];

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
  panelWatt?: number;
}

function getInverterSuggestion(capacityKW: number): string {
  if (capacityKW <= 5) return "5kW Inverter";
  if (capacityKW <= 10) return "10kW Inverter";
  return `Multiple 10kW Inverters (${Math.ceil(capacityKW / 10)}x)`;
}

function metersToLatDeg(m: number) { return m / 111320; }
function metersToLngDeg(m: number, lat: number) { return m / (111320 * Math.cos((lat * Math.PI) / 180)); }

export default function SolarLayout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdParam = searchParams.get("project");
  const leadIdParam = searchParams.get("lead");
  const { projects } = useProjects();
  const { leads } = useLeads();
  const resolvedProjectId = projectIdParam || (leadIdParam && projects?.find(p => p.lead_id === leadIdParam)?.id) || undefined;
  const { data: project, isLoading: projectLoading } = useProject(resolvedProjectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoCreating, setAutoCreating] = useState(false);

  // Auto-create project for a lead if none exists
  useEffect(() => {
    if (!resolvedProjectId && leadIdParam && projects && !autoCreating) {
      const existingProject = projects.find(p => p.lead_id === leadIdParam);
      if (!existingProject) {
        const lead = leads?.find((l: any) => l.id === leadIdParam);
        if (lead) {
          setAutoCreating(true);
          supabase
            .from("projects")
            .insert({
              lead_id: leadIdParam,
              project_name: `${lead.customer_name} - ${(lead.project_type || 'epc').toUpperCase()}`,
              project_type: lead.project_type || 'epc',
              status: 'planning',
            })
            .select()
            .single()
            .then(({ data, error }) => {
              setAutoCreating(false);
              if (error) {
                toast({ title: "Error creating project", description: error.message, variant: "destructive" });
              } else if (data) {
                queryClient.invalidateQueries({ queryKey: ["projects"] });
                toast({ title: "Project Created", description: "A project was auto-created for this lead." });
              }
            });
        }
      }
    }
  }, [resolvedProjectId, leadIdParam, projects, leads, autoCreating, queryClient, toast]);

  const [roofPath, setRoofPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [panels, setPanels] = useState<{ north: number; south: number; east: number; west: number }[]>([]);
  const { createQuotation } = useQuotations();
  const { updateLead } = useLeads();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [orientation, setOrientation] = useState<PanelOrientation>("landscape");
  const [tiltAngle, setTiltAngle] = useState(15);
  const [selectedPanelIdx, setSelectedPanelIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [activeTab, setActiveTab] = useState("2d");
  const mapRef = useRef<google.maps.Map | null>(null);

  const selectedPanel = PANEL_OPTIONS[selectedPanelIdx];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const panelCount = panels.length;
  const capacityKW = (panelCount * selectedPanel.watt) / 1000;
  const tiltFactor = Math.cos(((tiltAngle - 15) * Math.PI) / 180);
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
      if (layout.panelWatt) {
        const idx = PANEL_OPTIONS.findIndex(p => p.watt === layout.panelWatt);
        if (idx >= 0) setSelectedPanelIdx(idx);
      }
    }
  }, [project]);

  const autoFitPanels = useCallback((path: google.maps.LatLngLiteral[], orient: PanelOrientation, panel: typeof PANEL_OPTIONS[0]) => {
    if (path.length < 3) return;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const centerLat = (ne.lat() + sw.lat()) / 2;

    const panelH = orient === "landscape" ? panel.width : panel.length;
    const panelW = orient === "landscape" ? panel.length : panel.width;

    const panelLatSize = metersToLatDeg(panelH + 0.1);
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

  // Re-fit when orientation or panel type changes
  useEffect(() => {
    if (roofPath.length >= 3) {
      autoFitPanels(roofPath, orientation, selectedPanel);
    }
  }, [orientation, selectedPanelIdx, autoFitPanels, roofPath, selectedPanel]);

  // Click-to-draw: handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return;
    setDrawPoints(prev => [...prev, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }]);
  }, [isDrawing]);

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawPoints([]);
    setRoofPath([]);
    setPanels([]);
    toast({ title: "Drawing Mode", description: "Click on the map to place roof corner points. Click 'Finish Drawing' when done." });
  };

  const finishDrawing = () => {
    if (drawPoints.length < 3) {
      toast({ title: "Need at least 3 points", variant: "destructive" });
      return;
    }
    setIsDrawing(false);
    setRoofPath(drawPoints);
    autoFitPanels(drawPoints, orientation, selectedPanel);
    setDrawPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
  };

  const handleSave = async () => {
    if (!resolvedProjectId) return;
    setSaving(true);
    try {
      const layoutData: SolarLayoutData = {
        roofPolygon: roofPath,
        panels,
        panelCount,
        capacityKW,
        orientation,
        tiltAngle,
        panelWatt: selectedPanel.watt,
      };
      const { error } = await supabase
        .from("projects")
        .update({ solar_layout: layoutData as any })
        .eq("id", resolvedProjectId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["projects", resolvedProjectId] });
      toast({ title: "Layout Saved", description: "Solar layout has been saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuote = async () => {
    if (!leadIdParam && !project?.lead_id) {
      toast({ title: "No lead linked", description: "This project has no associated lead for creating a quotation.", variant: "destructive" });
      return;
    }
    if (panelCount === 0) {
      toast({ title: "No panels", description: "Draw a roof and fit panels before generating a quote.", variant: "destructive" });
      return;
    }

    const resolvedLeadId = leadIdParam || project?.lead_id;
    if (!resolvedLeadId) return;

    setGeneratingQuote(true);
    try {
      const bomItems = [
        { sno: 1, material: "Solar Module", make: "", description: `${selectedPanel.watt}W Panel`, quantity: panelCount, unit: "Nos", cost: 0 },
        { sno: 2, material: "Inverter", make: "", description: inverterSuggestion, quantity: Math.ceil(capacityKW / 10) || 1, unit: "Nos", cost: 0 },
        { sno: 3, material: "Monitoring System", make: "", description: "Data Monitoring", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 4, material: "Module Mounting Structure", make: "", description: `For ${capacityKW.toFixed(2)} kW system`, quantity: Math.ceil(capacityKW), unit: "Kw", cost: 0 },
        { sno: 5, material: "DCDB", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 6, material: "AC Combiner Box", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 7, material: "DC Cable", make: "Polycab", description: "4 SQ.MM -FRLS,1000vdc-", quantity: 0, unit: "Mtr", cost: 0 },
        { sno: 8, material: "AC Cable", make: "Orbit/Polycab", description: "", quantity: 0, unit: "Mtr", cost: 0 },
        { sno: 9, material: "Earth Rod", make: "", description: "1m Copper bonded with chemical bag", quantity: 2, unit: "Nos", cost: 0 },
        { sno: 10, material: "Lighting Arrester", make: "", description: "Conventional", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 11, material: "Installation Cost", make: "", description: "", quantity: Math.ceil(capacityKW), unit: "Kw", cost: 0 },
      ];

      const result = await createQuotation.mutateAsync({
        lead_id: resolvedLeadId,
        system_kw: capacityKW,
        bom: bomItems,
        subtotal: 0,
        gst_amount: 0,
        total_amount: 0,
        validity_days: 15,
        terms_conditions: `1. Quotation valid for 15 days from the date of issue.\n2. 60% advance payment with Purchase Order.\n3. 30% upon material delivery.\n4. 10% on completion of installation after commissioning.\n5. GST @9% applicable on supply and installation.\n6. Net metering application charges extra (if applicable).\n7. Civil work included as per site requirements.`,
        prepared_by: user?.id,
        status: 'draft',
      });

      await updateLead.mutateAsync({
        id: resolvedLeadId,
        status: 'quotation_prepared',
      });

      toast({ title: "Quotation Created", description: `Draft quotation generated for ${capacityKW.toFixed(2)} kW system with ${panelCount} panels.` });
      navigate(`/quotations/${result.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handleClear = () => {
    setRoofPath([]);
    setPanels([]);
    setDrawPoints([]);
    setIsDrawing(false);
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

  if (projectLoading || autoCreating) {
    return (
      <AppLayout title="Solar Layout">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {autoCreating && <p className="ml-3 text-muted-foreground">Creating project...</p>}
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Solar Layout">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found. Please ensure a project exists for this lead first.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Solar Layout — ${project.project_name}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {activeTab === "2d" && (
            <>
              {!isDrawing ? (
                <Button variant="outline" size="sm" onClick={startDrawing}>
                  <MousePointer className="mr-2 h-4 w-4" /> Draw Roof
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="default" onClick={finishDrawing} disabled={drawPoints.length < 3}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Finish Drawing ({drawPoints.length} pts)
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelDrawing}>Cancel</Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || panels.length === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Layout
          </Button>
          <Button size="sm" variant="secondary" onClick={handleGenerateQuote} disabled={generatingQuote || panels.length === 0}>
            {generatingQuote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generate Quote
          </Button>
        </div>
      </div>

      {/* Panel Settings */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col gap-2 min-w-[220px]">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sun className="h-4 w-4" /> Panel Type
            </Label>
            <Select value={String(selectedPanelIdx)} onValueChange={(v) => setSelectedPanelIdx(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PANEL_OPTIONS.map((p, i) => (
                  <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px]">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <RotateCw className="h-4 w-4" /> Orientation
            </Label>
            <Select value={orientation} onValueChange={(v) => setOrientation(v as PanelOrientation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Tabs: 2D Satellite / 3D Design */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="2d" className="flex items-center gap-2">
            <Map className="h-4 w-4" /> 2D Satellite
          </TabsTrigger>
          <TabsTrigger value="3d" className="flex items-center gap-2">
            <Box className="h-4 w-4" /> 3D Design Engine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="2d" className="mt-4">
          {/* Drawing instructions */}
          {isDrawing && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              🖱️ <strong>Click on the rooftop</strong> to place corner points. Place at least 3 points to form the roof outline, then click <strong>"Finish Drawing"</strong>.
            </div>
          )}

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
                onClick={handleMapClick}
                options={{
                  draggableCursor: isDrawing ? "crosshair" : undefined,
                }}
              >
                {/* Drawing points preview */}
                {drawPoints.map((pt, i) => (
                  <Marker key={`draw-${i}`} position={pt} icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: "#f44336",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }} />
                ))}
                {drawPoints.length >= 2 && (
                  <Polygon
                    paths={drawPoints}
                    options={{
                      fillColor: "#ffeb3b",
                      fillOpacity: 0.2,
                      strokeColor: "#f44336",
                      strokeWeight: 2,
                      strokeOpacity: 0.8,
                    }}
                  />
                )}

                {/* Saved roof polygon */}
                {roofPath.length > 0 && !isDrawing && (
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

                {/* Panels */}
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
              <span className="text-xs text-muted-foreground">Panels ({selectedPanel.watt}W each)</span>
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
        </TabsContent>

        <TabsContent value="3d" className="mt-4">
          <Suspense fallback={
            <Card className="flex items-center justify-center h-[500px]">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading 3D Engine...</p>
              </div>
            </Card>
          }>
            <SolarDesign3D
              roofPolygon={roofPath}
              panelCount={panelCount}
              capacityKW={capacityKW}
              dailyEnergy={dailyEnergy}
              annualEnergy={annualEnergy}
              inverterSuggestion={inverterSuggestion}
              tiltAngle={tiltAngle}
              orientation={orientation}
              panelWatt={selectedPanel.watt}
              panelLength={selectedPanel.length}
              panelWidth={selectedPanel.width}
              latitude={roofPath.length > 0 ? roofPath[0].lat : 13.08}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
