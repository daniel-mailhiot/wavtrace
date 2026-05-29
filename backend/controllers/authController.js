import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: user._id, name: user.name, email: user.email });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email });
};

// POST /api/auth/logout
export const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: 'Logged out' });
  });
};

// GET /api/auth/me
export const me = (req, res) => {
  res.json(req.user);
};
