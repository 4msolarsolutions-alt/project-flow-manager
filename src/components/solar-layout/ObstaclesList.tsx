import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Box, X } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import { AddObstacleDialog } from "./AddObstacleDialog";

const TYPE_LABELS: Record<string, string> = {
  water_tank: "Water Tank",
  lift_room: "Lift Room",
  staircase: "Staircase",
  ac_unit: "AC Unit",
  parapet_wall: "Parapet Wall",
  custom: "Custom",
};

export function ObstaclesList() {
  const { obstacles, removeObstacle } = useSolarLayout();

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" /> Obstacles ({obstacles.length})
        </h3>
        <AddObstacleDialog />
      </div>
      {obstacles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {obstacles.map((o) => (
            <Badge key={o.id} variant="secondary" className="text-xs gap-1 pr-1">
              {o.label || TYPE_LABELS[o.type]} ({o.length}×{o.width}×{o.height}m)
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => removeObstacle(o.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      {obstacles.length === 0 && (
        <p className="text-xs text-muted-foreground">No obstacles added. Panels will fill entire usable area.</p>
      )}
    </Card>
  );
}
