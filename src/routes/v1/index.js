const express = require('express');
const authRoute = require('./auth.route.js');
const roomRoute = require('./room.route.js');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/rooms', roomRoute);

module.exports = router;
