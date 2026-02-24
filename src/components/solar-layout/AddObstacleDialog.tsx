import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import type { ObstacleItem } from "@/utils/solarCalculations";

const OBSTACLE_TYPES = [
  { value: "water_tank", label: "Water Tank" },
  { value: "lift_room", label: "Lift Room" },
  { value: "staircase", label: "Staircase" },
  { value: "ac_unit", label: "AC Unit" },
  { value: "parapet_wall", label: "Parapet Wall" },
  { value: "custom", label: "Custom" },
] as const;

const DEFAULT_SIZES: Record<string, { length: number; width: number; height: number }> = {
  water_tank: { length: 1.5, width: 1.5, height: 1.2 },
  lift_room: { length: 3.0, width: 3.0, height: 3.0 },
  staircase: { length: 3.0, width: 2.0, height: 3.0 },
  ac_unit: { length: 1.0, width: 0.8, height: 0.6 },
  parapet_wall: { length: 10.0, width: 0.3, height: 1.0 },
  custom: { length: 2.0, width: 2.0, height: 1.5 },
};

export function AddObstacleDialog() {
  const { addObstacle } = useSolarLayout();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("water_tank");
  const [length, setLength] = useState(1.5);
  const [width, setWidth] = useState(1.5);
  const [height, setHeight] = useState(1.2);
  const [label, setLabel] = useState("");

  const handleTypeChange = (v: string) => {
    setType(v);
    const def = DEFAULT_SIZES[v];
    if (def) {
      setLength(def.length);
      setWidth(def.width);
      setHeight(def.height);
    }
  };

  const handleAdd = () => {
    const obstacle: ObstacleItem = {
      id: `obs-${Date.now()}`,
      type: type as ObstacleItem["type"],
      position: [0, height / 2, 0],
      length,
      width,
      height,
      label: label || undefined,
    };
    addObstacle(obstacle);
    setOpen(false);
    setLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Obstacle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Obstacle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBSTACLE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Length (m)</Label>
              <Input type="number" step="0.1" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Width (m)</Label>
              <Input type="number" step="0.1" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height (m)</Label>
              <Input type="number" step="0.1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Custom Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-sm" placeholder="e.g. North Water Tank" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={handleAdd}>Add Obstacle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
