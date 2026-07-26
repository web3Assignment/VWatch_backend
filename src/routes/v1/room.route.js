const express = require('express');
const roomController = require('../../controllers/roomController.js');
const authMiddleware = require('../../middlewares/auth.js');
const { createRoomValidation } = require('../../validations/room.validation.js');

const router = express.Router();

router.post('/', authMiddleware, createRoomValidation, roomController.create);
router.get('/', authMiddleware, roomController.list);
router.get('/:roomId', authMiddleware, roomController.getDetails);
router.get('/:roomId/chat', authMiddleware, roomController.getChatHistory);
router.get('/:roomId/logs', authMiddleware, roomController.getPlaybackLogs);
router.delete('/:roomId', authMiddleware, roomController.remove);

module.exports = router;
