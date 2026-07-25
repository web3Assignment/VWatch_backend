const { DataTypes } = require('sequelize');
const db = require('../config/sequelize.js');

const Participant = db.define('participants', {
  roomId: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: 'room_id'
  },
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: 'user_id'
  },
  role: {
    type: DataTypes.ENUM('HOST', 'MODERATOR', 'PARTICIPANT', 'VIEWER'),
    defaultValue: 'PARTICIPANT',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'DISCONNECTED'),
    defaultValue: 'ACTIVE',
    allowNull: false
  }
}, {
  tableName: 'participants',
  timestamps: true,
  createdAt: 'joined_at',
  updatedAt: 'updated_at'
});

module.exports = Participant;
