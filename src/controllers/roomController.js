const roomService = require('../services/roomService.js');
const logger = require('../utilities/logger.js');

const create = async (req, res) => {
  try {
    const { title, initialVideoId } = req.body;
    const hostId = req.user.id;

    const room = await roomService.createRoom(hostId, title, initialVideoId);
    logger.info(`"roomController.js","create()","Room created: ${room.id} by Host: ${hostId}"`);

    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    logger.error(`"roomController.js","create()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const list = async (req, res) => {
  try {
    const rooms = await roomService.getActiveRooms();
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    logger.error(`"roomController.js","list()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    logger.error(`"roomController.js","getDetails()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await roomService.getChatHistory(roomId);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    logger.error(`"roomController.js","getChatHistory()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getPlaybackLogs = async (req, res) => {
  try {
    const { roomId } = req.params;
    const logs = await roomService.getPlaybackLogs(roomId);
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    logger.error(`"roomController.js","getPlaybackLogs()","Error: ${error.message}"`);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  create,
  list,
  getDetails,
  getChatHistory,
  getPlaybackLogs
};
