const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#1e3a5f',
  secondary: '#2563eb',
  accent: '#f97316',
  success: '#16a34a',
  light: '#f1f5f9',
  border: '#cbd5e1',
  text: '#1e293b',
  muted: '#64748b',
  white: '#ffffff',
};

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/**
 * Generates a professional A4 PDF invoice for product shop sales.
 * Returns a Buffer of the PDF.
 */
const generateInvoicePDF = (bill) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const businessName = process.env.BUSINESS_NAME || 'Paws & Care Pet Clinic';
    const businessAddress = process.env.BUSINESS_ADDRESS || '123 Pet Street, Chennai, Tamil Nadu 600001';
    const businessPhone = process.env.BUSINESS_PHONE || '+91 98765 43210';
    const businessEmail = process.env.BUSINESS_EMAIL || 'info@pawsandcare.com';
    const businessGSTIN = process.env.BUSINESS_GSTIN || '33AABCP1234A1Z5';

    // Page dimensions
    const margin = 35;
    const pageWidth = doc.page.width - (margin * 2); // 525.28 pt
    const rightMarginX = margin + pageWidth;

    // Palette
    const C = {
      navy: '#0f172a',
      bluePrimary: '#2563eb',
      slateDark: '#1e293b',
      slateMuted: '#64748b',
      slateLight: '#f8fafc',
      border: '#cbd5e1',
      borderLight: '#e2e8f0',
      accentOrange: '#ea580c',
      accentOrangeBg: '#fff7ed',
      successGreen: '#16a34a',
      white: '#ffffff',
    };

    let y = 35;

    // ─── 1. HEADER BANNER ─────────────────────────────────────────────
    const bannerHeight = 82;
    doc.rect(margin, y, pageWidth, bannerHeight).fill(C.navy);

    // Business Details (Left side)
    doc.fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(businessName, margin + 15, y + 12, { width: 310 });

    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(businessAddress, margin + 15, y + 34, { width: 310 })
      .text(`Ph: ${businessPhone}  |  ${businessEmail}`, margin + 15, y + 46, { width: 310 });

    if (businessGSTIN) {
      doc.fillColor('#38bdf8')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(`GSTIN: ${businessGSTIN}`, margin + 15, y + 58, { width: 310 });
    }

    // Invoice Metadata (Right side)
    doc.fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('TAX INVOICE', margin + 320, y + 12, { width: pageWidth - 335, align: 'right' });

    doc.fillColor('#38bdf8')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(bill.invoiceNumber || 'INV-0000', margin + 320, y + 35, { width: pageWidth - 335, align: 'right' });

    doc.fillColor('#94a3b8')
      .font('Helvetica')
      .fontSize(8)
      .text(`Date: ${formatDateTime(bill.createdAt)}`, margin + 320, y + 50, { width: pageWidth - 335, align: 'right' });

    doc.fillColor('#4ade80')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(`STATUS: ${bill.paymentStatus || 'PAID'}`, margin + 320, y + 62, { width: pageWidth - 335, align: 'right' });

    y += bannerHeight + 15;

    // ─── 2. CUSTOMER & PET INFO ───────────────────────────────────────
    const cardW = (pageWidth - 15) / 2; // ~255 pt
    const cardH = 75;

    // Customer Card
    doc.rect(margin, y, cardW, cardH).fill(C.slateLight);
    doc.rect(margin, y, cardW, cardH).strokeColor(C.borderLight).stroke();

    doc.fillColor(C.bluePrimary)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('BILL TO (CUSTOMER)', margin + 12, y + 10);

    const customerName = bill.isWalkIn ? (bill.walkInName || 'Walk-in Customer') : (bill.clientNameSnapshot || 'Client');
    doc.fillColor(C.slateDark)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text(customerName, margin + 12, y + 23, { width: cardW - 24 });

    const customerMobile = bill.isWalkIn ? bill.walkInMobile : bill.clientMobileSnapshot;
    doc.font('Helvetica')
      .fontSize(8.5)
      .fillColor(C.slateMuted);

    let custY = y + 38;
    if (customerMobile) {
      doc.text(`Mobile: +91 ${customerMobile}`, margin + 12, custY);
      custY += 12;
    }
    if (!bill.isWalkIn && bill.clientAddressSnapshot) {
      doc.text(bill.clientAddressSnapshot, margin + 12, custY, { width: cardW - 24, height: 20 });
    }

    // Pet / Service Card
    const petX = margin + cardW + 15;
    if (bill.petNameSnapshot) {
      doc.rect(petX, y, cardW, cardH).fill(C.accentOrangeBg);
      doc.rect(petX, y, cardW, cardH).strokeColor('#ffedd5').stroke();

      doc.fillColor(C.accentOrange)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('PET & SERVICE DETAILS', petX + 12, y + 10);

      doc.fillColor(C.slateDark)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(bill.petNameSnapshot, petX + 12, y + 23, { width: cardW - 24 });

      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor(C.slateMuted)
        .text(`Pet ID: ${bill.petIdSnapshot || 'N/A'}`, petX + 12, y + 38);

      if (bill.createdBy?.name) {
        doc.text(`Billed By: ${bill.createdBy.name}`, petX + 12, y + 50);
      }
    } else {
      doc.rect(petX, y, cardW, cardH).fill(C.slateLight);
      doc.rect(petX, y, cardW, cardH).strokeColor(C.borderLight).stroke();

      doc.fillColor(C.slateMuted)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('SALE TYPE', petX + 12, y + 10);

      doc.fillColor(C.slateDark)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Direct Product Sale', petX + 12, y + 24);

      if (bill.createdBy?.name) {
        doc.font('Helvetica')
          .fontSize(8.5)
          .fillColor(C.slateMuted)
          .text(`Billed By: ${bill.createdBy.name}`, petX + 12, y + 42);
      }
    }

    y += cardH + 15;

    // ─── 3. ITEMS TABLE HEADER ────────────────────────────────────────
    // Total Printable Width = 525 pt
    // Column widths: S.No (25), Product (175), Code (65), Qty (35), Unit Price (65), Disc (45), GST (40), Total (75) = 525 pt
    const cols = {
      sno:   { x: margin,       w: 25,  align: 'center' },
      prod:  { x: margin + 25,  w: 175, align: 'left' },
      code:  { x: margin + 200, w: 65,  align: 'center' },
      qty:   { x: margin + 265, w: 35,  align: 'center' },
      price: { x: margin + 300, w: 65,  align: 'right' },
      disc:  { x: margin + 365, w: 45,  align: 'right' },
      gst:   { x: margin + 410, w: 40,  align: 'right' },
      total: { x: margin + 450, w: 75,  align: 'right' },
    };

    const headerH = 22;
    doc.rect(margin, y, pageWidth, headerH).fill(C.navy);

    doc.fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(8);

    doc.text('#', cols.sno.x, y + 6, { width: cols.sno.w, align: cols.sno.align });
    doc.text('PRODUCT NAME', cols.prod.x + 4, y + 6, { width: cols.prod.w - 4, align: cols.prod.align });
    doc.text('CODE', cols.code.x, y + 6, { width: cols.code.w, align: cols.code.align });
    doc.text('QTY', cols.qty.x, y + 6, { width: cols.qty.w, align: cols.qty.align });
    doc.text('PRICE', cols.price.x, y + 6, { width: cols.price.w - 4, align: cols.price.align });
    doc.text('DISC', cols.disc.x, y + 6, { width: cols.disc.w - 4, align: cols.disc.align });
    doc.text('GST %', cols.gst.x, y + 6, { width: cols.gst.w - 4, align: cols.gst.align });
    doc.text('AMOUNT', cols.total.x, y + 6, { width: cols.total.w - 4, align: cols.total.align });

    y += headerH;

    // ─── 4. TABLE ROWS ────────────────────────────────────────────────
    bill.items.forEach((item, index) => {
      const rowH = 22;
      const rowBg = index % 2 === 0 ? C.white : C.slateLight;

      doc.rect(margin, y, pageWidth, rowH).fill(rowBg);
      doc.rect(margin, y, pageWidth, rowH).strokeColor(C.borderLight).stroke();

      const textY = y + 6;
      doc.fillColor(C.slateDark).font('Helvetica').fontSize(8);

      doc.text(String(index + 1), cols.sno.x, textY, { width: cols.sno.w, align: cols.sno.align });
      doc.font('Helvetica-Bold').text(item.productNameSnapshot, cols.prod.x + 4, textY, { width: cols.prod.w - 8, lineBreak: false });
      doc.font('Helvetica').text(item.productCodeSnapshot || '-', cols.code.x, textY, { width: cols.code.w, align: cols.code.align });
      doc.text(String(item.quantity), cols.qty.x, textY, { width: cols.qty.w, align: cols.qty.align });
      doc.text(formatCurrency(item.unitPrice), cols.price.x, textY, { width: cols.price.w - 4, align: cols.price.align });

      const discStr = item.discount > 0 ? formatCurrency(item.discount) : '-';
      doc.text(discStr, cols.disc.x, textY, { width: cols.disc.w - 4, align: cols.disc.align });

      doc.text(`${item.gstRate}%`, cols.gst.x, textY, { width: cols.gst.w - 4, align: cols.gst.align });

      doc.font('Helvetica-Bold')
        .text(formatCurrency(item.lineTotal), cols.total.x, textY, { width: cols.total.w - 4, align: cols.total.align });

      y += rowH;
    });

    y += 15;

    // ─── 5. SUMMARY & PAYMENT SECTION ─────────────────────────────────
    const summaryW = 210;
    const summaryX = margin + pageWidth - summaryW;
    const paymentW = pageWidth - summaryW - 15;

    // Payment Info Card (Left)
    const payH = 90;
    doc.rect(margin, y, paymentW, payH).fill(C.slateLight);
    doc.rect(margin, y, paymentW, payH).strokeColor(C.borderLight).stroke();

    doc.fillColor(C.bluePrimary)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('PAYMENT DETAILS', margin + 12, y + 10);

    doc.font('Helvetica')
      .fontSize(8.5)
      .fillColor(C.slateDark);

    doc.text(`Payment Mode: `, margin + 12, y + 26);
    doc.font('Helvetica-Bold').text(bill.paymentMethod || 'CASH', margin + 85, y + 26);

    doc.font('Helvetica').text(`Payment Status: `, margin + 12, y + 40);
    doc.font('Helvetica-Bold').fillColor(C.successGreen).text(bill.paymentStatus || 'PAID', margin + 85, y + 40);

    if (bill.paymentReference) {
      doc.fillColor(C.slateDark).font('Helvetica').text(`Reference Ref: `, margin + 12, y + 54);
      doc.font('Helvetica-Bold').text(bill.paymentReference, margin + 85, y + 54);
    }

    doc.font('Helvetica').fillColor(C.slateMuted).fontSize(7.5)
      .text('• Prices are inclusive of GST taxes where applicable.', margin + 12, y + 72);

    // Totals Box (Right)
    const drawTotalsRow = (label, val, isBold = false, isHighlight = false) => {
      if (isHighlight) {
        doc.rect(summaryX, y, summaryW, 26).fill(C.navy);
        doc.fillColor(C.white)
          .font('Helvetica-Bold')
          .fontSize(10);
        doc.text(label, summaryX + 10, y + 7, { width: 100 });
        doc.text(val, summaryX + 100, y + 7, { width: summaryW - 110, align: 'right' });
        y += 26;
      } else {
        doc.rect(summaryX, y, summaryW, 18).fill(isBold ? '#eff6ff' : C.white);
        doc.rect(summaryX, y, summaryW, 18).strokeColor(C.borderLight).stroke();
        doc.fillColor(isBold ? C.navy : C.slateMuted)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5);
        doc.text(label, summaryX + 10, y + 4, { width: 100 });
        doc.text(val, summaryX + 100, y + 4, { width: summaryW - 110, align: 'right' });
        y += 18;
      }
    };

    drawTotalsRow('Subtotal', formatCurrency(bill.subtotal));
    if (bill.totalDiscount > 0) {
      drawTotalsRow('Discount', `- ${formatCurrency(bill.totalDiscount)}`);
    }

    if (bill.gstAmount > 0) {
      const halfGst = bill.gstAmount / 2;
      drawTotalsRow('CGST', formatCurrency(halfGst));
      drawTotalsRow('SGST', formatCurrency(halfGst));
    } else {
      drawTotalsRow('GST Tax', 'Rs. 0.00');
    }

    drawTotalsRow('GRAND TOTAL', formatCurrency(bill.grandTotal), true, true);

    y += 25;

    // ─── 6. FOOTER SECTION ────────────────────────────────────────────
    doc.moveTo(margin, y).lineTo(rightMarginX, y).strokeColor(C.border).stroke();
    y += 10;

    doc.fillColor(C.bluePrimary)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(`Thank you for choosing ${businessName}!`, margin, y, { width: pageWidth, align: 'center' });
    y += 14;

    doc.fillColor(C.slateMuted)
      .font('Helvetica')
      .fontSize(7.5)
      .text('This is a computer-generated tax invoice. No physical signature is required.', margin, y, { width: pageWidth, align: 'center' });
    y += 10;

    doc.text(`For support or queries, contact us at ${businessPhone}  |  ${businessEmail}`, margin, y, { width: pageWidth, align: 'center' });

    doc.end();
  });
};

