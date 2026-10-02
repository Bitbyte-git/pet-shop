const purchaseService = require('../services/purchase.service');

const createPurchase = async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.body, req.user._id, req.user.name);
  res.status(201).json({ success: true, message: 'Purchase created and stock updated.', purchase });
};

const getPurchases = async (req, res) => {
  const result = await purchaseService.getPurchases(req.query);
  res.json({ success: true, ...result });
};

const getPurchaseById = async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(req.params.id);
  res.json({ success: true, purchase });
};

module.exports = { createPurchase, getPurchases, getPurchaseById };
