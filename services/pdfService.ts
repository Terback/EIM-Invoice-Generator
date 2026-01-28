import { InvoiceData } from '../types.ts';
import { COMPANY_INFO, LOGO_URL } from '../constants.ts';

declare const jspdf: any;

/**
 * Utility to fetch an image from a URL and return it as a base64 data URL.
 * Uses direct raw URL and fetch API with standard CORS handling.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'no-cache'
    });
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("PDF Image Loader Error:", error);
    throw error;
  }
};

export const generatePDF = async (data: InvoiceData) => {
  if (typeof jspdf === 'undefined') {
    throw new Error('PDF library not loaded.');
  }

  const { jsPDF } = jspdf;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const MARGIN = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || 'US$';
  const docTypeLabel = data.documentType || 'INVOICE';
  const numberLabel = docTypeLabel === 'INVOICE' ? 'INV#' : 'QUO#';
  let currentY = MARGIN;

  const drawPageFooter = (document: any) => {
    const bottomY = pageHeight - 12;
    document.setFontSize(7);
    document.setFont('helvetica', 'normal');
    document.setTextColor(150, 150, 150);
    document.text(`Copyright © 2025 by EVO-IN-MOTION TECHNOLOGY LTD. All rights reserved.`, pageWidth - MARGIN, bottomY, { align: 'right' });
    document.setTextColor(0, 86, 179);
    document.text(`www.eimtechnology.com`, pageWidth - MARGIN, bottomY + 3, { align: 'right' });
    document.setTextColor(0);
  };

  // 1. Logo
  try {
    if (LOGO_URL) {
      const base64Logo = await getBase64ImageFromUrl(LOGO_URL);
      // Place logo at top left. 18x18mm as seen in template
      doc.addImage(base64Logo, 'PNG', MARGIN, currentY, 18, 18);
    }
  } catch (error) {
    console.warn("Using fallback logo due to fetch error");
    doc.setFillColor(0, 86, 179);
    doc.circle(MARGIN + 9, currentY + 9, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("EIM", MARGIN + 9, currentY + 10, { align: 'center' });
  }

  currentY += 22;

  // 2. Company Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_INFO.name, MARGIN, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(COMPANY_INFO.address, MARGIN, currentY);
  currentY += 4;
  doc.text(COMPANY_INFO.city, MARGIN, currentY);
  currentY += 4;
  doc.setTextColor(0, 86, 179);
  doc.text(COMPANY_INFO.email, MARGIN, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 4;
  doc.text(`Business Number: ${COMPANY_INFO.businessNumber}`, MARGIN, currentY);

  // 3. Header Details
  const rightX = pageWidth - MARGIN;
  let headerY = MARGIN + 12;
  doc.setFontSize(36);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 210, 210);
  doc.text(docTypeLabel, rightX, headerY, { align: 'right' });

  headerY += 15;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${numberLabel} ${data.invoiceNumber}`, rightX, headerY, { align: 'right' });
  headerY += 5;
  doc.text(`DATE: ${data.date}`, rightX, headerY, { align: 'right' });
  headerY += 5;
  doc.text(`DATE DUE: ${data.dateDue}`, rightX, headerY, { align: 'right' });

  // 4. Amount Due Box
  headerY += 8;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  const boxWidth = 65;
  const boxHeight = 11;
  doc.rect(rightX - boxWidth, headerY - 7, boxWidth, boxHeight);
  doc.setFontSize(11);
  doc.text(`Amount Due: ${currency} ${data.totalDue.toFixed(2)}`, rightX - (boxWidth/2), headerY + 0.5, { align: 'center' });

  currentY = Math.max(currentY + 20, headerY + 15);

  // 5. Recipients
  const colWidth = (pageWidth - (MARGIN * 2)) / 2;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLING RECIPIENT', MARGIN, currentY);
  doc.text('SHIPPING RECIPIENT', MARGIN + colWidth, currentY);
  
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const billingContent = [
    data.billingRecipient.companyName,
    data.billingRecipient.address,
    data.billingRecipient.phone ? `Phone ${data.billingRecipient.phone}` : '',
    data.billingRecipient.email
  ].filter(Boolean).join('\n');
  
  doc.text(billingContent, MARGIN, currentY, { maxWidth: colWidth - 10 });

  const shippingContent = [
    data.shippingRecipient.companyName,
    data.shippingRecipient.address
  ].filter(Boolean).join('\n');

  doc.text(shippingContent, MARGIN + colWidth, currentY, { maxWidth: colWidth - 10 });

  const bLines = doc.splitTextToSize(billingContent, colWidth - 10).length;
  const sLines = doc.splitTextToSize(shippingContent, colWidth - 10).length;
  currentY += (Math.max(bLines, sLines) * 4.5) + 12;

  // 6. Items Table
  const tableData = data.items.map(item => [
    item.description,
    item.qty.toString(),
    `${currency}${item.unitPrice.toFixed(2)}`,
    `${currency}${item.total.toFixed(2)}`
  ]);

  (doc as any).autoTable({
    startY: currentY,
    head: [['DESCRIPTION', 'TOTAL QTY', 'UNIT PRICE', 'TOTAL']],
    body: tableData,
    margin: { left: MARGIN, right: MARGIN },
    styles: { 
      fontSize: 9.5, 
      cellPadding: 3, 
      textColor: [0, 0, 0], 
      lineColor: [220, 220, 220], 
      lineWidth: 0.1,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 38 }
    },
    theme: 'grid',
    didDrawPage: () => drawPageFooter(doc)
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // 7. Summary
  const SUMMARY_HEIGHT = 65;
  if (currentY + SUMMARY_HEIGHT > pageHeight - MARGIN) {
    doc.addPage();
    currentY = MARGIN + 10;
  }

  const labelX = rightX - 68;
  const drawSummaryRow = (label: string, value: string, isGray = false, isBold = false) => {
    if (isGray) {
      doc.setFillColor(242, 242, 242);
      doc.rect(labelX - 4, currentY, 72, 8, 'F');
    }
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.rect(labelX - 4, currentY, 72, 8);
    doc.line(labelX + 42, currentY, labelX + 42, currentY + 8);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(isGray ? 100 : 0);
    doc.text(label, labelX, currentY + 5.2);
    doc.setTextColor(0);
    doc.text(value, rightX - 3, currentY + 5.2, { align: 'right' });
    currentY += 8;
  };

  const shipVal = data.shipping > 0 ? `${currency}${data.shipping.toFixed(2)}` : 'N/A';
  drawSummaryRow('SUBTOTAL', `${currency}${data.subtotal.toFixed(2)}`, false, true);
  drawSummaryRow('SHIPPING', shipVal, false, true);
  drawSummaryRow(data.gstLabel, `${currency}${data.gst.toFixed(2)}`, true, false);
  drawSummaryRow(data.pstLabel, `${currency}${data.pst.toFixed(2)}`, true, false);
  drawSummaryRow('TOTAL DUE', `${currency}${data.totalDue.toFixed(2)}`, false, true);

  // 8. Footer
  const footerY = Math.max(currentY + 15, pageHeight - 50);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Make all checks payable to ', MARGIN, footerY);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, MARGIN + 43, footerY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Interac e-Transfer: ', MARGIN, footerY + 5.5);
  doc.setTextColor(0, 86, 179);
  doc.text('evoinmotion@gmail.com', MARGIN + 30, footerY + 5.5);
  doc.setTextColor(0);

  doc.text('Support POS payment for Credit Card, Alipay and Wechat, payable to EIM Technology', MARGIN, footerY + 11);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bolditalic');
  doc.text('THANK YOU FOR YOUR BUSINESS!', pageWidth / 2, footerY + 28, { align: 'center' });

  drawPageFooter(doc);
  doc.save(`${docTypeLabel}_${data.invoiceNumber}.pdf`);
};
