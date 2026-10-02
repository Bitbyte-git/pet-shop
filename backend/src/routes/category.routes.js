const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('ADMIN'), createCategory);
router.put('/:id', authorize('ADMIN'), updateCategory);
router.delete('/:id', authorize('ADMIN'), deleteCategory);

module.exports = router;
