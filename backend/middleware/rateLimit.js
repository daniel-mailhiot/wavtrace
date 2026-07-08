import { rateLimit } from 'express-rate-limit';

// Counters live in memory and reset on restart
// Skip in tests since newman does requests back to back
const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
};

// Flood guard for the whole api (project view polls every 3s)
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  limit: 300,
  message: { message: 'Too many requests. Wait a minute and try again' },
});

// Incorect passwords on login
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Too many attempts. Wait 15 minutes and try again' },
});

// Register counts successes to prevent mass account creation
export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { message: 'Too many registrations from this IP. Wait an hour and try again' },
});

// Tighter limit as every upload triggers ffmpeg analysis
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many uploads. Wait 15 minutes and try again' },
});
