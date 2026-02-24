import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Footprints, Droplets, ShieldCheck } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";

export function WalkwayPipelinePanel() {
  const {
    hasPerimeterWalkway, setHasPerimeterWalkway,
    perimeterWalkwayWidth, setPerimeterWalkwayWidth,
    hasCentralWalkway, setHasCentralWalkway,
    centralWalkwayWidth, setCentralWalkwayWidth,
    safetySetback, setSafetySetback,
  } = useSolarLayout();

  return (
    <Card className="p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Walkways */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-yellow-500" /> Walkways
          </h4>
          <div className="flex items-center gap-2">
            <Switch checked={hasPerimeterWalkway} onCheckedChange={setHasPerimeterWalkway} id="perimeter-wk" />
            <Label htmlFor="perimeter-wk" className="text-xs cursor-pointer">Perimeter Fire Walkway</Label>
          </div>
          {hasPerimeterWalkway && (
            <div className="space-y-1">
              <Label className="text-xs">Width (m): {perimeterWalkwayWidth}</Label>
              <Slider
                value={[perimeterWalkwayWidth]}
                onValueChange={(v) => setPerimeterWalkwayWidth(v[0])}
                min={0.3} max={1.5} step={0.1}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={hasCentralWalkway} onCheckedChange={setHasCentralWalkway} id="central-wk" />
            <Label htmlFor="central-wk" className="text-xs cursor-pointer">Central Access Walkway</Label>
          </div>
          {hasCentralWalkway && (
            <div className="space-y-1">
              <Label className="text-xs">Width (m): {centralWalkwayWidth}</Label>
              <Slider
                value={[centralWalkwayWidth]}
                onValueChange={(v) => setCentralWalkwayWidth(v[0])}
                min={0.5} max={2.0} step={0.1}
              />
            </div>
          )}
        </div>

        {/* Pipeline info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5 text-blue-500" /> Water Pipeline
          </h4>
          <p className="text-xs text-muted-foreground">
            Use the Pipeline tool in the toolbar to draw pipelines on the map. Min clearance from panels: 0.3m.
          </p>
        </div>

        {/* Safety Edge */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Safety Edge Setback
          </h4>
          <div className="space-y-1">
            <Label className="text-xs">Setback from edge (m): {safetySetback}</Label>
            <Slider
              value={[safetySetback]}
              onValueChange={(v) => setSafetySetback(v[0])}
              min={0} max={2.0} step={0.1}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
