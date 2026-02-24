import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wind, Flame } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";

export function LocationPanel() {
  const { latitude, longitude, setLatitude, setLongitude, windZone, fireComplianceRequired, setFireComplianceRequired, tiltAngle } = useSolarLayout();

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Location & Coordinates
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input
            type="number"
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input
            type="number"
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Optimal Tilt</Label>
          <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
            {tiltAngle}°
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Wind className="h-3 w-3" /> Wind Zone</Label>
          <Badge variant="outline" className="text-xs">
            {windZone}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Switch
          checked={fireComplianceRequired}
          onCheckedChange={setFireComplianceRequired}
          id="fire-compliance"
        />
        <Label htmlFor="fire-compliance" className="text-xs flex items-center gap-1 cursor-pointer">
          <Flame className="h-3 w-3 text-orange-500" /> Fire Compliance Required
        </Label>
      </div>
    </Card>
  );
}
