const { DataTypes } = require('sequelize');
const db = require('../config/sequelize.js');

const PlaybackLog = db.define('playback_logs', {
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
  action: {
    type: DataTypes.ENUM('PLAY', 'PAUSE', 'SEEK', 'CHANGE_VIDEO'),
    allowNull: false
  },
  videoId: {
    type: DataTypes.STRING(11),
    allowNull: false,
    field: 'video_id'
  },
  actionTimestamp: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'action_timestamp'
  }
}, {
  tableName: 'playback_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = PlaybackLog;
