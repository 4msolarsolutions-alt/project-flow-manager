import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Zap, Battery, BarChart3, Ruler, AreaChart, Weight, IndianRupee, AlertTriangle, Wind, Rows3, CheckCircle2, XCircle } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import { getWindLoadWarning } from "@/utils/solarCalculations";

export function StatsPanel() {
  const { stats, selectedPanel, tiltAngle, roofAreaM2, usableAreaM2, windZone, rccDetails, roofType, targetCapacityKW, capacityExceedsRoof } = useSolarLayout();

  const windWarning = getWindLoadWarning(selectedPanel.length, windZone);

  const statItems = [
    { icon: Sun, color: "text-amber-500", label: `${selectedPanel.watt}Wp ${selectedPanel.cellType}`, value: stats.totalPanels },
    { icon: Zap, color: "text-primary", label: `Capacity (η ${selectedPanel.efficiency}%)`, value: `${stats.totalCapacityKW.toFixed(2)} kWp` },
    { icon: Ruler, color: "text-cyan-500", label: "Roof Area (m²)", value: roofAreaM2.toFixed(1) },
    { icon: AreaChart, color: "text-teal-500", label: "Usable Area (m²)", value: usableAreaM2.toFixed(1) },
    { icon: Rows3, color: "text-violet-500", label: "Row Spacing (m)", value: stats.rowSpacingM.toFixed(2) },
    { icon: BarChart3, color: "text-blue-500", label: `Daily kWh (${tiltAngle}°)`, value: stats.dailyEnergyKWh.toFixed(1) },
    { icon: BarChart3, color: "text-indigo-500", label: "Annual kWh", value: stats.annualEnergyKWh.toFixed(0) },
    { icon: Battery, color: "text-green-500", label: "Inverter", value: stats.inverterSuggestion },
    { icon: Weight, color: "text-orange-500", label: "Load (kg/m²)", value: stats.structuralLoadKgM2.toFixed(1) },
    { icon: AreaChart, color: "text-purple-500", label: "Roof Utilization", value: `${stats.roofUtilization.toFixed(1)}%` },
    { icon: IndianRupee, color: "text-green-600", label: "EPC Revenue", value: `₹${(stats.epcRevenue / 100000).toFixed(1)}L` },
    { icon: IndianRupee, color: "text-red-500", label: "Material Cost", value: `₹${(stats.materialCost / 100000).toFixed(1)}L` },
    { icon: IndianRupee, color: "text-emerald-600", label: "Gross Profit", value: `₹${(stats.grossProfit / 100000).toFixed(1)}L` },
  ];

  return (
    <div className="space-y-2">
      {/* Target capacity warning */}
      {capacityExceedsRoof && (
        <Card className="p-2.5 border-destructive bg-destructive/10 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-xs font-medium text-destructive">
            Target capacity ({targetCapacityKW} kW) exceeds usable rooftop area. Maximum panels placed.
          </span>
        </Card>
      )}

      {/* RCC structural status */}
      {roofType === "rcc" && rccDetails && (
        <Card className={`p-2.5 flex items-center gap-2 ${rccDetails.isSafe ? "border-green-400 bg-green-50 dark:bg-green-950/30" : "border-destructive bg-destructive/10"}`}>
          {rccDetails.isSafe ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className={`text-xs font-medium ${rccDetails.isSafe ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
            {rccDetails.isSafe ? "✅ Structurally Safe" : "❌ Structural limit exceeded for RCC roof"} — {rccDetails.totalLoad.toFixed(0)} kg total ({(rccDetails.totalLoad / (roofAreaM2 || 1)).toFixed(1)} kg/m²)
          </span>
        </Card>
      )}

      {windWarning && (
        <Card className="p-2.5 border-orange-400 bg-orange-50 dark:bg-orange-950/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">{windWarning}</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            <Wind className="h-3 w-3 mr-1" />{windZone}
          </Badge>
        </Card>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {statItems.map((item, i) => (
          <Card key={i} className="p-2.5 flex flex-col items-center gap-1 text-center">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-sm font-bold leading-tight">{item.value}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{item.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
