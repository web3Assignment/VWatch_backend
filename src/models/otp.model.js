const { DataTypes } = require('sequelize');
const db = require('../config/sequelize.js');

const Otp = db.define('otps', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  emailAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'email_address'
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  tableName: 'otps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Otp;
