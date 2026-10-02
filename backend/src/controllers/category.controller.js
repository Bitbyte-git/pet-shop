const ProductCategory = require('../models/ProductCategory');

const getCategories = async (req, res) => {
  const categories = await ProductCategory.find({ status: 'ACTIVE' }).sort({ name: 1 });
  res.json({ success: true, categories });
};

const createCategory = async (req, res) => {
  const category = await ProductCategory.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Category created.', category });
};

const updateCategory = async (req, res) => {
  const category = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, message: 'Category updated.', category });
};

const deleteCategory = async (req, res) => {
  const category = await ProductCategory.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' }, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, message: 'Category deactivated.' });
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