const generateThermalInvoicePDF = (bill) => {
  return new Promise((resolve, reject) => {
    const businessName = process.env.BUSINESS_NAME || 'Paws & Care Pet Clinic';
    const businessAddress = process.env.BUSINESS_ADDRESS || '123 Pet Street, Chennai';
    const businessPhone = process.env.BUSINESS_PHONE || '+91 98765 43210';
    const businessEmail = process.env.BUSINESS_EMAIL || 'info@pawsandcare.com';
    const businessGSTIN = process.env.BUSINESS_GSTIN || '';

    const itemCount = bill.items ? bill.items.length : 0;
    const calculatedHeight = Math.max(380, 320 + (itemCount * 30));

    const doc = new PDFDocument({
      size: [216, calculatedHeight], // 3 inches width (216pt), auto length
      margin: 10,
    });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const margin = 10;
    const printableWidth = 216 - 20; // 196 pt

    const drawDashedLine = (yPos) => {
      doc.moveTo(margin, yPos)
         .lineTo(216 - margin, yPos)
         .dash(3, { space: 2 })
         .strokeColor('#94a3b8')
         .stroke()
         .undash();
    };

    let y = 12;

    // ─── BUSINESS HEADER ───
    doc.fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(businessName, margin, y, { width: printableWidth, align: 'center' });
    y += 14;

    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#475569')
      .text(businessAddress, margin, y, { width: printableWidth, align: 'center' });
    y += 10;

    doc.text(`Ph: ${businessPhone}`, margin, y, { width: printableWidth, align: 'center' });
    y += 10;

    if (businessGSTIN) {
      doc.text(`GSTIN: ${businessGSTIN}`, margin, y, { width: printableWidth, align: 'center' });
      y += 10;
    }

    y += 4;
    drawDashedLine(y);
    y += 8;

    // ─── RECEIPT HEADER / INVOICE INFO ───
    doc.fillColor('#0f172a')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('RECEIPT / INVOICE', margin, y, { width: printableWidth, align: 'center' });
    y += 12;

    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#334155');

    doc.text(`Invoice #: ${bill.invoiceNumber}`, margin, y);
    y += 10;
    doc.text(`Date: ${formatDateTime(bill.createdAt)}`, margin, y);
    y += 10;

    const customerName = bill.isWalkIn ? (bill.walkInName || 'Walk-in Customer') : bill.clientNameSnapshot;
    const customerMobile = bill.isWalkIn ? bill.walkInMobile : bill.clientMobileSnapshot;
    doc.text(`Customer: ${customerName}`, margin, y, { width: printableWidth });
    y += 10;
    if (customerMobile) {
      doc.text(`Mobile: ${customerMobile}`, margin, y);
      y += 10;
    }

    if (bill.petNameSnapshot) {
      doc.text(`Pet: ${bill.petNameSnapshot}`, margin, y);
      y += 10;
    }

    y += 4;
    drawDashedLine(y);
    y += 8;

    // ─── ITEMS LIST ───
    doc.font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#0f172a');

    doc.text('ITEM', margin, y, { width: 110 });
    doc.text('QTYxPRICE', margin + 105, y, { width: 50, align: 'right' });
    doc.text('TOTAL', margin + 155, y, { width: 41, align: 'right' });
    y += 12;

    drawDashedLine(y);
    y += 6;

    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#1e293b');

    bill.items.forEach((item) => {
      // Product Name
      doc.font('Helvetica-Bold').text(item.productNameSnapshot, margin, y, { width: printableWidth, height: 10 });
      y += 10;

      // Quantity x Unit Price & Total Amount
      doc.font('Helvetica')
        .fillColor('#475569')
        .text(`${item.quantity} x ${formatCurrency(item.unitPrice)}`, margin, y, { width: 120 });

      doc.font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(formatCurrency(item.lineTotal), margin + 120, y, { width: 76, align: 'right' });

      y += 12;
    });

    y += 4;
    drawDashedLine(y);
    y += 8;

    // ─── TOTALS SUMMARY ───
    const drawSummaryRow = (label, val, isBold = false) => {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isBold ? 9 : 8)
        .fillColor(isBold ? '#0f172a' : '#475569')
        .text(label, margin, y, { width: 100 });

      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isBold ? 9 : 8)
        .fillColor(isBold ? '#0f172a' : '#1e293b')
        .text(val, margin + 100, y, { width: 96, align: 'right' });

      y += isBold ? 14 : 11;
    };

    drawSummaryRow('Subtotal:', formatCurrency(bill.subtotal));
    if (bill.totalDiscount > 0) {
      drawSummaryRow('Discount:', `- ${formatCurrency(bill.totalDiscount)}`);
    }
    if (bill.gstAmount > 0) {
      drawSummaryRow('GST Tax:', formatCurrency(bill.gstAmount));
    }
    drawSummaryRow('GRAND TOTAL:', formatCurrency(bill.grandTotal), true);

    y += 2;
    drawDashedLine(y);
    y += 8;

    // ─── PAYMENT & FOOTER ───
    doc.font('Helvetica')
      .fontSize(7.5)
      .fillColor('#334155');

    doc.text(`Payment Mode: ${bill.paymentMethod || 'CASH'}`, margin, y);
    doc.text(`Status: ${bill.paymentStatus || 'PAID'}`, margin + 110, y, { width: 86, align: 'right' });
    y += 14;

    doc.font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#0f172a')
      .text('Thank you for visiting!', margin, y, { width: printableWidth, align: 'center' });
    y += 10;

    doc.font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text('Computer Generated Receipt', margin, y, { width: printableWidth, align: 'center' });

    doc.end();
  });
};

module.exports = { generateInvoicePDF, generateThermalInvoicePDF };
