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
import { GoogleMap, useJsApiLoader, Polygon, Rectangle, Marker, Polyline } from "@react-google-maps/api";
import {
  Loader2, Save, Sun, Zap, ArrowLeft, RotateCw, Ruler,
  FileText, Map, Box, Download, MapPin,
} from "lucide-react";
import { useQuotations } from "@/hooks/useQuotations";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";

import { SolarLayoutProvider, useSolarLayout } from "@/components/solar-layout/SolarLayoutContext";
import { LocationPanel } from "@/components/solar-layout/LocationPanel";
import { RoofTypePanel } from "@/components/solar-layout/RoofTypePanel";
import { DrawingToolbar } from "@/components/solar-layout/DrawingToolbar";
import { StatsPanel } from "@/components/solar-layout/StatsPanel";
import { CompliancePanel } from "@/components/solar-layout/CompliancePanel";
import { WalkwayPipelinePanel } from "@/components/solar-layout/WalkwayPipelinePanel";
import { ObstaclesList } from "@/components/solar-layout/ObstaclesList";
import { PANEL_OPTIONS, autoFitPanelsOnMap, metersToLatDeg, metersToLngDeg, shrinkPolygon } from "@/utils/solarCalculations";
import { exportSolarPlan } from "@/utils/solarPlanExport";

const SolarDesign3D = lazy(() => import("@/components/solar-3d/SolarDesign3D"));

const GOOGLE_MAPS_API_KEY = "AIzaSyCo4qVbO5BnurRIkcQ-MWb-CAaTpwX0r_A";
const LIBRARIES: ("geometry")[] = ["geometry"];

const mapContainerStyle = { width: "100%", height: "500px", borderRadius: "12px" };
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

interface SolarLayoutData {
  roofPolygon: { lat: number; lng: number }[];
  panels: { north: number; south: number; east: number; west: number }[];
  panelCount: number;
  capacityKW: number;
  orientation?: string;
  tiltAngle?: number;
  panelWatt?: number;
  roofType?: string;
  safetySetback?: number;
  obstacles?: any[];
  walkways?: any;
  latitude?: number;
  longitude?: number;
}

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
    <SolarLayoutProvider
      initialLatitude={13.0827}
      initialLongitude={80.2707}
      projectCategory={project.project_category}
    >
      <SolarLayoutInner project={project} />
    </SolarLayoutProvider>
  );
}

