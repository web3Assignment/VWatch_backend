const { DataTypes } = require('sequelize');
const db = require('../config/sequelize.js');

const ChatMessage = db.define('chat_messages', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'room_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ChatMessage;
