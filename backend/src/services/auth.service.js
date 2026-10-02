const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw { statusCode: 401, message: 'Invalid email or password.' };
  if (user.status !== 'ACTIVE') throw { statusCode: 401, message: 'Account is inactive. Contact admin.' };

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw { statusCode: 401, message: 'Invalid email or password.' };

  const token = generateToken(user._id);
  return { token, user: user.toJSON() };
};

const getMe = async (userId) => {
  return User.findById(userId);
};

module.exports = { login, getMe };
