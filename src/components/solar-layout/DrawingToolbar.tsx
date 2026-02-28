import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer, Pentagon, Box, Footprints, Droplets, ShieldCheck,
  GripVertical, Grid3X3, Trash2, CheckCircle2, X, Eye, MapPin, Square,
} from "lucide-react";
import { useSolarLayout, type DrawTool } from "./SolarLayoutContext";

interface DrawingToolbarProps {
  onAutoFill: () => void;
  onClear: () => void;
  onFinishDraw: () => void;
}

const tools: { tool: DrawTool; label: string; icon: typeof MousePointer; description: string }[] = [
  { tool: "roof", label: "Polygon Roof", icon: Pentagon, description: "Click to place roof corners" },
  { tool: "roof_rect", label: "Rect Roof", icon: Square, description: "Click-drag to draw rectangular roof" },
  { tool: "start_point", label: "Start Point", icon: MapPin, description: "Click to set panel fill origin" },
  { tool: "obstacle", label: "Obstacle", icon: Box, description: "Add obstacle on map" },
  { tool: "walkway", label: "Walkway", icon: Footprints, description: "Draw walkway path" },
  { tool: "pipeline", label: "Pipeline", icon: Droplets, description: "Draw water pipeline" },
  { tool: "safety_edge", label: "Safety Edge", icon: ShieldCheck, description: "Set safety setback" },
  { tool: "drain", label: "Drain Point", icon: GripVertical, description: "Place drain point" },
];

export function DrawingToolbar({ onAutoFill, onClear, onFinishDraw }: DrawingToolbarProps) {
  const { activeTool, setActiveTool, drawPoints, activeTab, additionalRoofs, roofPath } = useSolarLayout();

  if (activeTab !== "2d") return null;

  const isDrawing = activeTool !== "none" && activeTool !== "roof_rect";
  const roofCount = (roofPath.length >= 3 ? 1 : 0) + additionalRoofs.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/50 rounded-lg border">
      {tools.map(({ tool, label, icon: Icon }) => (
        <Button
          key={tool}
          variant={activeTool === tool ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setActiveTool(activeTool === tool ? "none" : tool)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {roofCount > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium px-1">
          {roofCount} roof{roofCount > 1 ? "s" : ""}
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={onAutoFill}
      >
        <Grid3X3 className="h-3.5 w-3.5" /> Auto Fill
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setActiveTool("none")}
      >
        <Eye className="h-3.5 w-3.5" /> 3D Preview
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 text-destructive"
        onClick={onClear}
      >
        <Trash2 className="h-3.5 w-3.5" /> Clear All
      </Button>

      {isDrawing && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs gap-1.5"
            onClick={onFinishDraw}
            disabled={drawPoints.length < (activeTool === "roof" || activeTool === "safety_edge" ? 3 : 2)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Finish ({drawPoints.length} pts)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5"
            onClick={() => setActiveTool("none")}
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </>
      )}

      {activeTool === "roof_rect" && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <span className="text-xs text-muted-foreground">Click & drag on map to draw rectangle</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5"
            onClick={() => setActiveTool("none")}
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </>
      )}
    </div>
  );
}