function SolarLayoutInner({ project }: { project: any }) {
  const navigate = useNavigate();
  const ctx = useSolarLayout();
  const {
    latitude, longitude, setLatitude, setLongitude,
    selectedPanelIdx, setSelectedPanelIdx, selectedPanel,
    orientation, setOrientation,
    tiltAngle, setTiltAngle,
    roofPath, setRoofPath, safetyBoundary, safetySetback,
    panels, setPanels,
    obstacles, walkways, pipelines,
    activeTool, setActiveTool, drawPoints, setDrawPoints,
    activeTab, setActiveTab,
    stats, rccDetails, metalRoofDetails, compliance, roofAreaM2, usableAreaM2,
    hasPerimeterWalkway, perimeterWalkwayWidth, hasCentralWalkway, centralWalkwayWidth,
    roofType,
  } = ctx;

  const { createQuotation } = useQuotations();
  const { updateLead } = useLeads();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Load saved layout
  useEffect(() => {
    if (project?.solar_layout) {
      const layout = project.solar_layout as unknown as SolarLayoutData;
      if (layout.roofPolygon) setRoofPath(layout.roofPolygon);
      if (layout.panels) setPanels(layout.panels);
      if (layout.orientation) setOrientation(layout.orientation as any);
      if (layout.tiltAngle !== undefined) setTiltAngle(layout.tiltAngle);
      if (layout.panelWatt) {
        const idx = PANEL_OPTIONS.findIndex(p => p.watt === layout.panelWatt);
        if (idx >= 0) setSelectedPanelIdx(idx);
      }
      if (layout.latitude) setLatitude(layout.latitude);
      if (layout.longitude) setLongitude(layout.longitude);
    }
  }, [project]);

  // Auto-fill panels
  const doAutoFill = useCallback(() => {
    if (roofPath.length < 3 || !isLoaded) return;
    const result = autoFitPanelsOnMap(roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines);
    setPanels(result);
    toast({ title: "Auto Fill Complete", description: `${result.length} panels placed.` });
  }, [roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines, isLoaded, setPanels, toast]);

  // Re-fit when key params change
  useEffect(() => {
    if (roofPath.length >= 3 && isLoaded) {
      const result = autoFitPanelsOnMap(roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines);
      setPanels(result);
    }
  }, [orientation, selectedPanelIdx, tiltAngle, safetySetback, hasPerimeterWalkway, hasCentralWalkway, obstacles.length]);

  // Map click handler
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };

    if (activeTool === "roof") {
      setDrawPoints([...drawPoints, pt]);
    } else if (activeTool === "none") {
      // Update coordinates from click
      setLatitude(pt.lat);
      setLongitude(pt.lng);
    }
  }, [activeTool, setDrawPoints, setLatitude, setLongitude]);

  const finishDrawing = useCallback(() => {
    if (activeTool === "roof") {
      if (drawPoints.length < 3) {
        toast({ title: "Need at least 3 points", variant: "destructive" });
        return;
      }
      setRoofPath(drawPoints);
      // Update lat/lng to center of roof
      const centerLat = drawPoints.reduce((s, p) => s + p.lat, 0) / drawPoints.length;
      const centerLng = drawPoints.reduce((s, p) => s + p.lng, 0) / drawPoints.length;
      setLatitude(centerLat);
      setLongitude(centerLng);
    }
    setDrawPoints([]);
    setActiveTool("none");
  }, [activeTool, drawPoints, setRoofPath, setDrawPoints, setActiveTool, setLatitude, setLongitude, toast]);

  const handleClear = () => {
    setRoofPath([]);
    setPanels([]);
    setDrawPoints([]);
    setActiveTool("none");
  };

  const handleSave = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      const layoutData: SolarLayoutData = {
        roofPolygon: roofPath,
        panels,
        panelCount: panels.length,
        capacityKW: stats.totalCapacityKW,
        orientation,
        tiltAngle,
        panelWatt: selectedPanel.watt,
        roofType,
        safetySetback,
        obstacles: obstacles.map(o => ({ ...o })),
        walkways: { hasPerimeter: hasPerimeterWalkway, perimeterWidth: perimeterWalkwayWidth, hasCentral: hasCentralWalkway, centralWidth: centralWalkwayWidth },
        latitude,
        longitude,
      };

      const { error } = await supabase
        .from("projects")
        .update({
          solar_layout: layoutData as any,
          capacity_kw: stats.totalCapacityKW,
          project_revenue: stats.epcRevenue,
          total_material_cost: stats.materialCost,
        })
        .eq("id", project.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
      toast({ title: "Layout Saved", description: `${panels.length} panels, ${stats.totalCapacityKW.toFixed(2)} kWp saved. Financials synced.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuote = async () => {
    const resolvedLeadId = project?.lead_id;
    if (!resolvedLeadId) {
      toast({ title: "No lead linked", variant: "destructive" });
      return;
    }
    if (panels.length === 0) {
      toast({ title: "No panels", description: "Draw a roof and fit panels first.", variant: "destructive" });
      return;
    }

    setGeneratingQuote(true);
    try {
      const inverter = stats.inverterSuggestion;
      const bomItems = [
        { sno: 1, material: "Solar Module", make: "", description: `${selectedPanel.watt}W Panel`, quantity: panels.length, unit: "Nos", cost: 0 },
        { sno: 2, material: "Inverter", make: "", description: inverter, quantity: Math.ceil(stats.totalCapacityKW / 10) || 1, unit: "Nos", cost: 0 },
        { sno: 3, material: "Monitoring System", make: "", description: "Data Monitoring", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 4, material: "Module Mounting Structure", make: "", description: `For ${stats.totalCapacityKW.toFixed(2)} kW system`, quantity: Math.ceil(stats.totalCapacityKW), unit: "Kw", cost: 0 },
        { sno: 5, material: "DCDB", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 6, material: "AC Combiner Box", make: "", description: "", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 7, material: "DC Cable", make: "Polycab", description: "4 SQ.MM -FRLS,1000vdc-", quantity: 0, unit: "Mtr", cost: 0 },
        { sno: 8, material: "AC Cable", make: "Orbit/Polycab", description: "", quantity: 0, unit: "Mtr", cost: 0 },
        { sno: 9, material: "Earth Rod", make: "", description: "1m Copper bonded with chemical bag", quantity: 2, unit: "Nos", cost: 0 },
        { sno: 10, material: "Lighting Arrester", make: "", description: "Conventional", quantity: 1, unit: "Nos", cost: 0 },
        { sno: 11, material: "Installation Cost", make: "", description: "", quantity: Math.ceil(stats.totalCapacityKW), unit: "Kw", cost: 0 },
      ];

      const result = await createQuotation.mutateAsync({
        lead_id: resolvedLeadId,
        system_kw: stats.totalCapacityKW,
        bom: bomItems,
        subtotal: 0,
        gst_amount: 0,
        total_amount: 0,
        validity_days: 15,
        terms_conditions: `1. Quotation valid for 15 days.\n2. 60% advance with PO.\n3. 30% on material delivery.\n4. 10% on commissioning.\n5. GST @9%.\n6. Net metering charges extra.\n7. Civil work included.`,
        prepared_by: user?.id,
        status: 'draft',
      });

      await updateLead.mutateAsync({ id: resolvedLeadId, status: 'quotation_prepared' });
      toast({ title: "Quotation Created", description: `Draft quote for ${stats.totalCapacityKW.toFixed(2)} kW.` });
      navigate(`/quotations/${result.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handleExportPDF = () => {
    exportSolarPlan({
      projectName: project?.project_name || "Solar Project",
      latitude, longitude, roofType, roofAreaM2, usableAreaM2,
      panel: selectedPanel, orientation, tiltAngle, stats,
      rccDetails: rccDetails, metalRoofDetails: metalRoofDetails,
      compliance,
      hasPerimeterWalkway, perimeterWalkwayWidth,
      hasCentralWalkway, centralWalkwayWidth,
      safetySetback,
      obstacleCount: obstacles.length,
    });
    toast({ title: "PDF Exported", description: "Solar plan PDF downloaded." });
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

  // Walkway polygons for display
  const perimeterWalkwayPath = hasPerimeterWalkway && roofPath.length >= 3
    ? shrinkPolygon(roofPath, perimeterWalkwayWidth)
    : [];

  return (
    <AppLayout title={`Solar Design — ${project?.project_name}`}>
      {/* Top Action Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {/* Coordinates display */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          <MapPin className="h-3 w-3" />
          {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || panels.length === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={handleGenerateQuote} disabled={generatingQuote || panels.length === 0}>
            {generatingQuote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Quote
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={panels.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Location & Roof Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <LocationPanel />
        <RoofTypePanel />
      </div>

      {/* Panel Settings */}
      <Card className="p-3 mb-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Sun className="h-3.5 w-3.5" /> Panel Type
            </Label>
            <Select value={String(selectedPanelIdx)} onValueChange={(v) => setSelectedPanelIdx(Number(v))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PANEL_OPTIONS.map((p, i) => (
                  <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <RotateCw className="h-3.5 w-3.5" /> Orientation
            </Label>
            <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <Label className="flex items-center gap-2 text-xs font-medium">
              <Ruler className="h-3.5 w-3.5" /> Tilt: {tiltAngle}°
            </Label>
            <Slider value={[tiltAngle]} onValueChange={(v) => setTiltAngle(v[0])} min={0} max={45} step={1} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0° flat</span><span>15° optimal</span><span>45° steep</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Walkway, Pipeline, Safety */}
      <WalkwayPipelinePanel />

      {/* Obstacles */}
      <div className="mt-3">
        <ObstaclesList />
      </div>

      {/* Compliance */}
      <div className="mt-3">
        <CompliancePanel />
      </div>

      {/* Tabs: 2D / 3D */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="2d" className="flex items-center gap-2">
            <Map className="h-4 w-4" /> 2D Satellite
          </TabsTrigger>
          <TabsTrigger value="3d" className="flex items-center gap-2">
            <Box className="h-4 w-4" /> 3D Design Engine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="2d" className="mt-3 space-y-3">
          {/* Drawing Toolbar */}
          <DrawingToolbar onAutoFill={doAutoFill} onClear={handleClear} onFinishDraw={finishDrawing} />

          {/* Drawing instructions */}
          {activeTool !== "none" && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-300">
              🖱️ <strong>Click on the map</strong> to place points. Click <strong>"Finish"</strong> when done.
            </div>
          )}

          {/* Map */}
          <Card className="overflow-hidden">
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
                  draggableCursor: activeTool !== "none" ? "crosshair" : undefined,
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
                    options={{ fillColor: "#ffeb3b", fillOpacity: 0.2, strokeColor: "#f44336", strokeWeight: 2, strokeOpacity: 0.8 }}
                  />
                )}

                {/* Roof polygon */}
                {roofPath.length > 0 && activeTool !== "roof" && (
                  <Polygon
                    paths={roofPath}
                    options={{ fillColor: "#ffeb3b", fillOpacity: 0.15, strokeColor: "#f44336", strokeWeight: 2 }}
                  />
                )}

                {/* Safety boundary */}
                {safetyBoundary.length > 0 && activeTool !== "roof" && (
                  <Polygon
                    paths={safetyBoundary}
                    options={{ fillColor: "transparent", fillOpacity: 0, strokeColor: "#4ade80", strokeWeight: 2, strokeOpacity: 0.8 }}
                  />
                )}

                {/* Perimeter walkway area */}
                {perimeterWalkwayPath.length > 0 && (
                  <Polygon
                    paths={[roofPath, perimeterWalkwayPath]}
                    options={{ fillColor: "#fbbf24", fillOpacity: 0.3, strokeColor: "#f59e0b", strokeWeight: 1 }}
                  />
                )}

                {/* Panels */}
                {panels.map((panel, i) => (
                  <Rectangle
                    key={i}
                    bounds={panel}
                    options={{ fillColor: "#1e90ff", fillOpacity: 0.6, strokeColor: "#0d47a1", strokeWeight: 1 }}
                  />
                ))}

                {/* Obstacles on map (simple markers) */}
                {obstacles.map((obs) => (
                  <Marker
                    key={obs.id}
                    position={{ lat: latitude + obs.position[2] / 111320, lng: longitude + obs.position[0] / (111320 * Math.cos((latitude * Math.PI) / 180)) }}
                    icon={{
                      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                      scale: 5,
                      fillColor: "#ef4444",
                      fillOpacity: 0.9,
                      strokeColor: "#fff",
                      strokeWeight: 1,
                    }}
                    title={obs.label || obs.type}
                  />
                ))}
              </GoogleMap>
            )}
          </Card>

          {/* Stats */}
          <StatsPanel />
        </TabsContent>

        <TabsContent value="3d" className="mt-3">
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
              panelCount={panels.length}
              capacityKW={stats.totalCapacityKW}
              dailyEnergy={stats.dailyEnergyKWh}
              annualEnergy={stats.annualEnergyKWh}
              inverterSuggestion={stats.inverterSuggestion}
              tiltAngle={tiltAngle}
              orientation={orientation}
              panelWatt={selectedPanel.watt}
              panelLength={selectedPanel.length}
              panelWidth={selectedPanel.width}
              latitude={latitude}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
