import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DesignStats, RCCDetails, MetalRoofDetails, ComplianceStatus, PanelOption, PanelOrientation, RoofType } from "@/utils/solarCalculations";
import { getWindLoadWarning } from "@/utils/solarCalculations";
import QRCode from "qrcode";

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
  image2D?: string; // base64 data URL
  image3D?: string; // base64 data URL
  preparedBy?: string;
  clientName?: string;
  previewUrl?: string;
}

const ROOF_LABELS: Record<RoofType, string> = {
  rcc: "RCC Rooftop",
  metal_sheet: "Metal Sheet Rooftop",
  tile: "Tile Roof",
  ground_mount: "Ground Mount",
};

const BRAND_GREEN: [number, number, number] = [22, 101, 52];
const BRAND_DARK: [number, number, number] = [26, 54, 93];
const BRAND_ACCENT: [number, number, number] = [234, 160, 28];

// Helper: draw branded header on a page
function drawPageHeader(doc: jsPDF, pageWidth: number, title: string) {
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 22, pageWidth, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("4M SOLAR SOLUTIONS", 15, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(title, 15, 18);
  doc.text(new Date().toLocaleDateString("en-IN"), pageWidth - 15, 18, { align: "right" });
}

// Helper: draw footer on a page
function drawPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text("4M Solar Solutions — Confidential Proposal", 15, pageHeight - 9);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, pageHeight - 9, { align: "right" });
}

// Helper: draw watermark
function drawWatermark(doc: jsPDF, pageWidth: number, pageHeight: number) {
  doc.setFontSize(60);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.text("4M SOLAR", cx, cy, { align: "center", angle: 45 });
  doc.restoreGraphicsState();
}

