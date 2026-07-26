const http = require('http');
const { Server } = require('socket.io');
const app = require('./app.js');
const sequelize = require('./src/config/sequelize.js');
const registerSocketHandlers = require('./src/websockets/socketHandlers.js');
const logger = require('./src/utilities/logger.js');

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Authenticate and Synchronize Database
    await sequelize.authenticate();
    logger.info('"server.js","startServer()","VWatch Database connected successfully"');
    
    // Synchronize models (alter: true maps models changes to tables)
    await sequelize.sync({ alter: false });
    logger.info('"server.js","startServer()","Database models synchronized"');

    const server = http.createServer(app);
    const allowedOrigins = [
      'http://localhost:5173',
      'https://vchat-sigma.vercel.app'
    ];
    const corsOrigin = process.env.CORS_ORIGIN || '*';

    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (corsOrigin === '*' || allowedOrigins.includes(origin) || origin === corsOrigin) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        methods: ['GET', 'POST']
      }
    });

    // Bind real-time socket events
    registerSocketHandlers(io);

    // 3. Listen on port
    server.listen(port, () => {
      logger.info(`"server.js","startServer()","Server running on port ${port}"`);
    });
  } catch (error) {
    logger.error(`"server.js","startServer()","Initialization failed: ${error.message}"`);
    process.exit(1);
  }
}

startServer();
