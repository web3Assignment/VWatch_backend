const express = require('express');
const authRoute = require('./auth.route.js');
const roomRoute = require('./room.route.js');
const chatbotRoute = require('./chatbot.route.js');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/rooms', roomRoute);
router.use('/chat', chatbotRoute);

module.exports = router;
