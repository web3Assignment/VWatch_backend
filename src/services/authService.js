const { User, Otp } = require('../models');
const Hasher = require('../utilities/hasher.js');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService.js');

const sendOtp = async (emailAddress) => {
  const existingUser = await User.findOne({ where: { emailAddress } });
  if (existingUser) {
    throw new Error('Email address already registered.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.destroy({ where: { emailAddress } });
  await Otp.create({
    emailAddress,
    otp,
    expiresAt
  });

  await emailService.sendOtpEmail(emailAddress, otp);

  return { emailAddress };
};

const registerUser = async (username, emailAddress, password, otp) => {
  const existingUser = await User.findOne({ where: { emailAddress } });
  if (existingUser) {
    throw new Error('Email address already registered.');
  }

  const otpRecord = await Otp.findOne({ where: { emailAddress } });
  if (!otpRecord) {
    throw new Error('Verification code not found. Please request a new OTP code.');
  }

  if (otpRecord.otp !== otp) {
    throw new Error('Invalid verification code.');
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new Error('Verification code has expired. Please request a new one.');
  }

  const hashedPassword = await Hasher.generateHash(password);
  const user = await User.create({
    username,
    emailAddress,
    password: hashedPassword
  });

  await otpRecord.destroy();

  return {
    user: {
      id: user.id,
      username: user.username,
      emailAddress: user.emailAddress
    }
  };
};

const loginWithEmail = async (emailAddress, password) => {
  const user = await User.findOne({ where: { emailAddress } });
  if (!user || !(await Hasher.comparePassword(password, user.password))) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      emailAddress: user.emailAddress
    },
    token
  };
};

module.exports = {
  sendOtp,
  registerUser,
  loginWithEmail
};
