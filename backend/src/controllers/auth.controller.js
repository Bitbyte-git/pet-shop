const authService = require('../services/auth.service');

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  const result = await authService.login(email, password);
  res.json({ success: true, ...result });
};

const logout = async (req, res) => {
  // JWT stateless - client should remove token
  res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json({ success: true, user });
};

module.exports = { login, logout, getMe };
