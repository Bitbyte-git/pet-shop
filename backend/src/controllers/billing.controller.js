const billingService = require('../services/billing.service');

const createProductBill = async (req, res) => {
  const bill = await billingService.createProductBill(req.body, req.user._id, req.user.name);
  res.status(201).json({ success: true, message: 'Bill created successfully.', bill });
};

const getProductBills = async (req, res) => {
  const result = await billingService.getProductBills(req.query);
  res.json({ success: true, ...result });
};

const getProductBillById = async (req, res) => {
  const bill = await billingService.getProductBillById(req.params.id);
  res.json({ success: true, bill });
};

const getInvoicePDF = async (req, res) => {
  const format = req.query.format === 'thermal' ? 'thermal' : 'a4';
  const { pdfBuffer, bill } = await billingService.generateBillPDF(req.params.id, format);
  const dispositionType = req.query.disposition === 'inline' ? 'inline' : 'attachment';
  const filename = format === 'thermal' ? `Receipt-${bill.invoiceNumber}.pdf` : `Invoice-${bill.invoiceNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer);
};

const getCombinedBillingHistory = async (req, res) => {
  const result = await billingService.getCombinedBillingHistory(req.query);
  res.json({ success: true, ...result });
};

module.exports = {
  createProductBill,
  getProductBills,
  getCombinedBillingHistory,
  getProductBillById,
  getInvoicePDF,
};
