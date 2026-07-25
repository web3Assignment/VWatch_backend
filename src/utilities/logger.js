const winston = require('winston');
require('winston-daily-rotate-file');
const moment = require('moment-timezone');

const transport = new winston.transports.DailyRotateFile({
  dirname: 'watch-party-logs',
  filename: '%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '60d'
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.printf(({ level, message }) => {
      const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss.SSS');
      return `${timestamp}, [${level.toUpperCase()}], ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    transport
  ]
});

module.exports = logger;
