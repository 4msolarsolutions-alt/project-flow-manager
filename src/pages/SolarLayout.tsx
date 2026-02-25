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
import { GoogleMap, useJsApiLoader, Polygon, Rectangle, Marker, Polyline, Autocomplete } from "@react-google-maps/api";
import {
  Loader2, Save, Sun, Zap, ArrowLeft, RotateCw, Ruler,
  FileText, Map, Box, Download, MapPin, Grid3X3, AlertTriangle,
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
import { PANEL_OPTIONS, autoFitPanelsOnMap, metersToLatDeg, metersToLngDeg, shrinkPolygon, updatePanelDimensions, addCustomPanel, type PanelOptionData } from "@/utils/solarCalculations";
import { exportSolarPlan, capture2DLayout, capture3DLayout } from "@/utils/solarPlanExport";

const SolarDesign3D = lazy(() => import("@/components/solar-3d/SolarDesign3D"));

const GOOGLE_MAPS_API_KEY = "AIzaSyCo4qVbO5BnurRIkcQ-MWb-CAaTpwX0r_A";
const LIBRARIES: ("geometry" | "places")[] = ["geometry", "places"];

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
    latitude, longitude, setLatitude, setLongitude, address, setAddress,
    selectedPanelIdx, setSelectedPanelIdx, selectedPanel,
    orientation, setOrientation,
    tiltAngle, setTiltAngle,
    panelGap, setPanelGap, rowGap, setRowGap,
    roofPath, setRoofPath, safetyBoundary, safetySetback,
    panels, setPanels,
    obstacles, walkways, pipelines,
    activeTool, setActiveTool, drawPoints, setDrawPoints,
    activeTab, setActiveTab,
    stats, rccDetails, metalRoofDetails, compliance, roofAreaM2, usableAreaM2,
    hasPerimeterWalkway, perimeterWalkwayWidth, hasCentralWalkway, centralWalkwayWidth,
    roofType, windZone,
    targetCapacityKW, setTargetCapacityKW, capacityExceedsRoof,
  } = ctx;

  const { createQuotation } = useQuotations();
  const { updateLead } = useLeads();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [, forceUpdate] = useState(0);
  const [manualRows, setManualRows] = useState<number | "">("");
  const [manualRowSpacing, setManualRowSpacing] = useState<number | "">("");
  const [manualPanelsPerRow, setManualPanelsPerRow] = useState<number | "">("");
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
    const target = targetCapacityKW > 0 ? targetCapacityKW : undefined;
    const result = autoFitPanelsOnMap(roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines, target, panelGap, rowGap);
    setPanels(result);
    if (target && result.length < Math.ceil((target * 1000) / selectedPanel.watt)) {
      toast({ title: "⚠️ Capacity Limited", description: `Target ${target} kW exceeds usable rooftop area. Placed ${result.length} panels (${((result.length * selectedPanel.watt) / 1000).toFixed(2)} kWp).`, variant: "destructive" });
    } else {
      toast({ title: "Auto Fill Complete", description: `${result.length} panels placed${target ? ` for ${target} kW target` : ""}.` });
    }
  }, [roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines, isLoaded, setPanels, toast, targetCapacityKW, panelGap, rowGap]);

  // Manual panel placement with user-defined rows, panels/row, and spacing
  const doManualFill = useCallback(() => {
    if (roofPath.length < 3 || !isLoaded) {
      toast({ title: "Draw a roof first", variant: "destructive" });
      return;
    }
    const rows = Number(manualRows) || stats.totalRows || 3;
    const perRow = Number(manualPanelsPerRow) || stats.panelsPerRow || 5;
    const spacingM = Number(manualRowSpacing) || stats.rowSpacingM || 0.5;

    const usePath = safetyBoundary.length >= 3 ? safetyBoundary : roofPath;
    const bounds = new google.maps.LatLngBounds();
    usePath.forEach((p) => bounds.extend(p));
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const centerLat = (ne.lat() + sw.lat()) / 2;

    const panelH = orientation === "landscape" ? selectedPanel.width : selectedPanel.length;
    const panelW = orientation === "landscape" ? selectedPanel.length : selectedPanel.width;

    const panelLatSize = metersToLatDeg(panelH);
    const rowLatSize = metersToLatDeg(panelH + spacingM);
    const panelLngSize = metersToLngDeg(panelW + 0.1, centerLat);

    const poly = new google.maps.Polygon({ paths: usePath });
    const result: { north: number; south: number; east: number; west: number }[] = [];

    for (let r = 0; r < rows; r++) {
      const rowLat = sw.lat() + r * rowLatSize;
      for (let c = 0; c < perRow; c++) {
        const colLng = sw.lng() + c * panelLngSize;
        const center = new google.maps.LatLng(rowLat + panelLatSize / 2, colLng + panelLngSize / 2);
        if (google.maps.geometry?.poly?.containsLocation(center, poly)) {
          result.push({
            north: rowLat + panelLatSize,
            south: rowLat,
            east: colLng + metersToLngDeg(panelW, centerLat),
            west: colLng,
          });
        }
      }
    }
    setPanels(result);
    toast({ title: "Manual Fill Complete", description: `${result.length} panels placed (${rows} rows × ${perRow} per row, ${spacingM}m spacing).` });
  }, [roofPath, safetyBoundary, orientation, selectedPanel, isLoaded, manualRows, manualPanelsPerRow, manualRowSpacing, stats, setPanels, toast]);
  useEffect(() => {
    if (roofPath.length >= 3 && isLoaded) {
      const target = targetCapacityKW > 0 ? targetCapacityKW : undefined;
      const result = autoFitPanelsOnMap(roofPath, safetyBoundary, orientation, selectedPanel, tiltAngle, obstacles, walkways, pipelines, target, panelGap, rowGap);
      setPanels(result);
    }
  }, [orientation, selectedPanelIdx, tiltAngle, safetySetback, hasPerimeterWalkway, hasCentralWalkway, obstacles.length, targetCapacityKW, panelGap, rowGap]);

  // Map click handler
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };

    if (activeTool === "roof" || activeTool === "walkway" || activeTool === "pipeline" || activeTool === "safety_edge") {
      setDrawPoints([...drawPoints, pt]);
    } else if (activeTool === "obstacle") {
      // Place obstacle at clicked point
      const obs: import("@/utils/solarCalculations").ObstacleItem = {
        id: crypto.randomUUID(),
        type: "custom",
        position: [
          (pt.lng - longitude) * 111320 * Math.cos((latitude * Math.PI) / 180),
          1.5,
          (pt.lat - latitude) * 111320,
        ],
        length: 1.5,
        width: 1.5,
        height: 1.5,
        label: `Obstacle ${ctx.obstacles.length + 1}`,
      };
      ctx.addObstacle(obs);
      toast({ title: "Obstacle Added", description: `Placed at ${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}` });
      setActiveTool("none");
    } else if (activeTool === "drain") {
      setDrawPoints([...drawPoints, pt]);
      toast({ title: "Drain Point Placed", description: `At ${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}` });
      setActiveTool("none");
    } else if (activeTool === "none") {
      setLatitude(pt.lat);
      setLongitude(pt.lng);
    }
  }, [activeTool, drawPoints, setDrawPoints, setLatitude, setLongitude, latitude, longitude, ctx, toast, setActiveTool]);

  const finishDrawing = useCallback(() => {
    if (activeTool === "roof") {
      if (drawPoints.length < 3) {
        toast({ title: "Need at least 3 points", variant: "destructive" });
        return;
      }
      setRoofPath(drawPoints);
      const centerLat = drawPoints.reduce((s, p) => s + p.lat, 0) / drawPoints.length;
      const centerLng = drawPoints.reduce((s, p) => s + p.lng, 0) / drawPoints.length;
      setLatitude(centerLat);
      setLongitude(centerLng);
    } else if (activeTool === "walkway" && drawPoints.length >= 2) {
      ctx.setWalkways([...ctx.walkways, { id: crypto.randomUUID(), type: "custom", width: 0.6, path: drawPoints }]);
      toast({ title: "Walkway Added" });
    } else if (activeTool === "pipeline" && drawPoints.length >= 2) {
      ctx.setPipelines([...ctx.pipelines, { id: crypto.randomUUID(), width: 0.15, clearance: 0.3, path: drawPoints }]);
      toast({ title: "Pipeline Added" });
    } else if (activeTool === "safety_edge" && drawPoints.length >= 3) {
      ctx.setSafetySetback(0.6);
      toast({ title: "Safety Edge Updated" });
    }
    setDrawPoints([]);
    setActiveTool("none");
  }, [activeTool, drawPoints, setRoofPath, setDrawPoints, setActiveTool, setLatitude, setLongitude, toast, ctx]);

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

  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setExportingPDF(true);
    toast({ title: "Generating PDF...", description: "Capturing layout images. Please wait." });

    try {
      // Capture 2D layout using Static API with satellite imagery + panel overlays
      const image2D = await capture2DLayout(
        ".gm-style",
        roofPath,
        panels,
        { lat: latitude, lng: longitude },
        GOOGLE_MAPS_API_KEY
      );

      // Capture 3D: temporarily switch tab, wait for render, capture, switch back
      const prevTab = activeTab;
      let image3D: string | null = null;
      
      if (prevTab !== "3d") {
        setActiveTab("3d");
        // Wait for 3D to render
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      image3D = capture3DLayout();
      if (prevTab !== "3d") {
        setActiveTab(prevTab);
      }

      // Get user name for prepared by
      const preparedBy = user ? `${(user as any).email || "Solar Engineer"}` : "Solar Engineer";
      
      // Get client name from project/lead
      const clientName = project?.project_name?.split(" - ")[0] || "";

      await exportSolarPlan({
        projectName: project?.project_name || "Solar Project",
        latitude, longitude, roofType, roofAreaM2, usableAreaM2,
        panel: selectedPanel, orientation, tiltAngle, stats,
        rccDetails, metalRoofDetails,
        compliance,
        hasPerimeterWalkway, perimeterWalkwayWidth,
        hasCentralWalkway, centralWalkwayWidth,
        safetySetback,
        obstacleCount: obstacles.length,
        windZone,
        targetCapacityKW: targetCapacityKW > 0 ? targetCapacityKW : undefined,
        image2D: image2D || undefined,
        image3D: image3D || undefined,
        preparedBy,
        clientName,
        previewUrl: window.location.href,
      });
      toast({ title: "PDF Exported", description: "Premium solar proposal PDF downloaded." });
    } catch (err: any) {
      toast({ title: "Export Error", description: err.message, variant: "destructive" });
    } finally {
      setExportingPDF(false);
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Pan map when coordinates change + reverse geocode
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: latitude, lng: longitude });
    }
    // Reverse geocode
    if (isLoaded && latitude && longitude) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          setAddress("");
        }
      });
    }
  }, [latitude, longitude, isLoaded, setAddress]);

  useEffect(() => {
    if (mapRef.current && roofPath.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      roofPath.forEach((p) => bounds.extend(p));
      mapRef.current.fitBounds(bounds);
    }
  }, [roofPath]);

  const onAutocompletePlaced = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setLatitude(lat);
      setLongitude(lng);
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(20);
      }
      toast({ title: "Location Set", description: place.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [setLatitude, setLongitude, toast]);

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

        {/* Coordinates & address display */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded max-w-md truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {address ? `${address} — ` : ""}{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
          </span>
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
          <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={exportingPDF || panels.length === 0}>
            {exportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {exportingPDF ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Location & Roof Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <LocationPanel />
        <RoofTypePanel />
      </div>

      {/* Target Capacity & Panel Settings */}
      <Card className="p-3 mb-3">
        <div className="flex flex-col gap-4">
          {/* Target kW Input with OK button */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Label className="flex items-center gap-2 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5 text-primary" /> Target Capacity (kW)
              </Label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 25, 50, 100"
                  value={targetCapacityKW || ""}
                  onChange={(e) => setTargetCapacityKW(e.target.value ? Number(e.target.value) : 0)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="sm"
                  className="h-9 px-4"
                  onClick={doAutoFill}
                  disabled={roofPath.length < 3 || targetCapacityKW <= 0}
                >
                  OK
                </Button>
                {targetCapacityKW > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2 text-xs text-muted-foreground"
                    onClick={() => setTargetCapacityKW(0)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {targetCapacityKW > 0 && (
              <div className="text-xs text-muted-foreground">
                Required: <strong>{Math.ceil((targetCapacityKW * 1000) / selectedPanel.watt)}</strong> panels of {selectedPanel.watt}Wp
              </div>
            )}
            {capacityExceedsRoof && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Target capacity exceeds usable rooftop area.
              </div>
            )}
          </div>

          {/* Panel Type, Orientation, Tilt */}
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Label className="flex items-center gap-2 text-xs font-medium">
                <Sun className="h-3.5 w-3.5" /> Panel Type
              </Label>
              <Select value={String(selectedPanelIdx)} onValueChange={(v) => setSelectedPanelIdx(Number(v))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PANEL_OPTIONS.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {p.label} ({p.length}m × {p.width}m)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Panel Dimensions (editable) */}
            <div className="flex flex-col gap-1.5 min-w-[100px]">
              <Label className="text-xs font-medium">Length (m)</Label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.001}
                value={selectedPanel.length}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) {
                    updatePanelDimensions(selectedPanelIdx, val, selectedPanel.width);
                    forceUpdate(n => n + 1);
                  }
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[100px]">
              <Label className="text-xs font-medium">Width (m)</Label>
              <input
                type="number"
                min={0.3}
                max={3}
                step={0.001}
                value={selectedPanel.width}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) {
                    updatePanelDimensions(selectedPanelIdx, selectedPanel.length, val);
                    forceUpdate(n => n + 1);
                  }
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
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

          {/* Panel gap & row gap controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-xs font-medium">Panel Gap (mm)</Label>
              <input
                type="number"
                min={0}
                max={200}
                step={1}
                value={Math.round(panelGap * 1000)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0) setPanelGap(val / 1000);
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-xs font-medium">Row Gap (mm)</Label>
              <input
                type="number"
                min={0}
                max={2000}
                step={10}
                value={Math.round(rowGap * 1000)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0) setRowGap(val / 1000);
                }}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Panel dimensions info */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground bg-muted/50 rounded px-3 py-1.5">
            <span>📐 <strong>{selectedPanel.watt}Wp</strong> — {selectedPanel.length}m × {selectedPanel.width}m — {selectedPanel.weight}kg — {selectedPanel.cellType} — η {selectedPanel.efficiency}% — Gap: {Math.round(panelGap * 1000)}mm — Row Gap: {Math.round(rowGap * 1000)}mm</span>
          </div>
        </div>
      </Card>

      {/* Manual Row & Spacing Controls — hidden when target capacity is active */}
      {targetCapacityKW <= 0 && (
        <Card className="p-3 mb-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Manual Panel Layout</Label>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[120px]">
                <Label className="text-xs">Number of Rows</Label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder={String(stats.totalRows || "Auto")}
                  value={manualRows}
                  onChange={(e) => setManualRows(e.target.value ? Number(e.target.value) : "")}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[140px]">
                <Label className="text-xs">Panels per Row</Label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder={String(stats.panelsPerRow || "Auto")}
                  value={manualPanelsPerRow}
                  onChange={(e) => setManualPanelsPerRow(e.target.value ? Number(e.target.value) : "")}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[150px]">
                <Label className="text-xs">Row Spacing (meters)</Label>
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  placeholder={stats.rowSpacingM?.toFixed(1) || "Auto"}
                  value={manualRowSpacing}
                  onChange={(e) => setManualRowSpacing(e.target.value ? Number(e.target.value) : "")}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Button size="sm" className="h-8" onClick={doManualFill} disabled={roofPath.length < 3}>
                <Grid3X3 className="mr-1.5 h-3.5 w-3.5" /> Apply Layout
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Leave blank to auto-calculate. Current: {stats.totalRows} rows × {stats.panelsPerRow} panels/row, {stats.rowSpacingM.toFixed(2)}m spacing
            </p>
          </div>
        </Card>
      )}

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

          {/* Location Search */}
          {isLoaded && (
            <div className="flex gap-2 items-center">
              <Autocomplete
                onLoad={(ac) => { autocompleteRef.current = ac; }}
                onPlaceChanged={onAutocompletePlaced}
                options={{ types: ["geocode", "establishment"] }}
              >
                <input
                  type="text"
                  placeholder="Search location, address, or place..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Autocomplete>
            </div>
          )}

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
                center={{ lat: latitude, lng: longitude }}
                zoom={20}
                mapTypeId="satellite"
                onLoad={onMapLoad}
                onClick={handleMapClick}
                options={{
                  draggableCursor: activeTool !== "none" ? "crosshair" : undefined,
                  maxZoom: 22,
                  minZoom: 15,
                  scrollwheel: true,
                  disableDoubleClickZoom: false,
                  gestureHandling: "greedy",
                  zoomControl: true,
                  zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                  },
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                }}
              >
                {/* Current location marker */}
                {roofPath.length === 0 && activeTool === "none" && (
                  <Marker position={{ lat: latitude, lng: longitude }} />
                )}

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
                    options={{ fillColor: "#ffeb3b", fillOpacity: 0.2, strokeColor: "#f44336", strokeWeight: 2, strokeOpacity: 0.8, clickable: false }}
                  />
                )}

                {/* Roof polygon */}
                {roofPath.length > 0 && activeTool !== "roof" && (
                  <Polygon
                    paths={roofPath}
                    options={{ fillColor: "#ffeb3b", fillOpacity: 0.15, strokeColor: "#f44336", strokeWeight: 2, clickable: false }}
                  />
                )}

                {/* Safety boundary */}
                {safetyBoundary.length > 0 && activeTool !== "roof" && (
                  <Polygon
                    paths={safetyBoundary}
                    options={{ fillColor: "transparent", fillOpacity: 0, strokeColor: "#4ade80", strokeWeight: 2, strokeOpacity: 0.8, clickable: false }}
                  />
                )}

                {/* Perimeter walkway area */}
                {perimeterWalkwayPath.length > 0 && (
                  <Polygon
                    paths={[roofPath, perimeterWalkwayPath]}
                    options={{ fillColor: "#fbbf24", fillOpacity: 0.3, strokeColor: "#f59e0b", strokeWeight: 1, clickable: false }}
                  />
                )}

                {/* Panels */}
                {panels.map((panel, i) => (
                  <Rectangle
                    key={i}
                    bounds={panel}
                    options={{ fillColor: "#1e90ff", fillOpacity: 0.6, strokeColor: "#0d47a1", strokeWeight: 1, clickable: false }}
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
