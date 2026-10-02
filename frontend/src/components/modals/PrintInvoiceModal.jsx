import { useState } from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { billingAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

export default function PrintInvoiceModal({ isOpen, onClose, bill }) {
  if (!isOpen || !bill) return null;

  const handleA4Print = () => {
    billingAPI.printPdf(bill._id, 'a4');
    onClose();
  };

  const handleThermalPDFPrint = () => {
    billingAPI.printPdf(bill._id, 'thermal');
    onClose();
  };

  const handleThermalWebPrint = () => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      // Fallback to PDF if popup blocked
      billingAPI.printPdf(bill._id, 'thermal');
      onClose();
      return;
    }

    const businessName = 'Paws & Care Pet Clinic';
    const businessAddress = '123 Pet Street, Chennai';
    const businessPhone = '+91 98765 43210';
    const customerName = bill.isWalkIn ? (bill.walkInName || 'Walk-in Customer') : bill.clientNameSnapshot;
    const customerMobile = bill.isWalkIn ? bill.walkInMobile : bill.clientMobileSnapshot;

    const itemsHtml = (bill.items || []).map(item => `
      <div style="margin-bottom: 6px;">
        <div style="font-weight: bold; font-size: 11px;">${item.productNameSnapshot}</div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #333;">
          <span>${item.quantity} x ₹${Number(item.unitPrice).toFixed(2)}</span>
          <span style="font-weight: bold;">₹${Number(item.lineTotal).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${bill.invoiceNumber}</title>
        <style>
          @page {
            size: 3in auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 3in;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .dashed { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
          .header { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .sub-header { font-size: 10px; margin-bottom: 2px; }
          .footer { font-size: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="header">🐾 ${businessName}</div>
          <div class="sub-header">${businessAddress}</div>
          <div class="sub-header">Ph: ${businessPhone}</div>
        </div>
        <div class="dashed"></div>
        <div class="text-center bold" style="font-size: 11px;">POS RECEIPT</div>
        <div class="row"><span>Invoice:</span><span class="bold">${bill.invoiceNumber}</span></div>
        <div class="row"><span>Date:</span><span>${formatDateTime(bill.createdAt)}</span></div>
        <div class="row"><span>Customer:</span><span class="bold">${customerName}</span></div>
        ${customerMobile ? `<div class="row"><span>Mobile:</span><span>${customerMobile}</span></div>` : ''}
        ${bill.petNameSnapshot ? `<div class="row"><span>Pet:</span><span>${bill.petNameSnapshot}</span></div>` : ''}
        <div class="dashed"></div>
        <div class="row bold"><span>ITEM</span><span>TOTAL</span></div>
        <div class="dashed"></div>
        ${itemsHtml}
        <div class="dashed"></div>
        <div class="row"><span>Subtotal:</span><span>₹${Number(bill.subtotal || 0).toFixed(2)}</span></div>
        ${bill.totalDiscount > 0 ? `<div class="row"><span>Discount:</span><span>-₹${Number(bill.totalDiscount).toFixed(2)}</span></div>` : ''}
        ${bill.gstAmount > 0 ? `<div class="row"><span>GST:</span><span>₹${Number(bill.gstAmount).toFixed(2)}</span></div>` : ''}
        <div class="row bold" style="font-size: 13px; margin-top: 4px;">
          <span>GRAND TOTAL:</span>
          <span>₹${Number(bill.grandTotal || 0).toFixed(2)}</span>
        </div>
        <div class="dashed"></div>
        <div class="row"><span>Payment Mode:</span><span class="bold">${bill.paymentMethod || 'CASH'}</span></div>
        <div class="row"><span>Status:</span><span class="bold">${bill.paymentStatus || 'PAID'}</span></div>
        <div class="dashed"></div>
        <div class="text-center footer">
          <p class="bold">Thank you for visiting!</p>
          <p style="font-size: 9px; color: #555;">Computer Generated Receipt</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-navy-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-700 rounded-lg">
              <PrinterIcon className="h-6 w-6 text-primary-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Print Invoice Options</h3>
              <p className="text-xs text-navy-200">Invoice #: {bill.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700 transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Options Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-slate-600">Select receipt print format:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: A4 Print */}
            <div
              className="border-2 border-slate-200 hover:border-blue-500 rounded-xl p-4 bg-slate-50/50 hover:bg-blue-50/30 transition cursor-pointer flex flex-col justify-between group"
              onClick={handleA4Print}
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1">A4 Print</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Full page A4 PDF invoice layout. Best for standard desktop printers & formal record keeping.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm mt-4 w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white">
                <PrinterIcon className="h-4 w-4" /> A4 Print
              </button>
            </div>

            {/* Option 2: Thermal Print (3-inch) */}
            <div
              className="border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-4 bg-slate-50/50 hover:bg-emerald-50/30 transition cursor-pointer flex flex-col justify-between group"
              onClick={handleThermalWebPrint}
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  🧾
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800 text-base">Thermal Print</h4>
                  <span className="badge badge-emerald text-[10px]">3 Inch / 80mm</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Template width is exactly 3 inches (80mm) with automatic length. Optimized for POS receipt printers.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleThermalWebPrint(); }}
                  className="btn btn-emerald btn-sm w-full gap-2"
                >
                  <PrinterIcon className="h-4 w-4" /> Thermal Print (3")
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleThermalPDFPrint(); }}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 w-full text-center block underline"
                >
                  Open 3-Inch Thermal PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
