import { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";

export function GADrawingPanel() {
  const {
    stats, panels, roofPath, safetyBoundary, obstacles, startPoint,
    hasPerimeterWalkway, perimeterWalkwayWidth, hasCentralWalkway, centralWalkwayWidth,
    orientation, selectedPanel, tiltAngle, latitude, longitude, roofAreaM2, usableAreaM2,
    roofType, windZone,
  } = useSolarLayout();
  const svgRef = useRef<SVGSVGElement>(null);

  const svgWidth = 900;
  const svgHeight = 700;

  // Convert lat/lng to SVG coordinates
  const { svgPanels, svgRoof, svgSafety, scale, offsetX, offsetY, svgObstacles } = useMemo(() => {
    if (roofPath.length < 3) return { svgPanels: [], svgRoof: [], svgSafety: [], scale: 1, offsetX: 0, offsetY: 0, svgObstacles: [] };

    const allLats = roofPath.map(p => p.lat);
    const allLngs = roofPath.map(p => p.lng);
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const cosLat = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const latRange = (maxLat - minLat) * 111320;
    const lngRange = (maxLng - minLng) * 111320 * cosLat;
    const maxRange = Math.max(latRange, lngRange, 1);

    const drawArea = 500;
    const sc = drawArea / maxRange;
    const ox = 200;
    const oy = 120;

    const toSVG = (lat: number, lng: number) => ({
      x: ox + (lng - minLng) * 111320 * cosLat * sc,
      y: oy + (maxLat - lat) * 111320 * sc,
    });

    const svgRf = roofPath.map(p => toSVG(p.lat, p.lng));
    const svgSf = safetyBoundary.map(p => toSVG(p.lat, p.lng));

    const svgPn = panels.map(p => {
      const tl = toSVG(p.north, p.west);
      const br = toSVG(p.south, p.east);
      return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
    });

    const svgObs = obstacles.map(o => {
      const cLat = latitude + o.position[2] / 111320;
      const cLng = longitude + o.position[0] / (111320 * cosLat);
      const pos = toSVG(cLat, cLng);
      return { ...pos, label: o.label || o.type, w: o.length * sc, h: o.width * sc };
    });

    return { svgPanels: svgPn, svgRoof: svgRf, svgSafety: svgSf, scale: sc, offsetX: ox, offsetY: oy, svgObstacles: svgObs };
  }, [roofPath, safetyBoundary, panels, obstacles, latitude, longitude]);

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
      pdf.save(`GA_Drawing_${stats.totalCapacityKW.toFixed(1)}kW.pdf`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const roofPolygonPoints = svgRoof.map(p => `${p.x},${p.y}`).join(" ");
  const safetyPolygonPoints = svgSafety.map(p => `${p.x},${p.y}`).join(" ");

  // Scale bar calculation
  const scaleBarMeters = roofAreaM2 > 500 ? 10 : roofAreaM2 > 100 ? 5 : 2;
  const scaleBarPx = scaleBarMeters * scale;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              📐 General Arrangement Drawing
              <Badge variant="outline">{stats.totalCapacityKW.toFixed(1)} kWp</Badge>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={panels.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {panels.length === 0 || roofPath.length < 3 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Draw a roof and place panels first to generate the GA drawing.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-card">
              <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} className="min-w-[700px]">
                <defs>
                  <linearGradient id="gaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--card))" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" />
                  </linearGradient>
                  <pattern id="panelHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <line x1="0" y1="4" x2="4" y2="0" stroke="hsl(210, 80%, 40%)" strokeWidth="0.5" />
                  </pattern>
                </defs>

                <rect width={svgWidth} height={svgHeight} fill="url(#gaGrad)" rx={12} />

                {/* Title block */}
                <text x={svgWidth / 2} y={28} textAnchor="middle" fontSize={15} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">
                  GENERAL ARRANGEMENT — {stats.totalCapacityKW.toFixed(1)} kWp ROOFTOP SOLAR PV
                </text>
                <text x={svgWidth / 2} y={46} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                  {panels.length} × {selectedPanel.watt}W Panels | {orientation} @ {tiltAngle}° Tilt | {roofType.toUpperCase()} Roof
                </text>

                {/* North arrow */}
                <g transform="translate(80, 100)">
                  <line x1={0} y1={40} x2={0} y2={0} stroke="hsl(var(--foreground))" strokeWidth={2} markerEnd="url(#northArrow)" />
                  <polygon points="-6,15 0,0 6,15" fill="hsl(0, 70%, 50%)" />
                  <text x={0} y={-8} textAnchor="middle" fontSize={12} fontWeight="bold" fill="hsl(0, 70%, 50%)" fontFamily="system-ui">N</text>
                  <text x={0} y={55} textAnchor="middle" fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">NORTH</text>
                </g>

                {/* Walkway indicators (perimeter) */}
                {hasPerimeterWalkway && svgRoof.length > 0 && (
                  <>
                    <polygon points={roofPolygonPoints} fill="hsl(45, 80%, 70%)" fillOpacity={0.3} stroke="hsl(45, 80%, 50%)" strokeWidth={1} strokeDasharray="4,2" />
                  </>
                )}

                {/* Safety boundary */}
                {svgSafety.length > 0 && (
                  <polygon points={safetyPolygonPoints} fill="none" stroke="hsl(120, 60%, 45%)" strokeWidth={1.5} strokeDasharray="6,3" />
                )}

                {/* Roof outline */}
                <polygon points={roofPolygonPoints} fill="none" stroke="hsl(var(--foreground))" strokeWidth={2} />

                {/* Panels */}
                {svgPanels.map((p, i) => (
                  <g key={i}>
                    <rect x={p.x} y={p.y} width={Math.max(p.w, 1)} height={Math.max(p.h, 1)} fill="hsl(210, 80%, 55%)" fillOpacity={0.7} stroke="hsl(210, 80%, 35%)" strokeWidth={0.5} />
                  </g>
                ))}

                {/* Obstacles */}
                {svgObstacles.map((o, i) => (
                  <g key={`obs-${i}`}>
                    <rect x={o.x - o.w / 2} y={o.y - o.h / 2} width={Math.max(o.w, 8)} height={Math.max(o.h, 8)} fill="hsl(0, 70%, 55%)" fillOpacity={0.6} stroke="hsl(0, 70%, 40%)" strokeWidth={1} />
                    <text x={o.x} y={o.y + 3} textAnchor="middle" fontSize={6} fill="white" fontFamily="system-ui">{o.label}</text>
                  </g>
                ))}

                {/* Inverter location marker */}
                {svgRoof.length > 0 && (
                  <g transform={`translate(${svgRoof[0].x - 30}, ${svgRoof[0].y + 20})`}>
                    <rect width={24} height={18} rx={3} fill="hsl(150, 70%, 40%)" stroke="hsl(150, 70%, 30%)" strokeWidth={1} />
                    <text x={12} y={13} textAnchor="middle" fontSize={7} fill="white" fontWeight="bold" fontFamily="system-ui">INV</text>
                    <text x={12} y={30} textAnchor="middle" fontSize={6} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Inverter</text>
                  </g>
                )}

                {/* Cable route (indicative) */}
                {svgRoof.length > 1 && (
                  <g>
                    <line
                      x1={svgRoof[0].x - 18}
                      y1={svgRoof[0].y + 29}
                      x2={svgRoof[0].x - 50}
                      y2={svgRoof[svgRoof.length - 1].y}
                      stroke="hsl(30, 80%, 50%)"
                      strokeWidth={2}
                      strokeDasharray="6,3"
                    />
                    <text
                      x={svgRoof[0].x - 60}
                      y={(svgRoof[0].y + svgRoof[svgRoof.length - 1].y) / 2}
                      fontSize={7}
                      fill="hsl(30, 80%, 50%)"
                      fontFamily="system-ui"
                      transform={`rotate(-90, ${svgRoof[0].x - 60}, ${(svgRoof[0].y + svgRoof[svgRoof.length - 1].y) / 2})`}
                      textAnchor="middle"
                    >Cable Route</text>
                  </g>
                )}

                {/* Scale bar */}
                <g transform={`translate(${svgWidth - 200}, ${svgHeight - 70})`}>
                  <line x1={0} y1={0} x2={scaleBarPx} y2={0} stroke="hsl(var(--foreground))" strokeWidth={2} />
                  <line x1={0} y1={-5} x2={0} y2={5} stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                  <line x1={scaleBarPx} y1={-5} x2={scaleBarPx} y2={5} stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                  <text x={scaleBarPx / 2} y={-8} textAnchor="middle" fontSize={9} fill="hsl(var(--foreground))" fontFamily="system-ui">{scaleBarMeters}m</text>
                  <text x={scaleBarPx / 2} y={16} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">SCALE</text>
                </g>

                {/* Legend */}
                <g transform={`translate(${svgWidth - 200}, 80)`}>
                  <rect width={180} height={200} rx={6} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
                  <text x={90} y={18} textAnchor="middle" fontSize={10} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">LEGEND</text>
                  <line x1={10} y1={24} x2={170} y2={24} stroke="hsl(var(--border))" strokeWidth={0.5} />

                  {[
                    { color: "hsl(var(--foreground))", label: "Roof Boundary", type: "line" },
                    { color: "hsl(120, 60%, 45%)", label: "Safety Setback", type: "dash" },
                    { color: "hsl(210, 80%, 55%)", label: "Solar Panels", type: "rect" },
                    { color: "hsl(0, 70%, 55%)", label: "Obstacles", type: "rect" },
                    { color: "hsl(45, 80%, 50%)", label: "Walkway", type: "dash" },
                    { color: "hsl(150, 70%, 40%)", label: "Inverter", type: "rect" },
                    { color: "hsl(30, 80%, 50%)", label: "Cable Route", type: "dash" },
                  ].map((item, i) => (
                    <g key={i} transform={`translate(15, ${35 + i * 22})`}>
                      {item.type === "line" && <line x1={0} y1={5} x2={20} y2={5} stroke={item.color} strokeWidth={2} />}
                      {item.type === "dash" && <line x1={0} y1={5} x2={20} y2={5} stroke={item.color} strokeWidth={2} strokeDasharray="4,2" />}
                      {item.type === "rect" && <rect x={0} y={0} width={20} height={10} rx={2} fill={item.color} fillOpacity={0.7} />}
                      <text x={28} y={9} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">{item.label}</text>
                    </g>
                  ))}
                </g>

                {/* Info block */}
                <g transform={`translate(20, ${svgHeight - 90})`}>
                  <rect width={300} height={70} rx={6} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
                  <text x={10} y={16} fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="system-ui">Project Data</text>
                  <text x={10} y={30} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Capacity: {stats.totalCapacityKW.toFixed(2)} kWp | Panels: {panels.length} × {selectedPanel.watt}W
                  </text>
                  <text x={10} y={42} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Roof Area: {roofAreaM2.toFixed(1)} m² | Usable: {usableAreaM2.toFixed(1)} m² ({((usableAreaM2 / Math.max(roofAreaM2, 1)) * 100).toFixed(0)}%)
                  </text>
                  <text x={10} y={54} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Orientation: {orientation} | Tilt: {tiltAngle}° | Roof: {roofType} | Wind Zone: {windZone}
                  </text>
                  <text x={10} y={66} fontSize={8} fill="hsl(var(--muted-foreground))" fontFamily="system-ui">
                    Location: {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
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
