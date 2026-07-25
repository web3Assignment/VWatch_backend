const User = require('./user.model.js');
const Room = require('./room.model.js');
const Participant = require('./participant.model.js');
const ChatMessage = require('./chatMessage.model.js');
const PlaybackLog = require('./playbackLog.model.js');

// User & Room (Host relation)
User.hasMany(Room, { foreignKey: 'hostId', as: 'hostedRooms', onDelete: 'CASCADE' });
Room.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

// User & Room (Many-to-Many via Participant)
User.belongsToMany(Room, { through: Participant, foreignKey: 'userId' });
Room.belongsToMany(User, { through: Participant, foreignKey: 'roomId' });

User.hasMany(Participant, { foreignKey: 'userId', onDelete: 'CASCADE' });
Participant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Room.hasMany(Participant, { foreignKey: 'roomId', onDelete: 'CASCADE' });
Participant.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

// Room & ChatMessage
Room.hasMany(ChatMessage, { foreignKey: 'roomId', as: 'chatMessages', onDelete: 'CASCADE' });
ChatMessage.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages', onDelete: 'CASCADE' });
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Room & PlaybackLog
Room.hasMany(PlaybackLog, { foreignKey: 'roomId', as: 'playbackLogs', onDelete: 'CASCADE' });
PlaybackLog.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

User.hasMany(PlaybackLog, { foreignKey: 'userId', as: 'playbackLogs', onDelete: 'CASCADE' });
PlaybackLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Room,
  Participant,
  ChatMessage,
  PlaybackLog
};
