const Joi = require('joi');
const logger = require('../utilities/logger.js');

const createRoomSchema = Joi.object().keys({
  title: Joi.string().min(3).max(100).required(),
  initialVideoId: Joi.string().length(11).optional()
});

const createRoomValidation = async (req, res, next) => {
  const { error } = createRoomSchema.validate(req.body);
  if (error) {
    logger.error(`"room.validation.js","createRoomValidation()","Error: ${error.message}"`);
    return res.status(406).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = {
  createRoomValidation
};
