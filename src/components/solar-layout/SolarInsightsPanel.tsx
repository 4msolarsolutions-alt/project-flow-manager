import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sun, Zap, TrendingUp, DollarSign, Leaf, BarChart3, Building2, Layers } from "lucide-react";
import type { BuildingInsights } from "@/hooks/useSolarAPI";

interface SolarInsightsPanelProps {
  data: BuildingInsights | null;
  loading: boolean;
  error: string | null;
  onFetch: () => void;
}

function formatCurrency(val: { currencyCode?: string; units?: string } | undefined): string {
  if (!val?.units) return "N/A";
  const num = parseInt(val.units, 10);
  if (val.currencyCode === "INR") return `₹${(num / 100000).toFixed(1)}L`;
  if (val.currencyCode === "USD") return `$${num.toLocaleString()}`;
  return `${val.currencyCode || ""} ${num.toLocaleString()}`;
}

export function SolarInsightsPanel({ data, loading, error, onFetch }: SolarInsightsPanelProps) {
  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
        <span className="text-sm text-muted-foreground">Fetching Google Solar data...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={onFetch}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Click to fetch Google Solar building insights for this location</span>
          </div>
          <Button size="sm" onClick={onFetch}>
            <Sun className="mr-2 h-4 w-4" /> Fetch Solar Data
          </Button>
        </div>
      </Card>
    );
  }

  const sp = data.solarPotential;
  const bestConfig = sp.solarPanelConfigs?.[sp.solarPanelConfigs.length - 1];
  const bestFinancial = sp.financialAnalyses?.[sp.financialAnalyses.length - 1];
  const roofSegments = sp.roofSegmentStats || [];
  const yearlyEnergy = bestConfig?.yearlyEnergyDcKwh || 0;
  const maxPanels = sp.maxArrayPanelsCount || 0;
  const maxArea = sp.maxArrayAreaMeters2 || 0;
  const sunshineHours = sp.maxSunshineHoursPerYear || 0;
  const co2Factor = sp.carbonOffsetFactorKgPerMwh || 0;
  const annualCO2Offset = (yearlyEnergy / 1000) * co2Factor;
  const panelCapacity = sp.panelCapacityWatts || 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-sm">Google Solar Insights</h3>
            <Badge variant="secondary" className="text-xs">
              {data.imageryQuality || "HIGH"}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={onFetch}>
            <Sun className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={<Layers className="h-4 w-4 text-primary" />} label="Max Panels" value={maxPanels.toString()} sub={`${panelCapacity}W each`} />
          <MetricCard icon={<Zap className="h-4 w-4 text-amber-500" />} label="Max Capacity" value={`${((maxPanels * panelCapacity) / 1000).toFixed(1)} kW`} sub={`${maxArea.toFixed(0)} m² area`} />
          <MetricCard icon={<Sun className="h-4 w-4 text-orange-500" />} label="Sunshine" value={`${sunshineHours.toFixed(0)} hrs/yr`} sub="Peak sun hours" />
          <MetricCard icon={<Leaf className="h-4 w-4 text-green-500" />} label="CO₂ Offset" value={`${(annualCO2Offset / 1000).toFixed(1)} T/yr`} sub="Carbon reduction" />
        </div>
      </Card>

      {/* Roof Segments */}
      {roofSegments.length > 0 && (
        <Card className="p-3">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
            <Building2 className="h-3.5 w-3.5" /> Roof Segments ({roofSegments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roofSegments.slice(0, 4).map((seg, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                <div>
                  <span className="font-medium">Segment {i + 1}</span>
                  <span className="text-muted-foreground ml-2">
                    {seg.stats.areaMeters2.toFixed(0)}m² · {seg.pitchDegrees.toFixed(0)}° pitch · {seg.azimuthDegrees.toFixed(0)}° azimuth
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {seg.panelsCount} panels
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Financial Analysis */}
      {bestFinancial && (
        <Card className="p-3">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5" /> Financial Analysis
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              icon={<Zap className="h-4 w-4 text-primary" />}
              label="Annual Energy"
              value={`${(bestFinancial.financialDetails.initialAcKwhPerYear / 1000).toFixed(1)} MWh`}
              sub={`${(bestFinancial.financialDetails.solarPercentage * 100).toFixed(0)}% solar`}
            />
            {bestFinancial.cashPurchaseSavings && (
              <>
                <MetricCard
                  icon={<DollarSign className="h-4 w-4 text-green-500" />}
                  label="Upfront Cost"
                  value={formatCurrency(bestFinancial.cashPurchaseSavings.outOfPocketCost)}
                  sub={`Payback: ${bestFinancial.cashPurchaseSavings.paybackYears?.toFixed(1) || "N/A"} yrs`}
                />
                <MetricCard
                  icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                  label="20yr Savings"
                  value={formatCurrency(bestFinancial.cashPurchaseSavings.savings?.savingsYear20)}
                  sub={`Year 1: ${formatCurrency(bestFinancial.cashPurchaseSavings.savings?.savingsYear1)}`}
                />
                <MetricCard
                  icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
                  label="Lifetime Savings"
                  value={formatCurrency(bestFinancial.cashPurchaseSavings.savings?.savingsLifetime)}
                  sub="Total panel lifetime"
                />
              </>
            )}
            {!bestFinancial.cashPurchaseSavings && (
              <>
                <MetricCard
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                  label="Electricity Cost"
                  value={formatCurrency(bestFinancial.financialDetails.costOfElectricityWithoutSolar)}
                  sub="Without solar"
                />
                <MetricCard
                  icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                  label="Grid Export"
                  value={`${(bestFinancial.financialDetails.percentageExportedToGrid * 100).toFixed(0)}%`}
                  sub="Exported to grid"
                />
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30 text-center">
      {icon}
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </div>
  );
}
