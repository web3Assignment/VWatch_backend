const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utilities/logger.js');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`"auth.js","authMiddleware()","Error: ${error.message}"`);
    return res.status(401).json({ success: false, message: 'Unauthorized access.' });
  }
};

module.exports = authMiddleware;
