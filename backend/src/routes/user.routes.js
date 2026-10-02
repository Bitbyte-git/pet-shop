const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, createUser, updateUser, changePassword, toggleUserStatus } = require('../controllers/user.controller');

router.use(protect);
router.get('/', authorize('ADMIN'), getUsers);
router.post('/', authorize('ADMIN'), createUser);
router.put('/change-password', changePassword);
router.put('/:id', authorize('ADMIN'), updateUser);
router.patch('/:id/toggle-status', authorize('ADMIN'), toggleUserStatus);

module.exports = router;
