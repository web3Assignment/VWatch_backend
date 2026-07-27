const rateLimit = require('express-rate-limit');

// General route rate limiter: 100 requests per 1 minute
const standardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 1 minute.'
  }
});

// Specific rate limiter for OTP requests: 10 requests per 1 minute
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 minute.'
  }
});

module.exports = {
  standardLimiter,
  otpLimiter
};
