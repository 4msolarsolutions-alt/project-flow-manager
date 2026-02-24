import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wind, Flame, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSolarLayout } from "./SolarLayoutContext";

export function LocationPanel() {
  const { latitude, longitude, setLatitude, setLongitude, windZone, fireComplianceRequired, setFireComplianceRequired, tiltAngle } = useSolarLayout();
  const [pasteValue, setPasteValue] = useState("");

  const parseAndSetCoords = (value: string) => {
    const cleaned = value.trim().replace(/[()]/g, "");
    // Support "lat, lng", "lat lng", "lat,lng" and Google Maps URL formats
    const parts = cleaned.split(/[,\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLatitude(lat);
        setLongitude(lng);
        toast.success(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setPasteValue("");
        return true;
      }
    }
    return false;
  };

  const handleInputChange = (value: string) => {
    setPasteValue(value);
    parseAndSetCoords(value);
  };

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && parseAndSetCoords(text)) {
      e.preventDefault();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteValue(text);
        if (!parseAndSetCoords(text)) {
          toast.error("Could not parse coordinates. Use format: lat, lng");
        }
      }
    } catch {
      toast.error("Unable to read clipboard. Please paste manually (Ctrl+V).");
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Location & Coordinates
      </h3>

      {/* Paste-friendly input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Paste Coordinates (lat, lng)</Label>
          <Input
            type="text"
            placeholder="e.g. 13.0827, 80.2707"
            value={pasteValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePasteEvent}
            className="h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={handlePasteFromClipboard}>
          <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> Paste
        </Button>
      </div>

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