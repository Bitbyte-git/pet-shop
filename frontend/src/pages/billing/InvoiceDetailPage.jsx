import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PrintInvoiceModal from '../../components/modals/PrintInvoiceModal';
import { formatCurrency, formatDateTime, formatDate, getPaymentStatusBadge } from '../../utils/helpers';
import { ArrowLeftIcon, DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    billingAPI.getById(id)
      .then((r) => setBill(r.data.bill))
      .catch(() => toast.error('Invoice not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!bill) return <div className="text-center py-20 text-slate-500">Invoice not found.</div>;

  const handleDownload = () => billingAPI.downloadPdf(bill._id, bill.invoiceNumber);

  const businessName = 'Paws & Care Pet Clinic';
  const businessAddress = '123 Pet Street, Chennai, Tamil Nadu 600001';
  const businessPhone = '+91 98765 43210';
  const businessEmail = 'info@pawsandcare.com';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 no-print">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <h1 className="page-title flex-1">Invoice: {bill.invoiceNumber}</h1>
        <button onClick={handleDownload} className="btn btn-primary gap-2">
          <DocumentArrowDownIcon className="h-4 w-4" /> Download PDF
        </button>
        <button onClick={() => setIsPrintModalOpen(true)} className="btn btn-secondary gap-2">
          <PrinterIcon className="h-4 w-4" /> Print Invoice
        </button>
      </div>

      {/* Invoice Preview */}
      <div ref={printRef} className="card max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-navy-700 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold flex items-center gap-2">🐾 {businessName}</div>
              <p className="text-primary-200 text-sm mt-1">{businessAddress}</p>
              <p className="text-primary-200 text-sm">{businessPhone} · {businessEmail}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">INVOICE</div>
              <div className="font-mono font-bold text-primary-300 mt-1">{bill.invoiceNumber}</div>
              <div className="text-primary-200 text-sm">{formatDateTime(bill.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer + Pet */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Bill To</p>
              <p className="font-bold text-slate-800 text-lg">
                {bill.isWalkIn ? (bill.walkInName || 'Walk-in Customer') : bill.clientNameSnapshot}
              </p>
              {(bill.isWalkIn ? bill.walkInMobile : bill.clientMobileSnapshot) && (
                <p className="text-sm text-slate-600">📞 {bill.isWalkIn ? bill.walkInMobile : bill.clientMobileSnapshot}</p>
              )}
              {!bill.isWalkIn && bill.clientAddressSnapshot && (
                <p className="text-sm text-slate-500">{bill.clientAddressSnapshot}</p>
              )}
            </div>
            {bill.petNameSnapshot ? (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs font-semibold text-orange-500 mb-2 uppercase tracking-wide">Pet Details</p>
                <p className="font-bold text-slate-800 text-lg">🐾 {bill.petNameSnapshot}</p>
                <p className="text-sm text-slate-500">ID: {bill.petIdSnapshot}</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 mb-2">Direct Sale</p>
                <p className="text-sm text-slate-400">No pet associated</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Product</th><th>Code</th><th className="text-center">Qty</th>
                  <th className="text-right">Unit Price</th><th className="text-right">Discount</th>
                  <th className="text-right">GST %</th><th className="text-right">GST Amt</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items?.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{item.productNameSnapshot}</td>
                    <td><span className="font-mono text-xs badge badge-slate">{item.productCodeSnapshot}</span></td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right text-red-600">{formatCurrency(item.discount)}</td>
                    <td className="text-right"><span className="badge badge-blue">{item.gstRate}%</span></td>
                    <td className="text-right">{formatCurrency(item.gstAmount)}</td>
                    <td className="text-right font-bold">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(bill.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600">GST</span>
                <span>{formatCurrency(bill.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg bg-primary-700 text-white rounded-xl px-4 py-3">
                <span>Grand Total</span>
                <span>{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Payment Information</p>
                <div className="flex gap-4 text-sm">
                  <span>Method: <strong>{bill.paymentMethod}</strong></span>
                  {bill.paymentReference && <span>Ref: <span className="font-mono">{bill.paymentReference}</span></span>}
                  {bill.paidAmount && <span>Received: <strong>{formatCurrency(bill.paidAmount)}</strong></span>}
                  {bill.changeAmount > 0 && <span>Change: <strong>{formatCurrency(bill.changeAmount)}</strong></span>}
                </div>
              </div>
              <span className={`badge text-sm px-4 py-1.5 ${getPaymentStatusBadge(bill.paymentStatus)}`}>{bill.paymentStatus}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="font-semibold text-primary-700">Thank you for choosing {businessName}!</p>
            <p className="text-xs text-slate-400 mt-1">Computer-generated invoice. For queries: {businessPhone}</p>
          </div>
        </div>
      </div>

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        bill={bill}
      />
    </div>
  );
}
