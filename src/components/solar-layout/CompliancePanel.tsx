import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck, Flame } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";

export function CompliancePanel() {
  const { compliance, projectCategory, fireComplianceRequired } = useSolarLayout();

  const isCommercial = projectCategory === "commercial" || projectCategory === "industrial";

  if (!isCommercial && !fireComplianceRequired) return null;

  const checks = [
    { label: "Perimeter Walkway (≥0.6m)", ok: compliance.perimeterWalkway },
    { label: "Central Access (≥1.0m)", ok: compliance.centralAccess },
    { label: "Stair Clearance", ok: compliance.stairClearance },
  ];

  return (
    <Card className="p-4 space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" /> Compliance Check
      </h3>
      <div className="flex flex-wrap gap-2">
        {checks.map((c, i) => (
          <Badge key={i} variant={c.ok ? "default" : "destructive"} className="text-xs gap-1">
            {c.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {c.label}
          </Badge>
        ))}
        <Badge variant={compliance.fireSafe ? "default" : "destructive"} className="text-xs gap-1">
          <Flame className="h-3 w-3" />
          {compliance.fireSafe ? "Fire Safe ✔" : "Non Compliant ❌"}
        </Badge>
      </div>
    </Card>
  );
}