export async function exportSolarPlan(data: SolarPlanData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============ PAGE 1: COVER PAGE ============
  // Background: 3D image or solid dark
  if (data.image3D) {
    try {
      doc.addImage(data.image3D, "PNG", 0, 0, pageWidth, pageHeight);
    } catch { /* fallback below */ }
    // Dark overlay
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.65 }));
    doc.setFillColor(10, 20, 40);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.restoreGraphicsState();
  } else {
    doc.setFillColor(10, 20, 40);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  }

  // Green accent bar at top
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("4M SOLAR SOLUTIONS", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 200);
  doc.text("EPC Solar Design Proposal", pageWidth / 2, 50, { align: "center" });

  // Gold accent line
  doc.setDrawColor(...BRAND_ACCENT);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 40, 56, pageWidth / 2 + 40, 56);

  // Project info
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(data.projectName, pageWidth / 2, 80, { align: "center", maxWidth: pageWidth - 40 });

  doc.setFontSize(16);
  doc.setTextColor(...BRAND_ACCENT);
  doc.text(`${data.stats.totalCapacityKW.toFixed(2)} kWp`, pageWidth / 2, 95, { align: "center" });

  if (data.targetCapacityKW && data.targetCapacityKW > 0) {
    doc.setFontSize(10);
    doc.setTextColor(180, 200, 180);
    doc.text(`Target: ${data.targetCapacityKW} kW`, pageWidth / 2, 103, { align: "center" });
  }

  // Cover details
  const coverY = 130;
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  const coverDetails = [
    `Location: ${data.latitude.toFixed(4)}°N, ${data.longitude.toFixed(4)}°E`,
    `Roof Type: ${ROOF_LABELS[data.roofType]}`,
    `Panel: ${data.panel.watt}Wp ${data.panel.cellType}`,
    `Total Panels: ${data.stats.totalPanels}`,
    `Annual Generation: ${data.stats.annualEnergyKWh.toFixed(0)} kWh`,
  ];
  coverDetails.forEach((line, i) => {
    doc.text(line, pageWidth / 2, coverY + i * 8, { align: "center" });
  });

  // Prepared info box
  const boxY = 200;
  doc.setFillColor(255, 255, 255);
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.roundedRect(30, boxY - 5, pageWidth - 60, 40, 3, 3, "F");
  doc.restoreGraphicsState();

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  if (data.clientName) {
    doc.text(`Prepared For: ${data.clientName}`, pageWidth / 2, boxY + 5, { align: "center" });
  }
  doc.text("Prepared By: 4M Solar Solutions", pageWidth / 2, boxY + 13, { align: "center" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, boxY + 21, { align: "center" });

  // Footer on cover
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("4M Solar Solutions — Confidential Proposal", pageWidth / 2, pageHeight - 10, { align: "center" });

  // ============ PAGE 2: PROJECT SUMMARY ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "Project Summary");
  drawWatermark(doc, pageWidth, pageHeight);

  const windWarning = getWindLoadWarning(data.panel.length, data.windZone);

  const summaryData: string[][] = [];
  if (data.targetCapacityKW && data.targetCapacityKW > 0) {
    summaryData.push(["Target Capacity", `${data.targetCapacityKW} kW`]);
  }
  summaryData.push(
    ["Location", `${data.latitude.toFixed(4)}°N, ${data.longitude.toFixed(4)}°E`],
    ["Wind Zone", data.windZone],
    ["Roof Type", ROOF_LABELS[data.roofType]],
    ["Total Roof Area", `${data.roofAreaM2.toFixed(1)} m²`],
    ["Usable Area", `${data.usableAreaM2.toFixed(1)} m²`],
    ["Panel Type", `${data.panel.watt}Wp ${data.panel.cellType}`],
    ["Panel Dimensions", `${data.panel.length}m × ${data.panel.width}m (${data.panel.weight} kg)`],
    ["Module Efficiency", `${data.panel.efficiency}%`],
    ["Orientation", data.orientation.charAt(0).toUpperCase() + data.orientation.slice(1)],
    ["Tilt Angle", `${data.tiltAngle}°`],
    ["Row Spacing", `${data.stats.rowSpacingM.toFixed(2)} m (shadow-safe)`],
    ["Total Panels", String(data.stats.totalPanels)],
    ["Total Capacity", `${data.stats.totalCapacityKW.toFixed(2)} kWp`],
    ["Roof Utilization", `${data.stats.roofUtilization.toFixed(1)}%`],
    ["Inverter", data.stats.inverterSuggestion],
  );

  if (windWarning) summaryData.push(["⚠ Wind Warning", windWarning]);

  autoTable(doc, {
    startY: 32,
    head: [["Parameter", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: BRAND_GREEN, fontSize: 9, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  let yPos = (doc as any).lastAutoTable.finalY + 8;

  // Energy production
  const energyData = [
    ["Daily Generation", `${data.stats.dailyEnergyKWh.toFixed(1)} kWh`],
    ["Annual Generation", `${data.stats.annualEnergyKWh.toFixed(0)} kWh`],
    ["Est. Annual Savings (₹8/unit)", `₹${(data.stats.annualEnergyKWh * 8).toLocaleString("en-IN")}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Energy Production", ""]],
    body: energyData,
    theme: "grid",
    headStyles: { fillColor: BRAND_GREEN, fontSize: 9, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  // Safety
  yPos = (doc as any).lastAutoTable.finalY + 8;
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
      headStyles: { fillColor: [234, 88, 12], fontSize: 9, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });
  }

  // ============ PAGE 3: 2D LAYOUT ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "2D Solar Layout Plan");
  drawWatermark(doc, pageWidth, pageHeight);

  if (data.image2D) {
    const imgMargin = 15;
    const imgWidth = pageWidth - imgMargin * 2;
    const imgHeight = imgWidth * 0.65; // ~16:10 aspect
    try {
      doc.addImage(data.image2D, "PNG", imgMargin, 32, imgWidth, imgHeight);
      // Border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(imgMargin, 32, imgWidth, imgHeight);
      
      // Caption
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("2D Satellite Layout — Panels, Walkways, Pipelines, Safety Setback, Obstacles", pageWidth / 2, 32 + imgHeight + 6, { align: "center" });
    } catch {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text("2D Layout Image Not Available", pageWidth / 2, 120, { align: "center" });
    }
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text("2D Layout Image Not Captured", pageWidth / 2, 120, { align: "center" });
    doc.setFontSize(9);
    doc.text("Draw a roof polygon and place panels to include the layout image.", pageWidth / 2, 130, { align: "center" });
  }

  // ============ PAGE 4: 3D DESIGN PREVIEW ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "3D Design Preview");
  drawWatermark(doc, pageWidth, pageHeight);

  if (data.image3D) {
    const imgMargin = 15;
    const imgWidth = pageWidth - imgMargin * 2;
    const imgHeight = imgWidth * 0.65;
    try {
      doc.addImage(data.image3D, "PNG", imgMargin, 32, imgWidth, imgHeight);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(imgMargin, 32, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("3D Design Preview — Panels, Roof Structure, Shadow-Safe Spacing", pageWidth / 2, 32 + imgHeight + 6, { align: "center" });
    } catch {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text("3D Preview Image Not Available", pageWidth / 2, 120, { align: "center" });
    }
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text("3D Preview Image Not Captured", pageWidth / 2, 120, { align: "center" });
    doc.setFontSize(9);
    doc.text("Switch to 3D Design Engine to capture the 3D preview.", pageWidth / 2, 130, { align: "center" });
  }

  // QR Code on 3D page
  if (data.previewUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.previewUrl, { width: 200, margin: 1, color: { dark: "#166534", light: "#ffffff" } });
      const qrSize = 28;
      doc.addImage(qrDataUrl, "PNG", pageWidth - 15 - qrSize, pageHeight - 55, qrSize, qrSize);
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text("Scan to View Interactive", pageWidth - 15 - qrSize / 2, pageHeight - 55 + qrSize + 3, { align: "center" });
      doc.text("3D Design", pageWidth - 15 - qrSize / 2, pageHeight - 55 + qrSize + 7, { align: "center" });
    } catch { /* QR generation failed, skip */ }
  }

  // ============ PAGE 5: STRUCTURAL ANALYSIS ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "Structural Analysis");
  drawWatermark(doc, pageWidth, pageHeight);

  let structY = 35;

  // General structural data
  const structData = [
    ["Structural Load", `${data.stats.structuralLoadKgM2.toFixed(1)} kg/m²`],
    ["Total Panel Weight", `${(data.stats.totalPanels * data.panel.weight).toFixed(0)} kg`],
    ["Panel Weight (each)", `${data.panel.weight} kg`],
  ];

  autoTable(doc, {
    startY: structY,
    head: [["Structural Overview", ""]],
    body: structData,
    theme: "grid",
    headStyles: { fillColor: BRAND_DARK, fontSize: 9, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 15, right: 15 },
  });

  structY = (doc as any).lastAutoTable.finalY + 8;

  // RCC details
  if (data.rccDetails) {
    const rccData = [
      ["Structure Type", data.rccDetails.structureType.charAt(0).toUpperCase() + data.rccDetails.structureType.slice(1)],
      ["Total Load", `${data.rccDetails.totalLoad.toFixed(0)} kg`],
      ["Dead Load Limit", `${data.rccDetails.deadLoadLimit} kg/m²`],
      ["Status", data.rccDetails.isSafe ? "✅ Structurally Safe" : "❌ Structural Risk — Reinforcement Required"],
    ];

    autoTable(doc, {
      startY: structY,
      head: [["RCC Structural Analysis", ""]],
      body: rccData,
      theme: "grid",
      headStyles: { fillColor: data.rccDetails.isSafe ? BRAND_GREEN : [220, 38, 38], fontSize: 9, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    structY = (doc as any).lastAutoTable.finalY + 8;
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
      startY: structY,
      head: [["Metal Roof Hardware", ""]],
      body: metalData,
      theme: "grid",
      headStyles: { fillColor: [107, 114, 128], fontSize: 9, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });
  }

  // ============ PAGE 6: FINANCIAL SUMMARY ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "Financial Summary");
  drawWatermark(doc, pageWidth, pageHeight);

  const marginPct = data.stats.epcRevenue > 0 ? ((data.stats.grossProfit / data.stats.epcRevenue) * 100).toFixed(1) : "0";
  const roi = data.stats.annualEnergyKWh * 8;
  const payback = roi > 0 ? (data.stats.epcRevenue / roi).toFixed(1) : "N/A";

  const finData = [
    ["EPC Revenue", `₹${data.stats.epcRevenue.toLocaleString("en-IN")}`],
    ["Material Cost", `₹${data.stats.materialCost.toLocaleString("en-IN")}`],
    ["Gross Profit", `₹${data.stats.grossProfit.toLocaleString("en-IN")}`],
    ["Margin", `${marginPct}%`],
    ["Estimated Annual Savings", `₹${roi.toLocaleString("en-IN")}`],
    ["Estimated Payback Period", `${payback} years`],
  ];

  autoTable(doc, {
    startY: 35,
    head: [["Financial Parameter", "Value"]],
    body: finData,
    theme: "grid",
    headStyles: { fillColor: BRAND_GREEN, fontSize: 10, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
    margin: { left: 15, right: 15 },
    styles: { cellPadding: 4 },
  });

  // ============ PAGE 7: CLIENT APPROVAL ============
  doc.addPage();
  drawPageHeader(doc, pageWidth, "Client Approval");
  drawWatermark(doc, pageWidth, pageHeight);

  let approvalY = 40;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Authorization & Approval", 15, approvalY);
  approvalY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("This document confirms the solar design specifications and financial terms outlined in this proposal.", 15, approvalY, { maxWidth: pageWidth - 30 });
  approvalY += 16;

  // Prepared By section
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, approvalY - 3, pageWidth / 2 - 20, 50, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_DARK);
  doc.text("Prepared By", 20, approvalY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${data.preparedBy || "___________________"}`, 20, approvalY + 14);
  doc.text("Designation: Solar Design Engineer", 20, approvalY + 22);
  doc.text("Company: 4M Solar Solutions", 20, approvalY + 30);
  doc.text("Signature: ___________________", 20, approvalY + 38);

  // Client section
  const clientBoxX = pageWidth / 2 + 5;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(clientBoxX, approvalY - 3, pageWidth / 2 - 20, 50, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_DARK);
  doc.text("Client Approval", clientBoxX + 5, approvalY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${data.clientName || "___________________"}`, clientBoxX + 5, approvalY + 14);
  doc.text("Signature: ___________________", clientBoxX + 5, approvalY + 22);
  doc.text("Date: ___________________", clientBoxX + 5, approvalY + 30);
  doc.text(`Approved Capacity: ${data.stats.totalCapacityKW.toFixed(2)} kWp`, clientBoxX + 5, approvalY + 38);

  approvalY += 60;

  // Comments section
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_DARK);
  doc.text("Comments / Special Instructions:", 15, approvalY);
  approvalY += 6;
  doc.setDrawColor(200, 200, 200);
  for (let i = 0; i < 5; i++) {
    doc.line(15, approvalY + i * 10, pageWidth - 15, approvalY + i * 10);
  }

  // ============ ADD FOOTERS TO ALL PAGES ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) { // Skip cover page footer (already handled)
      drawPageFooter(doc, pageWidth, pageHeight, i, totalPages);
    }
  }

  doc.save(`Solar_Proposal_${data.projectName.replace(/\s+/g, "_")}.pdf`);
}

// ============ CAPTURE UTILITIES ============

/**
 * Capture the Google Maps container as a base64 PNG image using html2canvas.
 */
export async function capture2DLayout(mapContainerSelector: string = ".gm-style"): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const container = document.querySelector(mapContainerSelector);
    if (!container) return null;
    const canvas = await html2canvas(container as HTMLElement, {
      useCORS: true,
      allowTaint: true,
      scale: 2, // High resolution
      backgroundColor: null,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("2D capture failed:", e);
    return null;
  }
}

/**
 * Capture the Three.js canvas as a base64 PNG from the 3D tab.
 */
export function capture3DLayout(): string | null {
  try {
    const canvases = document.querySelectorAll("canvas");
    // Find the Three.js canvas (usually has webgl context)
    for (const canvas of canvases) {
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (ctx) {
        // Three.js canvas found — need to re-render to get pixels
        return canvas.toDataURL("image/png");
      }
    }
    // Fallback: last canvas element
    if (canvases.length > 0) {
      return canvases[canvases.length - 1].toDataURL("image/png");
    }
    return null;
  } catch (e) {
    console.error("3D capture failed:", e);
    return null;
  }
}
