import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/integrations/supabase/types';

type Quotation = Database['public']['Tables']['quotations']['Row'] & {
  leads?: {
    customer_name: string;
    phone: string;
    address: string;
    email?: string | null;
  } | null;
};

interface BomItem {
  sno: number;
  material: string;
  make: string;
  description: string;
  quantity: number;
  unit: string;
  cost: number;
}

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

export const generateQuotationPdf = (quotation: Quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('4M SOLAR SOLUTIONS PVT LTD', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Empowering Tomorrow with Clean, Smart Solar', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFontSize(8);
  doc.text('New No.509, Old 337, Anna Salai, Fanepet, Nandanam, Chennai - 35', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text('GST: 33AACCZ7982R1ZA | Phone: +91 9345115509 / 9789995113', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text('Email: info@4msolarsolutions.com | Web: www.4msolarsolutions.com', pageWidth / 2, yPos, { align: 'center' });

  // Line separator
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Title
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('QUOTATION', pageWidth / 2, yPos, { align: 'center' });

  // Quotation Details Box
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left side - Customer details
  doc.setFont('helvetica', 'bold');
  doc.text('To:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(quotation.leads?.customer_name || 'N/A', margin, yPos);
  yPos += 4;
  if (quotation.leads?.address) {
    const addressLines = doc.splitTextToSize(quotation.leads.address, 80);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }
  if (quotation.leads?.phone) {
    doc.text(`Phone: ${quotation.leads.phone}`, margin, yPos);
    yPos += 4;
  }
  if (quotation.leads?.email) {
    doc.text(`Email: ${quotation.leads.email}`, margin, yPos);
  }

  // Right side - Quotation info
  const rightX = pageWidth - margin - 60;
  let rightY = yPos - 17;
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation No:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.quotation_number || `QT-${quotation.id.slice(0, 8).toUpperCase()}`, rightX + 35, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.created_at ? formatDate(quotation.created_at) : 'N/A', rightX + 35, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Valid For:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quotation.validity_days || 15} Days`, rightX + 35, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('System Size:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quotation.system_kw || 0} kWp`, rightX + 35, rightY);

  // Project Title
  yPos += 15;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${quotation.system_kw || 0}kWp Solar Power System - Techno Commercial Proposal`, pageWidth / 2, yPos, { align: 'center' });

  // BOM Table
  yPos += 10;
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
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 45 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Totals Section
  const subtotal = quotation.subtotal || 0;
  const gstAmount = quotation.gst_amount || 0;
  const total = quotation.total_amount || 0;

  const totalsX = pageWidth - margin - 70;
  doc.setFontSize(10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Sub Total:', totalsX, yPos);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 6;
  doc.text('GST (9%):', totalsX, yPos);
  doc.text(formatCurrency(gstAmount), pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 6;
  doc.setDrawColor(100, 100, 100);
  doc.line(totalsX, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', totalsX, yPos + 2);
  doc.setTextColor(41, 128, 185);
  doc.text(formatCurrency(total), pageWidth - margin, yPos + 2, { align: 'right' });

  // Per Watt calculation
  if (quotation.system_kw && quotation.system_kw > 0) {
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const perWatt = (total - gstAmount) / (quotation.system_kw * 1000);
    doc.text(`(₹ ${perWatt.toFixed(2)} per Watt)`, pageWidth - margin, yPos, { align: 'right' });
  }

  // Terms & Conditions
  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', margin, yPos);
  
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const terms = quotation.terms_conditions || 
    '1. Quotation valid for 15 days from the date of issue.\n' +
    '2. 60% advance payment with Purchase Order.\n' +
    '3. 30% upon material delivery.\n' +
    '4. 10% on completion of installation after commissioning.\n' +
    '5. GST applicable as per government norms.';
  
  const termsLines = terms.split('\n');
  termsLines.forEach(line => {
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  // Bank Details
  yPos += 10;
  if (yPos > 250) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details:', margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Beneficiary: 4M SOLAR SOLUTIONS PVT LTD', margin, yPos);
  yPos += 4;
  doc.text('Account No: 510909010360966', margin, yPos);
  yPos += 4;
  doc.text('Bank: CITY UNION BANK, Chamiers Road, Chennai', margin, yPos);
  yPos += 4;
  doc.text('IFSC: CIUB0000339', margin, yPos);

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('For 4M Solar Solutions Pvt. Ltd.', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory', pageWidth - margin, yPos, { align: 'right' });

  // Save the PDF
  const fileName = `Quotation_${quotation.quotation_number || quotation.id.slice(0, 8)}_${quotation.leads?.customer_name?.replace(/\s+/g, '_') || 'Customer'}.pdf`;
  doc.save(fileName);
};
