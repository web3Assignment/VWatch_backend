const { Room, User, Participant, ChatMessage, PlaybackLog } = require('../models');

const createRoom = async (hostId, title, initialVideoId) => {
  const room = await Room.create({
    hostId,
    title,
    currentVideoId: initialVideoId || 'dQw4w9WgXcQ'
  });

  // Create initial participant entry as HOST
  await Participant.create({
    roomId: room.id,
    userId: hostId,
    role: 'HOST',
    status: 'ACTIVE'
  });

  return room;
};

const getRoomById = async (roomId) => {
  return Room.findByPk(roomId, {
    include: [
      {
        model: User,
        as: 'host',
        attributes: ['id', 'username']
      },
      {
        model: Participant,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      }
    ]
  });
};

const getActiveRooms = async () => {
  return Room.findAll({
    include: [
      {
        model: User,
        as: 'host',
        attributes: ['username']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

const saveChatMessage = async (roomId, userId, message) => {
  return ChatMessage.create({
    roomId,
    userId,
    message
  });
};

const getChatHistory = async (roomId) => {
  return ChatMessage.findAll({
    where: { roomId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }
    ],
    order: [['created_at', 'ASC']],
    limit: 100
  });
};

const getPlaybackLogs = async (roomId) => {
  return PlaybackLog.findAll({
    where: { roomId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: 50
  });
};

module.exports = {
  createRoom,
  getRoomById,
  getActiveRooms,
  saveChatMessage,
  getChatHistory,
  getPlaybackLogs
};
