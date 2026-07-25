const { DataTypes } = require('sequelize');
const db = require('../config/sequelize.js');

const Room = db.define('rooms', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  hostId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'host_id'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  currentVideoId: {
    type: DataTypes.STRING(11),
    defaultValue: 'dQw4w9WgXcQ',
    allowNull: false,
    field: 'current_video_id'
  },
  currentPlaybackTime: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false,
    field: 'current_playback_time'
  },
  isPlaying: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_playing'
  }
}, {
  tableName: 'rooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Room;
