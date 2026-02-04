import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/integrations/supabase/types';

type Quotation = Database['public']['Tables']['quotations']['Row'] & {
  leads?: {
    customer_name: string;
    phone: string;
    address: string;
    email?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '₹ ');
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Convert image to base64 for PDF embedding
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};

export const generateQuotationPdf = async (quotation: Quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Try to load the logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64('/images/4m-solar-logo.png');
  } catch (error) {
    console.warn('Could not load logo:', error);
  }

  // Header with Logo
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, yPos, 35, 35);
    yPos += 5;
  }

  // Company Header - positioned next to logo
  const headerX = logoBase64 ? margin + 40 : margin;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34); // Forest green
  doc.text('4M SOLAR SOLUTIONS PVT LTD', headerX, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Empowering Tomorrow with Clean, Smart Solar', headerX, yPos + 15);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('GST: 33AACCZ7982R1ZA', headerX, yPos + 21);
  doc.text('New No.509, Old 337, Anna Salai, Fanepet, Nandanam, Chennai - 35', headerX, yPos + 26);
  doc.text('Phone: +91 9345115509 / 9789995113 | Email: info@4msolarsolutions.com', headerX, yPos + 31);

  yPos = logoBase64 ? yPos + 40 : yPos + 35;

  // Green accent line
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Title
  yPos += 10;
  doc.setFillColor(34, 139, 34);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('QUOTATION', pageWidth / 2, yPos + 1, { align: 'center' });

  // Quotation & Customer Details Box
  yPos += 15;
  doc.setTextColor(0, 0, 0);
  
  // Draw box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 35, 'S');

  // Left side - Customer details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('To:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(quotation.leads?.customer_name || 'N/A', margin + 5, yPos);
  yPos += 4;
  if (quotation.leads?.address) {
    const addressText = [
      quotation.leads.address,
      quotation.leads.city,
      quotation.leads.state
    ].filter(Boolean).join(', ');
    const addressLines = doc.splitTextToSize(addressText, 80);
    doc.text(addressLines, margin + 5, yPos);
    yPos += addressLines.length * 4;
  }
  if (quotation.leads?.phone) {
    doc.text(`Phone: ${quotation.leads.phone}`, margin + 5, yPos);
    yPos += 4;
  }
  if (quotation.leads?.email) {
    doc.text(`Email: ${quotation.leads.email}`, margin + 5, yPos);
  }

  // Right side - Quotation info (reset yPos)
  const rightX = pageWidth - margin - 65;
  let rightY = yPos - 17;
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation No:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.quotation_number || `QT-${quotation.id.slice(0, 8).toUpperCase()}`, rightX + 32, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.created_at ? formatDate(quotation.created_at) : 'N/A', rightX + 32, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Valid For:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quotation.validity_days || 15} Days`, rightX + 32, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('System Size:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quotation.system_kw || 0} kWp`, rightX + 32, rightY);

  // Project Title Banner
  yPos += 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(34, 139, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${quotation.system_kw || 0}kWp Solar Power System - Bill of Materials`, pageWidth / 2, yPos + 1, { align: 'center' });

  // BOM Table
  yPos += 12;
  doc.setTextColor(0, 0, 0);
  
  const bomArray = Array.isArray(quotation.bom) ? quotation.bom : [];
  const bomData = bomArray.map((item: any, index: number) => [
    (index + 1).toString(),
    item.material || '',
    item.make || '',
    item.description || '',
    item.quantity?.toString() || '0',
    item.unit || '',
    item.cost ? formatCurrency(item.cost) : '₹ 0',
  ]);

  if (bomData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['S.No', 'Material', 'Make', 'Description', 'Qty', 'Unit', 'Cost (₹)']],
      body: bomData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 28 },
        3: { cellWidth: 42 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Totals Section with box
  const subtotal = quotation.subtotal || 0;
  const gstAmount = quotation.gst_amount || 0;
  const total = quotation.total_amount || 0;

  const totalsBoxWidth = 80;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  
  // Draw totals box
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.rect(totalsX, yPos - 3, totalsBoxWidth, 35, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Sub Total:', totalsX + 5, yPos + 4);
  doc.text(formatCurrency(subtotal), totalsX + totalsBoxWidth - 5, yPos + 4, { align: 'right' });
  
  yPos += 8;
  doc.text('GST (9%):', totalsX + 5, yPos + 4);
  doc.text(formatCurrency(gstAmount), totalsX + totalsBoxWidth - 5, yPos + 4, { align: 'right' });
  
  yPos += 8;
  doc.setDrawColor(34, 139, 34);
  doc.line(totalsX + 5, yPos + 1, totalsX + totalsBoxWidth - 5, yPos + 1);
  
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Grand Total:', totalsX + 5, yPos + 4);
  doc.setTextColor(34, 139, 34);
  doc.text(formatCurrency(total), totalsX + totalsBoxWidth - 5, yPos + 4, { align: 'right' });

  // Per Watt calculation
  if (quotation.system_kw && quotation.system_kw > 0) {
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const perWatt = (total - gstAmount) / (quotation.system_kw * 1000);
    doc.setFont('helvetica', 'italic');
    doc.text(`(₹ ${perWatt.toFixed(2)} per Watt)`, totalsX + totalsBoxWidth - 5, yPos + 4, { align: 'right' });
  }

  // Reset yPos for terms section
  yPos += 20;

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = margin;
  }

  // Terms & Conditions with icon
  doc.setTextColor(34, 139, 34);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', margin, yPos);
  
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const terms = quotation.terms_conditions || 
    '1. Quotation valid for 15 days from the date of issue.\n' +
    '2. 60% advance payment with Purchase Order.\n' +
    '3. 30% upon material delivery.\n' +
    '4. 10% on completion of installation after commissioning.\n' +
    '5. GST applicable as per government norms.\n' +
    '6. Net metering application charges extra (if applicable).\n' +
    '7. All materials are of premium quality with manufacturer warranty.';
  
  const termsLines = terms.split('\n');
  termsLines.forEach(line => {
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  // Bank Details Section
  yPos += 8;
  if (yPos > 245) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFillColor(245, 250, 245);
  doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 28, 'F');
  doc.setDrawColor(34, 139, 34);
  doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 28, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('Bank Details for Payment:', margin + 5, yPos + 3);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Beneficiary: 4M SOLAR SOLUTIONS PVT LTD', margin + 5, yPos + 3);
  doc.text('Account No: 510909010360966', margin + 90, yPos + 3);
  yPos += 5;
  doc.text('Bank: CITY UNION BANK, Chamiers Road, Chennai', margin + 5, yPos + 3);
  doc.text('IFSC: CIUB0000339', margin + 90, yPos + 3);

  // Footer with signature
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('For 4M Solar Solutions Pvt. Ltd.', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory', pageWidth - margin, yPos, { align: 'right' });

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  // Save the PDF
  const fileName = `Quotation_${quotation.quotation_number || quotation.id.slice(0, 8)}_${quotation.leads?.customer_name?.replace(/\s+/g, '_') || 'Customer'}.pdf`;
  doc.save(fileName);
};
