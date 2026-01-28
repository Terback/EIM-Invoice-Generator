import { InvoiceData } from '../types';
import { COMPANY_INFO } from '../constants';

declare const jspdf: any;

export const generatePDF = async (data: InvoiceData) => {
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

  // Helper to draw Footer & Copyright on current page
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

  // 1. Logo Placeholder (Vector Drawing) - 16mm x 16mm area
  doc.setFillColor(0, 86, 179);
  doc.circle(MARGIN + 8, currentY + 8, 8, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 5, currentY + 6, MARGIN + 11, currentY + 6);
  doc.line(MARGIN + 5, currentY + 8, MARGIN + 11, currentY + 8);
  doc.line(MARGIN + 5, currentY + 10, MARGIN + 11, currentY + 10);
  doc.circle(MARGIN + 6.5, currentY + 8, 1, 'S');
  doc.circle(MARGIN + 9.5, currentY + 6, 1, 'S');

  currentY += 20; // Correct reserved height for logo header

  // 2. Company Info (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
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

  // 3. Document Header (Right)
  const rightX = pageWidth - MARGIN;
  let headerY = MARGIN + 10;
  doc.setFontSize(32);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(docTypeLabel, rightX, headerY, { align: 'right' });

  headerY += 15;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${numberLabel} ${data.invoiceNumber}`, rightX, headerY, { align: 'right' });
  headerY += 4.5;
  doc.text(`DATE: ${data.date}`, rightX, headerY, { align: 'right' });
  headerY += 4.5;
  doc.text(`DATE DUE: ${data.dateDue}`, rightX, headerY, { align: 'right' });

  // 4. Amount Due Box
  headerY += 10;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  const boxWidth = 60;
  const boxHeight = 10;
  doc.rect(rightX - boxWidth, headerY - 6, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Amount Due: ${currency} ${data.totalDue.toFixed(2)}`, rightX - (boxWidth/2), headerY + 0.5, { align: 'center' });

  currentY = Math.max(currentY + 15, headerY + 10);

  // 5. Recipients
  const colWidth = (pageWidth - (MARGIN * 2)) / 2;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLING RECIPIENT', MARGIN, currentY);
  doc.text('SHIPPING RECIPIENT', MARGIN + colWidth, currentY);
  
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  
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

  const billingLines = doc.splitTextToSize(billingContent, colWidth - 10);
  const shippingLines = doc.splitTextToSize(shippingContent, colWidth - 10);
  const maxLines = Math.max(billingLines.length, shippingLines.length);
  
  currentY += (maxLines * 4.8) + 8;

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
      cellPadding: 2.5, 
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
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30 }
    },
    theme: 'grid',
    didDrawPage: () => {
        drawPageFooter(doc);
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // 7. Summary
  const SUMMARY_HEIGHT = 65;
  if (currentY + SUMMARY_HEIGHT > pageHeight - MARGIN) {
    doc.addPage();
    currentY = MARGIN + 5;
  }

  const labelX = rightX - 55;
  const drawSummaryRow = (label: string, value: string, isGray = false, isBold = false, isItalic = false) => {
    if (isGray) {
      doc.setFillColor(248, 250, 253);
      doc.rect(labelX - 4, currentY, 59, 7, 'F');
    }
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.line(labelX - 4, currentY, rightX, currentY);
    doc.line(labelX - 4, currentY + 7, rightX, currentY + 7);
    doc.line(labelX - 4, currentY, labelX - 4, currentY + 7);
    doc.line(rightX, currentY, rightX, currentY + 7);

    doc.setFont('helvetica', isBold ? 'bold' : (isItalic ? 'italic' : 'normal'));
    doc.setFontSize(9);
    doc.setTextColor(isItalic ? 80 : 0);
    doc.text(label, labelX, currentY + 4.8);
    doc.setTextColor(0);
    doc.text(value, rightX - 2, currentY + 4.8, { align: 'right' });
    currentY += 7;
  };

  const shippingValue = data.shipping > 0 ? `${currency}${data.shipping.toFixed(2)}` : 'N/A';
  drawSummaryRow('SUBTOTAL', `${currency}${data.subtotal.toFixed(2)}`, false, true);
  drawSummaryRow('SHIPPING', shippingValue, false, true);
  drawSummaryRow(data.gstLabel, `${currency}${data.gst.toFixed(2)}`, true, false, true);
  drawSummaryRow(data.pstLabel, `${currency}${data.pst.toFixed(2)}`, true, false, true);
  drawSummaryRow('TOTAL DUE', `${currency}${data.totalDue.toFixed(2)}`, false, true);

  // 8. Footer Notes
  const footerStartY = Math.max(currentY + 10, pageHeight - 45);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Make all checks payable to ', MARGIN, footerStartY);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, MARGIN + 40, footerStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Interac e-Transfer: ', MARGIN, footerStartY + 5);
  doc.setTextColor(0, 86, 179);
  doc.text('evoinmotion@gmail.com', MARGIN + 28, footerStartY + 5);
  doc.setTextColor(0);

  doc.text('Support POS payment for Credit Card, Alipay and Wechat, payable to EIM Technology', MARGIN, footerStartY + 10);

  // Centered Thank You
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bolditalic');
  doc.text('THANK YOU FOR YOUR BUSINESS!', pageWidth / 2, footerStartY + 24, { align: 'center' });

  // Draw final footer info
  drawPageFooter(doc);

  doc.save(`${docTypeLabel}_${data.invoiceNumber}.pdf`);
};
