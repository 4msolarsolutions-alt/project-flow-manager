import { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import { useState } from "react";

interface EarthingCalc {
  earthPitCount: number;
  earthResistanceTarget: number;
  conductorSize: string;
  laRequired: boolean;
  laType: string;
  downConductorCount: number;
  downConductorSize: string;
  equipmentEarthConductor: string;
  structureEarthConductor: string;
}

function calculateEarthing(capacityKW: number, roofAreaM2: number, buildingHeight: number, soilResistivity: number): EarthingCalc {
  // Earth pits: 1 per 10kW + 1 for LA + 1 for body
  const pitCountPower = Math.max(2, Math.ceil(capacityKW / 10));
  const pitCountLA = buildingHeight > 15 ? 2 : 1;
  const earthPitCount = pitCountPower + pitCountLA + 1; // +1 for body earth

  // Earth resistance target based on IS 3043
  const earthResistanceTarget = capacityKW > 50 ? 1 : capacityKW > 10 ? 2 : 5;

  // Conductor sizing based on capacity
  let conductorSize = "25 × 3 mm GI Strip";
  if (capacityKW > 100) conductorSize = "50 × 6 mm GI Strip";
  else if (capacityKW > 50) conductorSize = "40 × 5 mm GI Strip";
  else if (capacityKW > 25) conductorSize = "32 × 6 mm GI Strip";

  // LA sizing based on building height and area
  const laRequired = buildingHeight > 10 || roofAreaM2 > 200;
  const laType = roofAreaM2 > 1000 ? "ESE Lightning Arrestor" : "Conventional LA (Franklin Rod)";

  // Down conductors
  const perimeterM = Math.sqrt(roofAreaM2) * 4;
  const downConductorCount = Math.max(2, Math.ceil(perimeterM / 20));
  const downConductorSize = capacityKW > 50 ? "8 mm dia GI Wire" : "6 mm dia GI Wire";

  // Equipment earthing
  const equipmentEarthConductor = capacityKW > 50 ? "10 SWG GI Wire" : "8 SWG GI Wire";
  const structureEarthConductor = capacityKW > 25 ? "25 × 3 mm GI Strip" : "25 × 3 mm GI Strip";

  return {
    earthPitCount, earthResistanceTarget, conductorSize, laRequired, laType,
    downConductorCount, downConductorSize, equipmentEarthConductor, structureEarthConductor,
  };
}

export function EarthingLAPanel() {
  const { stats, panels, roofAreaM2 } = useSolarLayout();
  const svgRef = useRef<SVGSVGElement>(null);
  const [buildingHeight, setBuildingHeight] = useState(10);
  const [soilResistivity, setSoilResistivity] = useState(100);
  const [earthingType, setEarthingType] = useState<"chemical" | "pipe" | "plate">("chemical");

  const capacityKW = stats.totalCapacityKW;

  const calc = useMemo(
    () => calculateEarthing(capacityKW, roofAreaM2, buildingHeight, soilResistivity),
    [capacityKW, roofAreaM2, buildingHeight, soilResistivity]
  );

  const svgWidth = 900;
  const svgHeight = 600;

  const handleExportPDF = async () => {
    if (!svgRef.current) return;
    const { default: jsPDF } = await import("jspdf");
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
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
      pdf.save(`Earthing_LA_${capacityKW.toFixed(1)}kW.pdf`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-4">
      {/* Input Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🔧 Earthing & LA Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Building Height (m)</Label>
              <Input type="number" value={buildingHeight} onChange={e => setBuildingHeight(Number(e.target.value))} min={3} max={100} />
            </div>
            <div>
              <Label className="text-xs">Soil Resistivity (Ω·m)</Label>
              <Input type="number" value={soilResistivity} onChange={e => setSoilResistivity(Number(e.target.value))} min={10} max={1000} />
            </div>
            <div>
              <Label className="text-xs">Earthing Type</Label>
              <Select value={earthingType} onValueChange={(v: any) => setEarthingType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chemical">Chemical Earthing</SelectItem>
                  <SelectItem value="pipe">Pipe Earthing</SelectItem>
                  <SelectItem value="plate">Plate Earthing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Earthing Calculations
            <Badge variant="outline">{capacityKW.toFixed(1)} kWp</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Earth Pits Required</p>
              <p className="text-xl font-bold text-foreground">{calc.earthPitCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Target Resistance</p>
              <p className="text-xl font-bold text-foreground">≤ {calc.earthResistanceTarget}Ω</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">Down Conductors</p>
              <p className="text-xl font-bold text-foreground">{calc.downConductorCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground text-xs">LA Required</p>
              <p className="text-xl font-bold text-foreground">{calc.laRequired ? "Yes" : "No"}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>• Earth Conductor: <span className="font-medium text-foreground">{calc.conductorSize}</span></p>
            <p>• LA Type: <span className="font-medium text-foreground">{calc.laType}</span></p>
            <p>• Down Conductor: <span className="font-medium text-foreground">{calc.downConductorSize}</span></p>
            <p>• Equipment Earth: <span className="font-medium text-foreground">{calc.equipmentEarthConductor}</span></p>
            <p>• Structure Earth: <span className="font-medium text-foreground">{calc.structureEarthConductor}</span></p>
            <p>• Earthing Type: <span className="font-medium text-foreground capitalize">{earthingType}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* SVG Diagram */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">⚡ Earthing & Lightning Protection Diagram</CardTitle>
            <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={panels.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {panels.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Place panels first to generate earthing diagram.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-card">
              <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} className="min-w-[700px]">
                <defs>
                  <linearGradient id="earthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--card))" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" />
                  </linearGradient>
                  <pattern id="groundHatch" patternUnits="userSpaceOnUse" width="8" height="8">
                    <line x1="0" y1="8" x2="8" y2="0" stroke="hsl(30, 60%, 40%)" strokeWidth="1" />
                  </pattern>
                </defs>

                <rect width={svgWidth} height={svgHeight} fill="url(#earthGrad)" rx={12} />

                {/* Title */}
                <text x={svgWidth / 2} y={28} textAnchor="middle" fontSize={15} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">
                  EARTHING & LIGHTNING PROTECTION — {capacityKW.toFixed(1)} kWp SYSTEM
                </text>

                {/* Building cross-section */}
                <rect x={200} y={100} width={500} height={250} rx={4} fill="none" stroke="hsl(var(--border))" strokeWidth={2} strokeDasharray="6,3" />
                <text x={450} y={118} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                  Building ({buildingHeight}m height)
                </text>

                {/* Roof / PV Panels */}
                <rect x={220} y={100} width={460} height={20} rx={3} fill="hsl(210, 80%, 50%)" opacity={0.8} />
                <text x={450} y={114} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold" fontFamily="system-ui">
                  Solar PV Array ({panels.length} panels)
                </text>

                {/* Lightning Arrestor */}
                {calc.laRequired && (
                  <g transform="translate(440, 50)">
                    <line x1={10} y1={50} x2={10} y2={10} stroke="hsl(45, 90%, 50%)" strokeWidth={3} />
                    <polygon points="0,10 10,0 20,10" fill="hsl(45, 90%, 50%)" />
                    <text x={10} y={-5} textAnchor="middle" fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">LA</text>
                    <text x={30} y={15} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">{calc.laType.split(" ")[0]}</text>
                  </g>
                )}

                {/* Down conductors */}
                {Array.from({ length: Math.min(calc.downConductorCount, 4) }).map((_, i) => {
                  const x = 220 + i * (460 / Math.min(calc.downConductorCount, 4));
                  return (
                    <g key={`dc-${i}`}>
                      <line x1={x + 10} y1={120} x2={x + 10} y2={380} stroke="hsl(120, 50%, 40%)" strokeWidth={2} strokeDasharray="4,2" />
                      <text x={x + 16} y={250} fontSize={7} fill="hsl(120, 50%, 40%)" fontFamily="system-ui" transform={`rotate(-90, ${x + 16}, 250)`}>
                        Down Conductor {i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Ground level */}
                <rect x={100} y={380} width={700} height={20} fill="url(#groundHatch)" />
                <line x1={100} y1={380} x2={800} y2={380} stroke="hsl(30, 60%, 40%)" strokeWidth={2} />
                <text x={450} y={395} textAnchor="middle" fontSize={9} fill="hsl(30, 60%, 30%)" fontWeight="bold" fontFamily="system-ui">GROUND LEVEL</text>

                {/* Earth pits */}
                {Array.from({ length: Math.min(calc.earthPitCount, 6) }).map((_, i) => {
                  const x = 150 + i * (600 / Math.min(calc.earthPitCount, 6));
                  const pitType = i === 0 ? "LA Earth" : i === 1 ? "Body Earth" : `Power Earth ${i - 1}`;
                  return (
                    <g key={`pit-${i}`}>
                      {/* Pit symbol */}
                      <rect x={x} y={400} width={40} height={60} rx={4} fill="hsl(30, 50%, 55%)" stroke="hsl(30, 60%, 40%)" strokeWidth={1.5} />
                      <line x1={x + 10} y1={410} x2={x + 30} y2={410} stroke="white" strokeWidth={1} />
                      <line x1={x + 14} y1={418} x2={x + 26} y2={418} stroke="white" strokeWidth={1} />
                      <line x1={x + 18} y1={426} x2={x + 22} y2={426} stroke="white" strokeWidth={1} />
                      {/* Electrode symbol */}
                      <line x1={x + 20} y1={430} x2={x + 20} y2={455} stroke="hsl(0, 0%, 60%)" strokeWidth={3} />
                      {/* Label */}
                      <text x={x + 20} y={478} textAnchor="middle" fontSize={7} fill="hsl(var(--foreground))" fontFamily="system-ui">{pitType}</text>
                      <text x={x + 20} y={490} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                        {earthingType === "chemical" ? "Chemical" : earthingType === "pipe" ? "Pipe" : "Plate"}
                      </text>
                      {/* Connection to conductor */}
                      <line x1={x + 20} y1={380} x2={x + 20} y2={400} stroke="hsl(120, 50%, 40%)" strokeWidth={2} />
                    </g>
                  );
                })}

                {/* Equipment earthing connections */}
                <g transform="translate(720, 140)">
                  <rect width={150} height={180} rx={6} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
                  <text x={75} y={18} textAnchor="middle" fontSize={10} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">Earthing Schedule</text>
                  <line x1={10} y1={24} x2={140} y2={24} stroke="hsl(var(--border))" strokeWidth={0.5} />
                  {[
                    ["Inverter Body", "✓"],
                    ["ACDB Body", "✓"],
                    ["DCDB Body", "✓"],
                    ["Panel Frame", "✓"],
                    ["Structure", "✓"],
                    ["LA System", calc.laRequired ? "✓" : "—"],
                    [`Pits: ${calc.earthPitCount}`, ""],
                    [`Target: ≤${calc.earthResistanceTarget}Ω`, ""],
                  ].map(([label, status], i) => (
                    <g key={i}>
                      <text x={12} y={40 + i * 18} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">{label}</text>
                      <text x={130} y={40 + i * 18} textAnchor="end" fontSize={9} fill="hsl(120, 60%, 40%)" fontWeight="bold" fontFamily="system-ui">{status}</text>
                    </g>
                  ))}
                </g>

                {/* Conductor sizing note */}
                <g transform={`translate(20, ${svgHeight - 50})`}>
                  <text x={0} y={0} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Earth Conductor: {calc.conductorSize} | Down Conductor: {calc.downConductorSize} | Per IS 3043 & IEC 62305
                  </text>
                  <text x={0} y={14} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Soil Resistivity: {soilResistivity} Ω·m | Earthing Type: {earthingType} | Earth Resistance Target: ≤{calc.earthResistanceTarget}Ω
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
