interface QuotationShareData {
  customerName: string;
  customerPhone: string;
  quotationNumber: string;
  systemKw: number;
  totalAmount: number;
  validityDays: number;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getValidUntilDate = (createdAt: string, validityDays: number) => {
  const created = new Date(createdAt);
  created.setDate(created.getDate() + validityDays);
  return formatDate(created.toISOString());
};

export const generateWhatsAppMessage = (data: QuotationShareData): string => {
  const validUntil = getValidUntilDate(data.createdAt, data.validityDays);
  
  const message = `🌞 *4M SOLAR SOLUTIONS PVT LTD*
_Empowering Tomorrow with Clean, Smart Solar_

Dear *${data.customerName}*,

Thank you for your interest in solar energy! Please find below the quotation details:

📋 *Quotation Details*
━━━━━━━━━━━━━━━━━
📄 Quotation No: *${data.quotationNumber}*
⚡ System Size: *${data.systemKw} kWp*
💰 Total Amount: *${formatCurrency(data.totalAmount)}*
📅 Valid Until: *${validUntil}*

✅ *What's Included:*
• Premium Solar Panels with 25+ years warranty
• High-efficiency Grid-Tie Inverter
• Complete Mounting Structure
• All cables, earthing & safety equipment
• Professional Installation
• Net Metering Assistance

💳 *Payment Terms:*
• 60% Advance with Order
• 30% on Material Delivery
• 10% after Commissioning

📞 For any queries, contact us:
• Phone: +91 9345115509 / 9789995113
• Email: info@4msolarsolutions.com
• Website: www.4msolarsolutions.com

_Go Solar, Go Green!_ 🌱

Best Regards,
*4M Solar Solutions Pvt. Ltd.*`;

  return message;
};

export const shareViaWhatsApp = (phone: string, message: string) => {
  // Clean phone number - remove spaces, dashes, and leading zeros
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // If phone starts with 0, replace with country code
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '91' + cleanPhone.substring(1);
  }
  
  // If phone doesn't have country code, add India's
  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone;
  }
  
  // Remove + if present
  cleanPhone = cleanPhone.replace('+', '');
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  // Open in new tab
  window.open(whatsappUrl, '_blank');
};

export const shareQuotationViaWhatsApp = (quotation: any) => {
  const data: QuotationShareData = {
    customerName: quotation.leads?.customer_name || 'Customer',
    customerPhone: quotation.leads?.phone || '',
    quotationNumber: quotation.quotation_number || `QT-${quotation.id.slice(0, 8).toUpperCase()}`,
    systemKw: quotation.system_kw || 0,
    totalAmount: quotation.total_amount || 0,
    validityDays: quotation.validity_days || 15,
    createdAt: quotation.created_at || new Date().toISOString(),
  };
  
  const message = generateWhatsAppMessage(data);
  shareViaWhatsApp(data.customerPhone, message);
};
