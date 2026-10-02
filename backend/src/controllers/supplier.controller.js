const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  const { search } = req.query;
  const filter = { status: 'ACTIVE' };
  if (search) filter.name = { $regex: search, $options: 'i' };
  const suppliers = await Supplier.find(filter).sort({ name: 1 });
  res.json({ success: true, suppliers });
};

const createSupplier = async (req, res) => {
  const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Supplier created.', supplier });
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
  res.json({ success: true, message: 'Supplier updated.', supplier });
};

module.exports = { getSuppliers, createSupplier, updateSupplier };
