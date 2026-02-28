import { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import { autoSelectInverter, estimatePanelElectricals, calculateStringConfig } from "@/utils/stringCalculations";

// SLD Component types
interface SLDComponent {
  id: string;
  type: "pv_array" | "dc_isolator" | "dcdb" | "inverter" | "acdb" | "net_meter" | "transformer" | "grid";
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: string;
}

interface SLDConnection {
  from: string;
  to: string;
  type: "dc" | "ac";
  label?: string;
}

export function SLDGeneratorPanel() {
  const { stats, selectedPanel, panels, orientation, roofType } = useSolarLayout();
  const svgRef = useRef<SVGSVGElement>(null);

  const capacityKW = stats.totalCapacityKW;
  const inverter = autoSelectInverter(capacityKW);
  const panelElec = estimatePanelElectricals(selectedPanel.watt);
  const stringConfig = inverter ? calculateStringConfig(panels.length, selectedPanel.watt, inverter, panelElec) : null;

  const inverterCount = inverter ? Math.max(1, Math.ceil(capacityKW / (inverter.ratedPowerKW * 1.3))) : 1;
  const isHT = capacityKW > 100;

  // Generate SLD components
  const { components, connections } = useMemo(() => {
    const comps: SLDComponent[] = [];
    const conns: SLDConnection[] = [];
    const startX = 60;
    const yCenter = 200;
    let x = startX;
    const gap = 160;

    // PV Array
    comps.push({
      id: "pv_array", type: "pv_array", label: "PV Array",
      subLabel: `${panels.length} panels\n${capacityKW.toFixed(1)} kWp`,
      x, y: yCenter - 45, width: 120, height: 90, color: "hsl(210, 80%, 50%)", icon: "☀️"
    });

    // DC Isolator
    x += gap;
    comps.push({
      id: "dc_isolator", type: "dc_isolator", label: "DC Isolator",
      subLabel: `${stringConfig ? stringConfig.totalStrings : "—"} strings`,
      x, y: yCenter - 35, width: 100, height: 70, color: "hsl(45, 90%, 50%)", icon: "⚡"
    });
    conns.push({ from: "pv_array", to: "dc_isolator", type: "dc", label: "DC" });

    // DCDB
    x += gap;
    comps.push({
      id: "dcdb", type: "dcdb", label: "DCDB",
      subLabel: `${stringConfig ? stringConfig.totalStrings : "—"} inputs\nSPD + Fuse`,
      x, y: yCenter - 45, width: 110, height: 90, color: "hsl(30, 85%, 55%)", icon: "🔌"
    });
    conns.push({ from: "dc_isolator", to: "dcdb", type: "dc" });

    // Inverter(s)
    x += gap;
    comps.push({
      id: "inverter", type: "inverter", label: inverter ? `${inverter.brand} ${inverter.model}` : "Inverter",
      subLabel: `${inverterCount}× ${inverter?.ratedPowerKW || "—"} kW\n${inverter?.efficiency || "—"}% eff`,
      x, y: yCenter - 50, width: 130, height: 100, color: "hsl(150, 70%, 40%)", icon: "🔄"
    });
    conns.push({ from: "dcdb", to: "inverter", type: "dc", label: `DC ${stringConfig ? stringConfig.stringVocMax.toFixed(0) + "V" : ""}` });

    // ACDB
    x += gap;
    comps.push({
      id: "acdb", type: "acdb", label: "ACDB",
      subLabel: `MCB + SPD\nIsolator`,
      x, y: yCenter - 40, width: 100, height: 80, color: "hsl(280, 60%, 50%)", icon: "🛡️"
    });
    conns.push({ from: "inverter", to: "acdb", type: "ac", label: `AC ${inverter?.outputVoltage || 230}V` });

    // Net Meter
    x += gap;
    comps.push({
      id: "net_meter", type: "net_meter", label: "Net Meter",
      subLabel: `Bidirectional\nEnergy Meter`,
      x, y: yCenter - 35, width: 100, height: 70, color: "hsl(200, 70%, 45%)", icon: "📊"
    });
    conns.push({ from: "acdb", to: "net_meter", type: "ac" });

    // Transformer (if HT)
    if (isHT) {
      x += gap;
      comps.push({
        id: "transformer", type: "transformer", label: "Transformer",
        subLabel: `LT to HT\nStep-up`,
        x, y: yCenter - 40, width: 110, height: 80, color: "hsl(0, 60%, 50%)", icon: "🔧"
      });
      conns.push({ from: "net_meter", to: "transformer", type: "ac" });
    }

    // Grid
    x += gap;
    comps.push({
      id: "grid", type: "grid", label: "EB Grid",
      subLabel: `Utility\nConnection`,
      x, y: yCenter - 40, width: 100, height: 80, color: "hsl(120, 50%, 35%)", icon: "🏭"
    });
    conns.push({ from: isHT ? "transformer" : "net_meter", to: "grid", type: "ac", label: "Grid" });

    return { components: comps, connections: conns };
  }, [panels.length, capacityKW, inverter, inverterCount, stringConfig, isHT]);

  const svgWidth = Math.max(1200, components[components.length - 1]?.x + 160 || 1200);
  const svgHeight = 420;

  const handleExportPDF = async () => {
    if (!svgRef.current) return;
    const { default: jsPDF } = await import("jspdf");
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = svgWidth * 2;
    canvas.height = svgHeight * 2;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [svgWidth, svgHeight] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, svgWidth, svgHeight);
      pdf.save(`SLD_${capacityKW.toFixed(1)}kW.pdf`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const renderComponent = (comp: SLDComponent) => (
    <g key={comp.id} className="cursor-pointer" role="button" tabIndex={0}>
      {/* Shadow */}
      <rect x={comp.x + 3} y={comp.y + 3} width={comp.width} height={comp.height} rx={8} fill="hsl(var(--muted))" opacity={0.5} />
      {/* Body */}
      <rect x={comp.x} y={comp.y} width={comp.width} height={comp.height} rx={8} fill={comp.color} stroke="hsl(var(--border))" strokeWidth={2} />
      {/* Highlight */}
      <rect x={comp.x} y={comp.y} width={comp.width} height={comp.height / 3} rx={8} fill="white" opacity={0.15} />
      {/* Icon */}
      <text x={comp.x + comp.width / 2} y={comp.y + 22} textAnchor="middle" fontSize={18}>{comp.icon}</text>
      {/* Label */}
      <text x={comp.x + comp.width / 2} y={comp.y + 42} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold" fontFamily="system-ui">
        {comp.label.length > 18 ? comp.label.substring(0, 16) + "…" : comp.label}
      </text>
      {/* Sub label */}
      {comp.subLabel?.split("\n").map((line, i) => (
        <text key={i} x={comp.x + comp.width / 2} y={comp.y + 58 + i * 14} textAnchor="middle" fill="white" fontSize={9} opacity={0.9} fontFamily="system-ui">
          {line}
        </text>
      ))}
    </g>
  );

  const renderConnection = (conn: SLDConnection) => {
    const from = components.find(c => c.id === conn.from);
    const to = components.find(c => c.id === conn.to);
    if (!from || !to) return null;
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;
    const midX = (x1 + x2) / 2;

    return (
      <g key={`${conn.from}-${conn.to}`}>
        {/* Line */}
        <path
          d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
          fill="none"
          stroke={conn.type === "dc" ? "hsl(45, 90%, 50%)" : "hsl(210, 80%, 60%)"}
          strokeWidth={3}
          strokeDasharray={conn.type === "dc" ? "8,4" : "none"}
          markerEnd="url(#arrowhead)"
        />
        {/* Label */}
        {conn.label && (
          <g>
            <rect x={midX - 25} y={Math.min(y1, y2) - 22} width={50} height={18} rx={4} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={midX} y={Math.min(y1, y2) - 10} textAnchor="middle" fontSize={9} fill="hsl(var(--foreground))" fontWeight="bold" fontFamily="system-ui">
              {conn.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              ⚡ Single Line Diagram (SLD)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={panels.length > 0 ? "default" : "secondary"}>
                {capacityKW.toFixed(1)} kWp
              </Badge>
              <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={panels.length === 0}>
                <Download className="h-4 w-4 mr-1" /> Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {panels.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Place panels on the roof first to generate SLD.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-card">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                width="100%"
                height={svgHeight}
                className="min-w-[900px]"
              >
                {/* Defs */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--foreground))" opacity={0.6} />
                  </marker>
                  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--card))" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" />
                  </linearGradient>
                </defs>

                {/* Background */}
                <rect width={svgWidth} height={svgHeight} fill="url(#bgGrad)" rx={12} />

                {/* Title block */}
                <text x={svgWidth / 2} y={30} textAnchor="middle" fontSize={16} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">
                  SINGLE LINE DIAGRAM — {capacityKW.toFixed(1)} kWp SOLAR PV SYSTEM
                </text>
                <text x={svgWidth / 2} y={48} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                  {inverterCount}× {inverter?.brand} {inverter?.model} | {panels.length} Panels × {selectedPanel.watt}W | {isHT ? "HT" : "LT"} Connection
                </text>

                {/* Connection lines (render behind components) */}
                {connections.map(renderConnection)}

                {/* Components */}
                {components.map(renderComponent)}

                {/* Ground symbol */}
                <g transform={`translate(${components.find(c => c.id === "inverter")?.x || 500}, ${(components.find(c => c.id === "inverter")?.y || 150) + 110})`}>
                  <line x1={65} y1={0} x2={65} y2={20} stroke="hsl(var(--foreground))" strokeWidth={2} />
                  <line x1={45} y1={20} x2={85} y2={20} stroke="hsl(var(--foreground))" strokeWidth={2} />
                  <line x1={52} y1={26} x2={78} y2={26} stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                  <line x1={58} y1={32} x2={72} y2={32} stroke="hsl(var(--foreground))" strokeWidth={1} />
                  <text x={65} y={46} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Earth</text>
                </g>

                {/* Legend */}
                <g transform={`translate(20, ${svgHeight - 60})`}>
                  <text x={0} y={0} fontSize={10} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">Legend:</text>
                  <line x1={0} y1={14} x2={30} y2={14} stroke="hsl(45, 90%, 50%)" strokeWidth={3} strokeDasharray="8,4" />
                  <text x={35} y={18} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">DC Circuit</text>
                  <line x1={110} y1={14} x2={140} y2={14} stroke="hsl(210, 80%, 60%)" strokeWidth={3} />
                  <text x={145} y={18} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">AC Circuit</text>
                  <rect x={220} y={6} width={14} height={14} rx={3} fill="hsl(150, 70%, 40%)" />
                  <text x={240} y={18} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Active Component</text>
                </g>

                {/* System specs table */}
                <g transform={`translate(${svgWidth - 280}, ${svgHeight - 80})`}>
                  <rect width={260} height={65} rx={6} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
                  <text x={10} y={16} fontSize={10} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">System Specifications</text>
                  <text x={10} y={32} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    DC Capacity: {capacityKW.toFixed(2)} kWp | Strings: {stringConfig?.totalStrings || "—"}
                  </text>
                  <text x={10} y={46} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    String Voc: {stringConfig?.stringVocMax.toFixed(1) || "—"}V | Isc: {stringConfig?.stringIsc.toFixed(1) || "—"}A
                  </text>
                  <text x={10} y={60} fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    AC Output: {inverter?.outputVoltage || 230}V | DC/AC: {((capacityKW / (inverterCount * (inverter?.ratedPowerKW || 1)))).toFixed(2)}
                  </text>
                </g>
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
