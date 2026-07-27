const express = require('express');
const authController = require('../../controllers/authController.js');
const authMiddleware = require('../../middlewares/auth.js');
const { registerValidation, loginValidation, sendOtpValidation } = require('../../validations/auth.validation.js');
const { standardLimiter, otpLimiter } = require('../../middlewares/rateLimiter.js');

const router = express.Router();

router.post('/send-otp', otpLimiter, sendOtpValidation, authController.sendOtp);
router.post('/signup', standardLimiter, registerValidation, authController.signUp);
router.post('/login', standardLimiter, loginValidation, authController.login);
router.get('/me', standardLimiter, authMiddleware, authController.getMe);

module.exports = router;
