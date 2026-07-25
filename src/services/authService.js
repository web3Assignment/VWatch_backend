const { User } = require('../models');
const Hasher = require('../utilities/hasher.js');
const jwt = require('jsonwebtoken');

const registerUser = async (username, emailAddress, password) => {
  const existingUser = await User.findOne({ where: { emailAddress } });
  if (existingUser) {
    throw new Error('Email address already registered.');
  }

  const hashedPassword = await Hasher.generateHash(password);
  const user = await User.create({
    username,
    emailAddress,
    password: hashedPassword
  });

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

const loginWithEmail = async (emailAddress, password) => {
  const user = await User.findOne({ where: { emailAddress } });
  if (!user || !(await Hasher.comparePassword(password, user.password))) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecretwatchpartykey', {
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
  registerUser,
  loginWithEmail
};
