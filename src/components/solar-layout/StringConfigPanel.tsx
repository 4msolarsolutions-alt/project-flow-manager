import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, AlertTriangle, CheckCircle, Settings2, Thermometer, Cable } from "lucide-react";
import {
  INVERTER_DATABASE, type InverterModel,
  estimatePanelElectricals, calculateStringConfig, calculateSystemConfig, autoSelectInverter,
  type StringConfig, type PanelElectricalData,
} from "@/utils/stringCalculations";
import { useSolarLayout } from "@/components/solar-layout/SolarLayoutContext";

export function StringConfigPanel() {
  const { selectedPanel, panels, stats, latitude } = useSolarLayout();
  const totalPanels = panels.length;
  const panelWattage = selectedPanel.watt;

  // Inverter selection
  const [inverterMode, setInverterMode] = useState<"auto" | "select" | "custom">("auto");
  const [selectedInverterId, setSelectedInverterId] = useState<string>("");
  const [customInverter, setCustomInverter] = useState<Partial<InverterModel>>({
    brand: "Custom", model: "Custom Inverter", ratedPowerKW: 10, mpptCount: 2,
    stringsPerMPPT: 2, mpptVoltageMin: 200, mpptVoltageMax: 850, maxInputVoltage: 1000,
    maxInputCurrent: 15, maxShortCircuitCurrent: 20, outputVoltage: 400, efficiency: 98, type: "string",
  });

  // Temperature settings
  const [ambientMin, setAmbientMin] = useState(0);
  const [ambientMax, setAmbientMax] = useState(45);

  // Panel electricals (editable overrides)
  const defaultElec = useMemo(() => estimatePanelElectricals(panelWattage), [panelWattage]);
  const [panelElec, setPanelElec] = useState<PanelElectricalData>(defaultElec);

  // Sync when panel wattage changes
  useMemo(() => {
    const newElec = estimatePanelElectricals(panelWattage);
    setPanelElec(newElec);
  }, [panelWattage]);

  // Resolve inverter
  const activeInverter: InverterModel | null = useMemo(() => {
    if (inverterMode === "auto") return autoSelectInverter(stats.totalCapacityKW);
    if (inverterMode === "select") return INVERTER_DATABASE.find(i => i.id === selectedInverterId) || null;
    if (inverterMode === "custom") return { id: "custom", ...customInverter } as InverterModel;
    return null;
  }, [inverterMode, selectedInverterId, customInverter, stats.totalCapacityKW]);

  // Calculate string configuration
  const systemConfig = useMemo(() => {
    if (!activeInverter || totalPanels <= 0) return null;
    return calculateSystemConfig(totalPanels, panelWattage, activeInverter, panelElec, ambientMin, ambientMax);
  }, [activeInverter, totalPanels, panelWattage, panelElec, ambientMin, ambientMax]);

  const stringConfig = systemConfig?.inverters[0]?.stringConfig || null;

  if (totalPanels === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No panels placed yet</p>
        <p className="text-sm mt-1">Draw a roof and place panels first, then configure strings here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inverter Selection */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">Inverter Selection</Label>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["auto", "select", "custom"] as const).map(mode => (
            <Button
              key={mode}
              size="sm"
              variant={inverterMode === mode ? "default" : "outline"}
              onClick={() => setInverterMode(mode)}
              className="capitalize"
            >
              {mode === "auto" ? "Auto-Select" : mode === "select" ? "Choose Model" : "Custom Input"}
            </Button>
          ))}
        </div>

        {inverterMode === "select" && (
          <Select value={selectedInverterId} onValueChange={setSelectedInverterId}>
            <SelectTrigger><SelectValue placeholder="Select inverter model..." /></SelectTrigger>
            <SelectContent>
              {INVERTER_DATABASE.map(inv => (
                <SelectItem key={inv.id} value={inv.id}>
                  {inv.brand} {inv.model} — {inv.ratedPowerKW}kW ({inv.mpptCount} MPPT)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {inverterMode === "custom" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: "ratedPowerKW", label: "Rated Power (kW)", step: 0.5 },
              { key: "mpptCount", label: "MPPT Count", step: 1 },
              { key: "stringsPerMPPT", label: "Strings/MPPT", step: 1 },
              { key: "mpptVoltageMin", label: "MPPT Min (V)", step: 10 },
              { key: "mpptVoltageMax", label: "MPPT Max (V)", step: 10 },
              { key: "maxInputVoltage", label: "Max Vdc (V)", step: 10 },
              { key: "maxInputCurrent", label: "Max Idc (A)", step: 0.5 },
              { key: "maxShortCircuitCurrent", label: "Max Isc (A)", step: 0.5 },
            ] as const).map(({ key, label, step }) => (
              <div key={key} className="flex flex-col gap-1">
                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                <input
                  type="number"
                  step={step}
                  value={(customInverter as any)[key] || ""}
                  onChange={e => setCustomInverter(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
        )}

        {activeInverter && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-normal">
              {activeInverter.brand} {activeInverter.model}
            </Badge>
            <Badge variant="outline" className="font-normal">{activeInverter.ratedPowerKW}kW</Badge>
            <Badge variant="outline" className="font-normal">{activeInverter.mpptCount} MPPT</Badge>
            <Badge variant="outline" className="font-normal">{activeInverter.stringsPerMPPT} str/MPPT</Badge>
            <Badge variant="outline" className="font-normal">{activeInverter.mpptVoltageMin}–{activeInverter.mpptVoltageMax}V MPPT</Badge>
            <Badge variant="outline" className="font-normal">Max {activeInverter.maxInputVoltage}Vdc</Badge>
          </div>
        )}
      </Card>

      {/* Temperature & Panel Electricals */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-orange-500" />
          <Label className="text-sm font-semibold">Temperature & Panel Electricals</Label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Min Ambient (°C)</Label>
            <input type="number" value={ambientMin} onChange={e => setAmbientMin(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Max Ambient (°C)</Label>
            <input type="number" value={ambientMax} onChange={e => setAmbientMax(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Voc (V)</Label>
            <input type="number" step={0.1} value={panelElec.voc}
              onChange={e => setPanelElec(prev => ({ ...prev, voc: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Vmp (V)</Label>
            <input type="number" step={0.1} value={panelElec.vmp}
              onChange={e => setPanelElec(prev => ({ ...prev, vmp: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Isc (A)</Label>
            <input type="number" step={0.1} value={panelElec.isc}
              onChange={e => setPanelElec(prev => ({ ...prev, isc: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Imp (A)</Label>
            <input type="number" step={0.1} value={panelElec.imp}
              onChange={e => setPanelElec(prev => ({ ...prev, imp: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Temp Coeff Voc (%/°C)</Label>
            <input type="number" step={0.01} value={panelElec.tempCoeffVoc}
              onChange={e => setPanelElec(prev => ({ ...prev, tempCoeffVoc: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">Temp Coeff Pmax (%/°C)</Label>
            <input type="number" step={0.01} value={panelElec.tempCoeffPmax}
              onChange={e => setPanelElec(prev => ({ ...prev, tempCoeffPmax: Number(e.target.value) }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        </div>
      </Card>

      {/* String Configuration Results */}
      {stringConfig && systemConfig && activeInverter && (
        <>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Cable className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">String Configuration Results</Label>
              {stringConfig.isValid ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Valid</Badge>
              ) : (
                <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Issues Found</Badge>
              )}
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricBox label="Panels per String" value={stringConfig.recommendedPanelsPerString} unit="" />
              <MetricBox label="Total Strings" value={stringConfig.totalStrings} unit="" />
              <MetricBox label="Strings per MPPT" value={stringConfig.stringsPerMPPT} unit="" />
              <MetricBox label="Inverter Count" value={systemConfig.inverters[0].count} unit={`× ${activeInverter.ratedPowerKW}kW`} />
              <MetricBox label="String Voc (Cold)" value={stringConfig.stringVocMax.toFixed(1)} unit="V" highlight={stringConfig.stringVocMax > activeInverter.maxInputVoltage} />
              <MetricBox label="String Vmp (Hot)" value={stringConfig.stringVmpMin.toFixed(1)} unit="V" highlight={stringConfig.stringVmpMin < activeInverter.mpptVoltageMin} />
              <MetricBox label="String Vmp (STC)" value={stringConfig.stringVmpNominal.toFixed(1)} unit="V" />
              <MetricBox label="String Isc" value={stringConfig.stringIsc.toFixed(1)} unit="A" />
              <MetricBox label="DC/AC Ratio" value={systemConfig.dcAcRatio.toFixed(2)} unit="" highlight={systemConfig.dcAcRatio > 1.4} />
              <MetricBox label="Voltage Margin (High)" value={stringConfig.voltageMarginHigh.toFixed(1)} unit="%" highlight={stringConfig.voltageMarginHigh < 5} />
              <MetricBox label="MPPT Margin" value={stringConfig.voltageMarginMPPT.toFixed(1)} unit="%" />
              <MetricBox label="Current Margin" value={stringConfig.currentMargin.toFixed(1)} unit="%" />
            </div>

            {/* Warnings */}
            {stringConfig.warnings.length > 0 && (
              <div className="space-y-1.5">
                {stringConfig.warnings.map((w, i) => (
                  <div key={i} className={`text-xs px-3 py-2 rounded-md ${w.includes("⚠️") ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {w}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Visual String Diagram */}
          <Card className="p-4 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> String Diagram
            </Label>
            <StringDiagramSVG
              config={stringConfig}
              systemConfig={systemConfig}
              inverter={activeInverter}
              panelWattage={panelWattage}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function MetricBox({ label, value, unit, highlight }: { label: string; value: string | number; unit: string; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg border ${highlight ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"}`}>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      <div className={`text-lg font-bold leading-tight ${highlight ? "text-destructive" : ""}`}>
        {value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

// ========== SVG String Diagram ==========
function StringDiagramSVG({
  config, systemConfig, inverter, panelWattage,
}: {
  config: StringConfig;
  systemConfig: import("@/utils/stringCalculations").SystemStringConfig;
  inverter: InverterModel;
  panelWattage: number;
}) {
  const invCount = systemConfig.inverters[0].count;
  const panelsPerString = config.recommendedPanelsPerString;
  const totalStrings = config.totalStrings;
  const stringsPerMPPT = config.stringsPerMPPT;

  // Layout dimensions
  const panelW = 40, panelH = 20, panelGap = 4;
  const stringGap = 10;
  const mpptGap = 30;
  const blockX = 30; // left margin
  const maxPanelsShown = Math.min(panelsPerString, 8); // Show up to 8 per string
  const showEllipsis = panelsPerString > maxPanelsShown;

  const stringWidth = maxPanelsShown * (panelW + panelGap) + (showEllipsis ? 50 : 0);
  const dcdBlockW = 60, invBlockW = 70, acdBlockW = 60;

  const totalWidth = blockX + stringWidth + 40 + dcdBlockW + 30 + invBlockW + 30 + acdBlockW + 50;
  const rowsPerInverter = Math.min(totalStrings, inverter.mpptCount * stringsPerMPPT);
  const totalHeight = Math.max(200, invCount * (rowsPerInverter * (panelH + stringGap) + mpptGap) + 80);

  let yOffset = 40;

  return (
    <div className="overflow-x-auto">
      <svg width={totalWidth} height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="min-w-[600px]">
        {/* Title */}
        <text x={totalWidth / 2} y={20} textAnchor="middle" className="fill-foreground text-xs font-semibold">
          String Configuration — {panelWattage}Wp × {config.totalStrings * panelsPerString} panels → {invCount}× {inverter.model}
        </text>

        {Array.from({ length: invCount }).map((_, invIdx) => {
          const invY = yOffset;
          const stringsForInv = Math.min(rowsPerInverter, totalStrings - invIdx * rowsPerInverter);
          const invHeight = stringsForInv * (panelH + stringGap) + 10;

          const rows = Array.from({ length: stringsForInv }).map((_, sIdx) => {
            const sy = invY + sIdx * (panelH + stringGap);
            const mpptIdx = Math.floor(sIdx / stringsPerMPPT) + 1;

            return (
              <g key={sIdx}>
                {/* MPPT label */}
                <text x={blockX - 5} y={sy + panelH / 2 + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: "8px" }}>
                  M{mpptIdx}/S{(sIdx % stringsPerMPPT) + 1}
                </text>

                {/* Panel rectangles */}
                {Array.from({ length: maxPanelsShown }).map((_, pIdx) => (
                  <g key={pIdx}>
                    <rect
                      x={blockX + pIdx * (panelW + panelGap)}
                      y={sy}
                      width={panelW}
                      height={panelH}
                      rx={3}
                      className="fill-primary/20 stroke-primary"
                      strokeWidth={1}
                    />
                    <text
                      x={blockX + pIdx * (panelW + panelGap) + panelW / 2}
                      y={sy + panelH / 2 + 3}
                      textAnchor="middle"
                      className="fill-foreground"
                      style={{ fontSize: "7px" }}
                    >
                      P{pIdx + 1}
                    </text>
                  </g>
                ))}

                {/* Ellipsis if needed */}
                {showEllipsis && (
                  <text
                    x={blockX + maxPanelsShown * (panelW + panelGap) + 15}
                    y={sy + panelH / 2 + 4}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: "10px" }}
                  >
                    ... ×{panelsPerString}
                  </text>
                )}

                {/* Connection line to DCDB */}
                <line
                  x1={blockX + stringWidth}
                  y1={sy + panelH / 2}
                  x2={blockX + stringWidth + 40}
                  y2={sy + panelH / 2}
                  className="stroke-muted-foreground"
                  strokeWidth={1}
                  strokeDasharray="4,2"
                />
              </g>
            );
          });

          const dcdX = blockX + stringWidth + 40;
          const invX = dcdX + dcdBlockW + 30;
          const acdX = invX + invBlockW + 30;

          yOffset += invHeight + mpptGap;

          return (
            <g key={invIdx}>
              {rows}

              {/* DCDB */}
              <rect x={dcdX} y={invY} width={dcdBlockW} height={invHeight} rx={6} className="fill-orange-500/10 stroke-orange-500" strokeWidth={1.5} />
              <text x={dcdX + dcdBlockW / 2} y={invY + invHeight / 2 - 4} textAnchor="middle" className="fill-orange-600" style={{ fontSize: "9px", fontWeight: 600 }}>DCDB</text>
              <text x={dcdX + dcdBlockW / 2} y={invY + invHeight / 2 + 8} textAnchor="middle" className="fill-orange-500/70" style={{ fontSize: "7px" }}>{stringsForInv} str</text>

              {/* Line DCDB → Inverter */}
              <line x1={dcdX + dcdBlockW} y1={invY + invHeight / 2} x2={invX} y2={invY + invHeight / 2} className="stroke-primary" strokeWidth={2} />

              {/* Inverter */}
              <rect x={invX} y={invY} width={invBlockW} height={invHeight} rx={6} className="fill-primary/10 stroke-primary" strokeWidth={2} />
              <text x={invX + invBlockW / 2} y={invY + invHeight / 2 - 8} textAnchor="middle" className="fill-primary" style={{ fontSize: "9px", fontWeight: 700 }}>Inverter</text>
              <text x={invX + invBlockW / 2} y={invY + invHeight / 2 + 4} textAnchor="middle" className="fill-primary/70" style={{ fontSize: "7px" }}>{inverter.model}</text>
              <text x={invX + invBlockW / 2} y={invY + invHeight / 2 + 14} textAnchor="middle" className="fill-primary/50" style={{ fontSize: "7px" }}>{inverter.ratedPowerKW}kW</text>

              {/* Line Inverter → ACDB */}
              <line x1={invX + invBlockW} y1={invY + invHeight / 2} x2={acdX} y2={invY + invHeight / 2} className="stroke-green-500" strokeWidth={2} />

              {/* ACDB */}
              <rect x={acdX} y={invY + invHeight / 4} width={acdBlockW} height={invHeight / 2} rx={6} className="fill-green-500/10 stroke-green-500" strokeWidth={1.5} />
              <text x={acdX + acdBlockW / 2} y={invY + invHeight / 2} textAnchor="middle" className="fill-green-600" style={{ fontSize: "9px", fontWeight: 600 }}>ACDB</text>
              <text x={acdX + acdBlockW / 2} y={invY + invHeight / 2 + 10} textAnchor="middle" className="fill-green-500/60" style={{ fontSize: "7px" }}>{inverter.outputVoltage}V</text>
            </g>
          );
        })}

        {/* Grid connection label */}
        <text x={totalWidth - 20} y={yOffset - 20} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: "10px" }}>→ Grid / Net Meter</text>
      </svg>
    </div>
  );
}
