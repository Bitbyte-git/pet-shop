const mongoose = require('mongoose');
const ProductBilling = require('../models/ProductBilling');
const ClinicBilling = require('../models/ClinicBilling');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Pet = require('../models/Pet');
const { deductStock } = require('./inventory.service');
const { generateInvoicePDF, generateThermalInvoicePDF } = require('../utils/pdfGenerator');

/**
 * CRITICAL: All calculations are performed on the backend.
 * Frontend totals are NEVER trusted.
 */
const createProductBill = async (data, userId, userName) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      isWalkIn,
      clientId,
      walkInName,
      walkInMobile,
      petId,
      items,
      overallDiscount = 0,
      paymentMethod,
      paymentReference,
      paidAmount,
      notes,
    } = data;

    // ─── 1. Validate Customer ─────────────────────────────────────────
    let clientNameSnapshot = '';
    let clientMobileSnapshot = '';
    let clientAddressSnapshot = '';
    let clientRef = null;

    if (isWalkIn) {
      if (!walkInName || !walkInName.trim()) throw { statusCode: 400, message: 'Walk-in customer name is required.' };
      clientNameSnapshot = walkInName.trim();
      clientMobileSnapshot = walkInMobile ? walkInMobile.trim() : '';

      let existingClient = null;
      if (clientMobileSnapshot) {
        existingClient = await Client.findOne({ mobile: clientMobileSnapshot }).session(session);
      }

      if (existingClient) {
        clientRef = existingClient._id;
        clientAddressSnapshot = existingClient.address || '';
      } else {
        // Automatically convert walk-in customer into a registered Client
        const mobileToSave = clientMobileSnapshot || `99${Date.now().toString().slice(-8)}`;
        const [newClient] = await Client.create(
          [
            {
              name: clientNameSnapshot,
              mobile: mobileToSave,
              notes: 'Registered automatically from Walk-in Purchase',
              createdBy: userId,
            },
          ],
          { session }
        );
        clientRef = newClient._id;
        clientMobileSnapshot = newClient.mobile;
      }
    } else {
      if (!clientId) throw { statusCode: 400, message: 'Client selection is required.' };
      const client = await Client.findById(clientId).session(session);
      if (!client) throw { statusCode: 404, message: 'Selected client not found.' };
      clientRef = client._id;
      clientNameSnapshot = client.name;
      clientMobileSnapshot = client.mobile;
      clientAddressSnapshot = client.address || '';
    }

    // ─── 2. Validate Pet (optional) ───────────────────────────────────
    let petRef = null;
    let petNameSnapshot = '';
    let petIdSnapshot = '';
    if (petId) {
      const pet = await Pet.findById(petId);
      if (!pet) throw { statusCode: 404, message: 'Selected pet not found.' };
      petRef = pet._id;
      petNameSnapshot = pet.name;
      petIdSnapshot = pet.petId;
    }

    // ─── 3. Validate & Recalculate all items from backend DB ─────────
    if (!items || items.length === 0) {
      throw { statusCode: 400, message: 'At least one product is required.' };
    }

    const billingItems = [];
    let subtotal = 0;
    let totalGST = 0;

    for (const item of items) {
      if (!item.productId) throw { statusCode: 400, message: 'Product ID is required for each item.' };
      if (!item.quantity || item.quantity < 1) throw { statusCode: 400, message: 'Quantity must be at least 1.' };

      // Fetch authoritative product data from DB
      const product = await Product.findById(item.productId);
      if (!product) throw { statusCode: 404, message: `Product not found: ${item.productId}` };
      if (product.status !== 'ACTIVE') throw { statusCode: 400, message: `Product "${product.name}" is not active.` };

      // ─── Expiry check ────────────────────────────────────────────
      if (product.expiryDate) {
        const now = new Date();
        if (new Date(product.expiryDate) < now) {
          throw { statusCode: 400, message: `Product "${product.name}" has expired and cannot be sold.` };
        }
      }

      // ─── Stock check ─────────────────────────────────────────────
      if (product.currentStock < item.quantity) {
        throw {
          statusCode: 400,
          message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
        };
      }

      // ─── Backend price calculation ────────────────────────────────
      const unitPrice = product.sellingPrice;
      const itemDiscount = Number(item.discount || 0);
      const gstRate = product.gstRate || 0;

      // GST is calculated on the discounted price
      const priceAfterDiscount = unitPrice * item.quantity - itemDiscount;
      const gstAmount = parseFloat(((priceAfterDiscount * gstRate) / 100).toFixed(2));
      const lineTotal = parseFloat((priceAfterDiscount + gstAmount).toFixed(2));

      subtotal += unitPrice * item.quantity;
      totalGST += gstAmount;

      billingItems.push({
        product: product._id,
        productNameSnapshot: product.name,
        productCodeSnapshot: product.productCode,
        quantity: item.quantity,
        unitPrice,
        gstRate,
        gstAmount,
        discount: itemDiscount,
        lineTotal,
      });
    }

    // Apply overall discount
    const totalDiscount = parseFloat((overallDiscount || 0).toFixed(2));
    const grandTotal = parseFloat((subtotal + totalGST - totalDiscount).toFixed(2));

    // ─── 4. Validate Payment ─────────────────────────────────────────
    if (!['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
      throw { statusCode: 400, message: 'Invalid payment method.' };
    }

    // ─── 5. Create billing record ─────────────────────────────────────
    const [bill] = await ProductBilling.create(
      [
        {
          isWalkIn,
          client: clientRef,
          clientNameSnapshot,
          clientMobileSnapshot,
          clientAddressSnapshot,
          walkInName: isWalkIn ? walkInName : undefined,
          walkInMobile: isWalkIn ? walkInMobile : undefined,
          pet: petRef,
          petNameSnapshot,
          petIdSnapshot,
          items: billingItems,
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalDiscount,
          gstAmount: totalGST,
          grandTotal,
          paymentMethod,
          paymentStatus: 'PAID',
          paymentReference: paymentReference || '',
          paidAmount: paidAmount || grandTotal,
          changeAmount: paidAmount ? Math.max(0, paidAmount - grandTotal) : 0,
          notes,
          createdBy: userId,
          createdByName: userName,
        },
      ],
      { session }
    );

    // ─── 6. Deduct inventory ONLY after successful billing ────────────
    for (const item of billingItems) {
      await deductStock(
        item.product,
        item.quantity,
        'PRODUCT_BILLING',
        bill._id,
        bill.invoiceNumber,
        userId,
        userName,
        session
      );
    }

    await session.commitTransaction();
    return bill;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getProductBills = async (query = {}) => {
  const { search, paymentStatus, paymentMethod, createdBy, page = 1, limit = 20, startDate, endDate } = query;
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (createdBy) filter.createdBy = createdBy;
  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { clientNameSnapshot: { $regex: search, $options: 'i' } },
      { walkInName: { $regex: search, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  const skip = (page - 1) * limit;
  const [bills, total] = await Promise.all([
    ProductBilling.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ProductBilling.countDocuments(filter),
  ]);
  return { bills, total, page: Number(page), limit: Number(limit) };
};

const getCombinedBillingHistory = async (query = {}) => {
  const {
    search,
    billType,
    paymentStatus,
    paymentMethod,
    createdBy,
    clientId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = query;

  const productFilter = {};
  const clinicFilter = {};

  if (paymentStatus) {
    productFilter.paymentStatus = paymentStatus;
    if (paymentStatus === 'PAID') clinicFilter.status = 'ACTIVE';
    else if (paymentStatus === 'CANCELLED') clinicFilter.status = 'CANCELLED';
  }
  if (paymentMethod && paymentMethod !== 'ALL') {
    productFilter.paymentMethod = paymentMethod;
  }

  if (createdBy) {
    productFilter.createdBy = createdBy;
    clinicFilter.createdBy = createdBy;
  }

  if (clientId) {
    productFilter.client = clientId;
    clinicFilter.client = clientId;
  }

  if (startDate || endDate) {
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    productFilter.createdAt = dateQuery;
    clinicFilter.createdAt = dateQuery;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    productFilter.$or = [
      { invoiceNumber: regex },
      { clientNameSnapshot: regex },
      { walkInName: regex },
      { petNameSnapshot: regex },
    ];
    clinicFilter.$or = [
      { clinicBillId: regex },
    ];
  }

  let productBills = [];
  let clinicBills = [];

  if (!billType || billType === 'PRODUCT') {
    productBills = await ProductBilling.find(productFilter)
      .populate('createdBy', 'name email role')
      .populate('client', 'name mobile clientId')
      .populate('pet', 'name petId')
      .sort({ createdAt: -1 });
  }

  if (!billType || billType === 'CLINIC') {
    clinicBills = await ClinicBilling.find(clinicFilter)
      .populate('createdBy', 'name email role')
      .populate('client', 'name mobile clientId')
      .populate('pet', 'name petId')
      .sort({ createdAt: -1 });
  }

  const normalizedProduct = productBills.map((b) => ({
    _id: b._id,
    billNumber: b.invoiceNumber,
    billType: 'PRODUCT',
    client: b.client || { name: b.isWalkIn ? b.walkInName : b.clientNameSnapshot },
    clientName: b.isWalkIn ? `${b.walkInName} (Walk-in)` : b.clientNameSnapshot || b.client?.name || 'Walk-in',
    pet: b.pet || { name: b.petNameSnapshot },
    petName: b.petNameSnapshot || b.pet?.name || '—',
    itemsCount: b.items?.length || 0,
    subtotal: b.subtotal,
    gstAmount: b.gstAmount || 0,
    grandTotal: b.grandTotal,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    createdBy: b.createdBy ? b.createdBy : { name: b.createdByName || 'Unknown' },
    createdByName: b.createdByName || b.createdBy?.name || 'Unknown',
    createdAt: b.createdAt,
  }));

  const normalizedClinic = clinicBills.map((b) => ({
    _id: b._id,
    billNumber: b.clinicBillId,
    billType: 'CLINIC',
    client: b.client,
    clientName: b.client?.name || 'Clinic Client',
    pet: b.pet,
    petName: b.pet?.name || '—',
    itemsCount: b.items?.length || 0,
    subtotal: b.totalAmount,
    gstAmount: 0,
    grandTotal: b.totalAmount,
    paymentStatus: b.status === 'ACTIVE' ? 'PAID' : b.status,
    paymentMethod: 'CLINIC_RECORD',
    createdBy: b.createdBy ? b.createdBy : { name: 'Unknown' },
    createdByName: b.createdBy?.name || 'Unknown',
    createdAt: b.createdAt,
  }));

  let combined = [...normalizedProduct, ...normalizedClinic];

  if (search) {
    const s = search.toLowerCase();
    combined = combined.filter((b) =>
      b.billNumber?.toLowerCase().includes(s) ||
      b.clientName?.toLowerCase().includes(s) ||
      b.petName?.toLowerCase().includes(s) ||
      b.createdByName?.toLowerCase().includes(s)
    );
  }

  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = combined.length;
  const skip = (page - 1) * limit;
  const pagedBills = combined.slice(skip, skip + Number(limit));

  return { bills: pagedBills, total, page: Number(page), limit: Number(limit) };
};

const getProductBillById = async (id) => {
  const bill = await ProductBilling.findById(id).populate('createdBy', 'name');
  if (!bill) throw { statusCode: 404, message: 'Invoice not found.' };
  return bill;
};

const generateBillPDF = async (id, format = 'a4') => {
  const bill = await getProductBillById(id);
  const pdfBuffer = format === 'thermal'
    ? await generateThermalInvoicePDF(bill)
    : await generateInvoicePDF(bill);
  return { pdfBuffer, bill };
};

const getTodayStats = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [productBills, clinicBills] = await Promise.all([
    ProductBilling.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'PAID',
    }),
    ClinicBilling.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'ACTIVE',
    }),
  ]);

  const totalProductSales = productBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalGST = productBills.reduce((sum, b) => sum + b.gstAmount, 0);
  const totalClinicSales = clinicBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalSales = totalProductSales + totalClinicSales;

  return {
    totalBills: productBills.length + clinicBills.length,
    totalProductBills: productBills.length,
    totalProductSales,
    totalClinicBills: clinicBills.length,
    totalClinicSales,
    totalSales,
    totalGST,
  };
};

module.exports = {
  createProductBill,
  getProductBills,
  getCombinedBillingHistory,
  getProductBillById,
  generateBillPDF,
  getTodayStats,
};
