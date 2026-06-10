import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../models/User.js';
import { seedDemoProject } from '../seed/demoProject.js';
import { canStoreFiles } from '../lib/r2.js';

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

    req.login(user, async (err) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      // Seed a populated demo project and keep signup working even if it throws
      try {
        await seedDemoProject(user._id);
      } catch (seedErr) {
        console.error('Demo seed failed:', seedErr);
      }
      // hasStorage tells the frontend whether uploads from this account get kept in R2
      res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        hasStorage: canStoreFiles(user.email),
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    req.login(user, (loginErr) => {
      if (loginErr) return res.status(500).json({ message: 'Server error' });
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        hasStorage: canStoreFiles(user.email),
      });
    });
  })(req, res, next);
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
  const { _id, name, email } = req.user;
  res.json({ id: _id, name, email, hasStorage: canStoreFiles(email) });
};
