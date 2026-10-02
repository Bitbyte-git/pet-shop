const User = require('../models/User');

const getUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ success: true, users });
};

const createUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, password and role are required.' });
  }
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });

  const user = await User.create({ name, email, phone, password, role, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'User created successfully.', user });
};

const updateUser = async (req, res) => {
  const { password, ...rest } = req.body; // Don't allow password change via this endpoint
  const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: 'User updated.', user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
};

const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.equals(req.user._id)) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
  user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await user.save();
  res.json({ success: true, message: `User ${user.status === 'ACTIVE' ? 'activated' : 'deactivated'}.`, user });
};

module.exports = { getUsers, createUser, updateUser, changePassword, toggleUserStatus };
