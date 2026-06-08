import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Use test DB during API tests, otherwise use real one
const mongoUri =
  process.env.NODE_ENV === 'test'
    ? process.env.MONGO_URI_TEST
    : process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

// Session cookie, stored in Mongo so logins survive restarts
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoUri }),
}));

app.use(passport.initialize());
app.use(passport.session());

// Shared demo audio, served statically so seeded projects never touch R2
app.use('/demo-audio', express.static(path.join(__dirname, 'seed/demo-audio')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Database connection
mongoose
  .connect(mongoUri)
  .then(() =>
    console.log(`MongoDB connected (${process.env.NODE_ENV === 'test' ? 'test' : 'dev'})`)
  )
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
