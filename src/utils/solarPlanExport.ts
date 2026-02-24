import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DesignStats, RCCDetails, MetalRoofDetails, ComplianceStatus, PanelOption, PanelOrientation, RoofType } from "@/utils/solarCalculations";
import { getWindLoadWarning } from "@/utils/solarCalculations";

interface SolarPlanData {
  projectName: string;
  latitude: number;
  longitude: number;
  roofType: RoofType;
  roofAreaM2: number;
  usableAreaM2: number;
  panel: PanelOption;
  orientation: PanelOrientation;
  tiltAngle: number;
  stats: DesignStats;
  rccDetails: RCCDetails | null;
  metalRoofDetails: MetalRoofDetails | null;
  compliance: ComplianceStatus;
  hasPerimeterWalkway: boolean;
  perimeterWalkwayWidth: number;
  hasCentralWalkway: boolean;
  centralWalkwayWidth: number;
  safetySetback: number;
  obstacleCount: number;
  windZone: string;
  targetCapacityKW?: number;
}

const ROOF_LABELS: Record<RoofType, string> = {
  rcc: "RCC Rooftop",
  metal_sheet: "Metal Sheet Rooftop",
  tile: "Tile Roof",
  ground_mount: "Ground Mount",
};

export function exportSolarPlan(data: SolarPlanData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header with branding
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("4M SOLAR", 15, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Solar Design Plan Report", 15, 26);
  doc.text(new Date().toLocaleDateString("en-IN"), pageWidth - 15, 26, { align: "right" });

  // Project name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectName, 15, 47);

  // Main details table
  let yPos = 55;
  const windWarning = getWindLoadWarning(data.panel.length, data.windZone);

  const mainData: string[][] = [];
  if (data.targetCapacityKW && data.targetCapacityKW > 0) {
    mainData.push(["Target Capacity", `${data.targetCapacityKW} kW`]);
  }
  mainData.push(
    ["Location", `${data.latitude.toFixed(4)}°N, ${data.longitude.toFixed(4)}°E`],
    ["Wind Zone", data.windZone],
    ["Roof Type", ROOF_LABELS[data.roofType]],
    ["Total Roof Area", `${data.roofAreaM2.toFixed(1)} m²`],
    ["Usable Area", `${data.usableAreaM2.toFixed(1)} m²`],
    ["Panel Type", `${data.panel.watt}Wp ${data.panel.cellType}`],
    ["Panel Dimensions", `${data.panel.length}m × ${data.panel.width}m (${data.panel.weight} kg)`],
    ["Cell Technology", data.panel.cellType],
    ["Module Efficiency", `${data.panel.efficiency}%`],
    ["Orientation", data.orientation.charAt(0).toUpperCase() + data.orientation.slice(1)],
    ["Tilt Angle", `${data.tiltAngle}°`],
    ["Row Spacing", `${data.stats.rowSpacingM.toFixed(2)} m (shadow-safe)`],
    ["Total Panels", String(data.stats.totalPanels)],
    ["Total Capacity", `${data.stats.totalCapacityKW.toFixed(2)} kWp`],
    ["Roof Utilization", `${data.stats.roofUtilization.toFixed(1)}%`],
    ["Structural Load", `${data.stats.structuralLoadKgM2.toFixed(1)} kg/m²`],
    ["Inverter", data.stats.inverterSuggestion],
  );

  if (windWarning) {
    mainData.push(["⚠ Wind Warning", windWarning]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: mainData,
    theme: "grid",
    headStyles: { fillColor: [26, 54, 93], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Energy production
  const energyData = [
    ["Daily Generation", `${data.stats.dailyEnergyKWh.toFixed(1)} kWh`],
    ["Annual Generation", `${data.stats.annualEnergyKWh.toFixed(0)} kWh`],
    ["Est. Annual Savings (₹8/unit)", `₹${(data.stats.annualEnergyKWh * 8).toFixed(0)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Energy Production", ""]],
    body: energyData,
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Walkway & Safety
  if (data.hasPerimeterWalkway || data.hasCentralWalkway || data.safetySetback > 0) {
    const safetyData: string[][] = [];
    if (data.hasPerimeterWalkway) safetyData.push(["Perimeter Walkway", `${data.perimeterWalkwayWidth}m width`]);
    if (data.hasCentralWalkway) safetyData.push(["Central Walkway", `${data.centralWalkwayWidth}m width`]);
    if (data.safetySetback > 0) safetyData.push(["Safety Edge Setback", `${data.safetySetback}m`]);
    safetyData.push(["Obstacles", `${data.obstacleCount} items`]);

    autoTable(doc, {
      startY: yPos,
      head: [["Safety & Access", ""]],
      body: safetyData,
      theme: "grid",
      headStyles: { fillColor: [234, 88, 12], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // RCC details
  if (data.rccDetails) {
    const rccData = [
      ["Structure Type", data.rccDetails.structureType.charAt(0).toUpperCase() + data.rccDetails.structureType.slice(1)],
      ["Total Load", `${data.rccDetails.totalLoad.toFixed(0)} kg`],
      ["Dead Load Limit", `${data.rccDetails.deadLoadLimit} kg/m²`],
      ["Status", data.rccDetails.isSafe ? "✅ Structurally Safe" : "❌ Structural Risk"],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["RCC Structural Analysis", ""]],
      body: rccData,
      theme: "grid",
      headStyles: { fillColor: [107, 114, 128], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Metal roof details
  if (data.metalRoofDetails) {
    const metalData = [
      ["Purlin Spacing", `${data.metalRoofDetails.purlinSpacing} mm`],
      ["Clamp Type", data.metalRoofDetails.clampType.replace(/_/g, " ")],
      ["Rail Count", String(data.metalRoofDetails.railCount)],
      ["Clamp Count", String(data.metalRoofDetails.clampCount)],
      ["Fastener Count", String(data.metalRoofDetails.fastenerCount)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Metal Roof Hardware", ""]],
      body: metalData,
      theme: "grid",
      headStyles: { fillColor: [107, 114, 128], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Financial Summary
  const finData = [
    ["EPC Revenue", `₹${(data.stats.epcRevenue).toLocaleString("en-IN")}`],
    ["Material Cost", `₹${(data.stats.materialCost).toLocaleString("en-IN")}`],
    ["Gross Profit", `₹${(data.stats.grossProfit).toLocaleString("en-IN")}`],
    ["Margin", `${data.stats.epcRevenue > 0 ? ((data.stats.grossProfit / data.stats.epcRevenue) * 100).toFixed(1) : 0}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Financial Summary", ""]],
    body: finData,
    theme: "grid",
    headStyles: { fillColor: [21, 128, 61], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("4M Solar — Confidential Solar Design Plan", 15, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`Solar_Plan_${data.projectName.replace(/\s+/g, "_")}.pdf`);
}
