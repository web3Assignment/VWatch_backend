const authService = require('../services/authService.js');
const logger = require('../utilities/logger.js');

const signUp = async (req, res) => {
  try {
    const { username, emailAddress, password } = req.body;
    const result = await authService.registerUser(username, emailAddress, password);
    
    logger.info(`"authController.js","signUp()","User registered: ${emailAddress}"`);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error(`"authController.js","signUp()","Error: ${error.message}"`);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const result = await authService.loginWithEmail(emailAddress, password);

    logger.info(`"authController.js","login()","User logged in: ${emailAddress}"`);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(`"authController.js","login()","Error: ${error.message}"`);
    return res.status(401).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    return res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        emailAddress: req.user.emailAddress,
        createdAt: req.user.created_at
      }
    });
  } catch (error) {
    logger.error(`"authController.js","getMe()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  signUp,
  login,
  getMe
};
