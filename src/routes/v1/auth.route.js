const express = require('express');
const authController = require('../../controllers/authController.js');
const authMiddleware = require('../../middlewares/auth.js');
const { registerValidation, loginValidation } = require('../../validations/auth.validation.js');

const router = express.Router();

router.post('/signup', registerValidation, authController.signUp);
router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
