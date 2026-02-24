import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import type { RoofType, StructureType, ClampType } from "@/utils/solarCalculations";

export function RoofTypePanel() {
  const {
    roofType, setRoofType,
    structureType, setStructureType,
    deadLoadLimit, setDeadLoadLimit,
    purlinSpacing, setPurlinSpacing,
    clampType, setClampType,
    rccDetails, metalRoofDetails,
  } = useSolarLayout();

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" /> Roof Type
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Roof Type</Label>
          <Select value={roofType} onValueChange={(v) => setRoofType(v as RoofType)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rcc">RCC Rooftop</SelectItem>
              <SelectItem value="metal_sheet">Metal Sheet</SelectItem>
              <SelectItem value="tile">Tile Roof</SelectItem>
              <SelectItem value="ground_mount">Ground Mount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {roofType === "rcc" && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Structure Type</Label>
              <Select value={structureType} onValueChange={(v) => setStructureType(v as StructureType)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ballast">Ballast</SelectItem>
                  <SelectItem value="anchor">Anchor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dead Load Limit (kg/m²)</Label>
              <Input
                type="number"
                value={deadLoadLimit}
                onChange={(e) => setDeadLoadLimit(parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            {rccDetails && (
              <div className="space-y-1">
                <Label className="text-xs">Structural Status</Label>
                <div className="flex items-center gap-2">
                  {rccDetails.isSafe ? (
                    <Badge className="bg-green-600 text-white text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Safe ({rccDetails.totalLoad.toFixed(0)} kg)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" /> Overloaded ({rccDetails.totalLoad.toFixed(0)} kg)
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {roofType === "metal_sheet" && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Purlin Spacing (mm)</Label>
              <Input
                type="number"
                value={purlinSpacing}
                onChange={(e) => setPurlinSpacing(parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Clamp Type</Label>
              <Select value={clampType} onValueChange={(v) => setClampType(v as ClampType)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid_clamp">Mid Clamp</SelectItem>
                  <SelectItem value="end_clamp">End Clamp</SelectItem>
                  <SelectItem value="l_foot">L-Foot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {metalRoofDetails && (
              <div className="space-y-1">
                <Label className="text-xs">Hardware Count</Label>
                <div className="text-xs space-y-0.5">
                  <div>Rails: <span className="font-bold">{metalRoofDetails.railCount}</span></div>
                  <div>Clamps: <span className="font-bold">{metalRoofDetails.clampCount}</span></div>
                  <div>Fasteners: <span className="font-bold">{metalRoofDetails.fastenerCount}</span></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
