const Joi = require('joi');
const logger = require('../utilities/logger.js');

const registerSchema = Joi.object().keys({
  username: Joi.string().min(3).max(30).required(),
  emailAddress: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  otp: Joi.string().length(6).required()
});

const loginSchema = Joi.object().keys({
  emailAddress: Joi.string().email().required(),
  password: Joi.string().required()
});

const sendOtpSchema = Joi.object().keys({
  emailAddress: Joi.string().email().required()
});

const registerValidation = async (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    logger.error(`"auth.validation.js","registerValidation()","Error: ${error.message}"`);
    return res.status(406).json({ success: false, message: error.details[0].message });
  }
  next();
};

const loginValidation = async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.error(`"auth.validation.js","loginValidation()","Error: ${error.message}"`);
    return res.status(406).json({ success: false, message: error.details[0].message });
  }
  next();
};

const sendOtpValidation = async (req, res, next) => {
  const { error } = sendOtpSchema.validate(req.body);
  if (error) {
    logger.error(`"auth.validation.js","sendOtpValidation()","Error: ${error.message}"`);
    return res.status(406).json({ success: false, message: error.details[0].message });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  sendOtpValidation
};
