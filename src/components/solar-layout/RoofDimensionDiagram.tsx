import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Ruler } from "lucide-react";
import { useSolarLayout } from "./SolarLayoutContext";
import { latLngToMeters } from "@/utils/solarCalculations";

export function RoofDimensionDiagram() {
  const { roofPath, panels, selectedPanel, orientation, tiltAngle, stats, safetySetback, additionalRoofs } = useSolarLayout();

  if (roofPath.length < 3) return null;

  // Convert roof to local coordinates (meters)
  const centerLat = roofPath.reduce((s, p) => s + p.lat, 0) / roofPath.length;
  const centerLng = roofPath.reduce((s, p) => s + p.lng, 0) / roofPath.length;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);

  const toLocal = (pt: { lat: number; lng: number }) => ({
    x: (pt.lng - centerLng) * 111320 * cosLat,
    y: -(pt.lat - centerLat) * 111320,
  });

  const localPoints = roofPath.map(toLocal);

  // Compute bounding box
  const xs = localPoints.map(p => p.x);
  const ys = localPoints.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const roofW = maxX - minX;
  const roofH = maxY - minY;

  // SVG sizing
  const margin = 60;
  const svgW = 700;
  const svgH = 500;
  const drawW = svgW - margin * 2;
  const drawH = svgH - margin * 2;
  const scale = Math.min(drawW / (roofW || 1), drawH / (roofH || 1));

  const toSVG = (pt: { x: number; y: number }) => ({
    x: margin + (pt.x - minX) * scale,
    y: margin + (pt.y - minY) * scale,
  });

  const svgPoints = localPoints.map(toSVG);
  const roofPolygonStr = svgPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Edge dimensions
  const edges = roofPath.map((pt, i) => {
    const next = roofPath[(i + 1) % roofPath.length];
    const dist = latLngToMeters(pt, next);
    const s1 = svgPoints[i];
    const s2 = svgPoints[(i + 1) % svgPoints.length];
    const midX = (s1.x + s2.x) / 2;
    const midY = (s1.y + s2.y) / 2;
    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
    // Offset label perpendicular to edge
    const offX = -Math.sin(angle) * 14;
    const offY = Math.cos(angle) * 14;
    return { dist, midX: midX + offX, midY: midY + offY, angle };
  });

  // Panel layout info
  const panelW = orientation === "landscape" ? selectedPanel.length : selectedPanel.width;
  const panelH = orientation === "landscape" ? selectedPanel.width : selectedPanel.length;

  // Additional roofs
  const additionalPolygons = additionalRoofs.map(roof => {
    const local = roof.map(toLocal);
    const svg = local.map(toSVG);
    return svg.map(p => `${p.x},${p.y}`).join(" ");
  });

  const handleDownload = () => {
    const svgEl = document.getElementById("roof-dim-svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roof-dimensions.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" /> Roof Dimension Diagram
        </h3>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5 mr-1" /> Download SVG
        </Button>
      </div>
      <div className="overflow-x-auto bg-muted/30 rounded-lg border">
        <svg id="roof-dim-svg" viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[700px] mx-auto">
          {/* Background */}
          <rect width={svgW} height={svgH} fill="hsl(var(--background))" />

          {/* Title */}
          <text x={svgW / 2} y={20} textAnchor="middle" fontSize="13" fontWeight="bold" fill="hsl(var(--foreground))">
            ROOF PLAN — DIMENSION DIAGRAM
          </text>

          {/* Roof polygon */}
          <polygon points={roofPolygonStr} fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" strokeWidth="2" />

          {/* Additional roofs */}
          {additionalPolygons.map((poly, i) => (
            <polygon key={i} points={poly} fill="hsl(var(--destructive) / 0.08)" stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="4 2" />
          ))}

          {/* Setback boundary */}
          {safetySetback > 0 && (() => {
            const cx = localPoints.reduce((s, p) => s + p.x, 0) / localPoints.length;
            const cy = localPoints.reduce((s, p) => s + p.y, 0) / localPoints.length;
            const shrunk = localPoints.map(p => {
              const dx = p.x - cx, dy = p.y - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return p;
              const f = Math.max(0, (dist - safetySetback) / dist);
              return { x: cx + dx * f, y: cy + dy * f };
            });
            const pts = shrunk.map(toSVG).map(p => `${p.x},${p.y}`).join(" ");
            return <polygon points={pts} fill="none" stroke="hsl(var(--chart-4))" strokeWidth="1" strokeDasharray="6 3" />;
          })()}

          {/* Edge dimensions */}
          {edges.map((e, i) => (
            <g key={`edge-${i}`}>
              <text
                x={e.midX} y={e.midY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="600"
                fill="hsl(var(--primary))"
              >
                {e.dist.toFixed(2)}m
              </text>
            </g>
          ))}

          {/* Panel layout summary */}
          <g>
            <text x={margin} y={svgH - 40} fontSize="10" fill="hsl(var(--muted-foreground))">
              Panels: {stats.totalPanels} × {selectedPanel.watt}Wp = {stats.totalCapacityKW.toFixed(2)} kWp
            </text>
            <text x={margin} y={svgH - 26} fontSize="10" fill="hsl(var(--muted-foreground))">
              Panel: {panelW.toFixed(3)}m × {panelH.toFixed(3)}m | Tilt: {tiltAngle}° | Rows: {stats.totalRows} | Row Spacing: {stats.rowSpacingM.toFixed(2)}m
            </text>
            <text x={margin} y={svgH - 12} fontSize="10" fill="hsl(var(--muted-foreground))">
              Setback: {safetySetback}m | Orientation: {orientation}
            </text>
          </g>

          {/* Scale bar */}
          {(() => {
            const scaleM = roofW > 20 ? 10 : roofW > 10 ? 5 : roofW > 5 ? 2 : 1;
            const barW = scaleM * scale;
            const barX = svgW - margin - barW;
            const barY = svgH - 15;
            return (
              <g>
                <line x1={barX} y1={barY} x2={barX + barW} y2={barY} stroke="hsl(var(--foreground))" strokeWidth="2" />
                <line x1={barX} y1={barY - 3} x2={barX} y2={barY + 3} stroke="hsl(var(--foreground))" strokeWidth="1" />
                <line x1={barX + barW} y1={barY - 3} x2={barX + barW} y2={barY + 3} stroke="hsl(var(--foreground))" strokeWidth="1" />
                <text x={barX + barW / 2} y={barY - 5} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))">
                  {scaleM}m
                </text>
              </g>
            );
          })()}

          {/* North arrow */}
          <g transform={`translate(${svgW - 30}, ${margin + 10})`}>
            <polygon points="0,-15 -5,0 5,0" fill="hsl(var(--foreground))" />
            <text x={0} y={12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(var(--foreground))">N</text>
          </g>
        </svg>
      </div>
    </Card>
  );
}
