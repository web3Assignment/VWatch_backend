const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./src/routes/v1/index.js');
const logger = require('./src/utilities/logger.js');
const { swaggerUi, swaggerSpec } = require('./src/config/swagger.js');

const app = express();

// Security HTTP headers (bypassing CSP for Swagger UI compatibility)
app.use(helmet({
  contentSecurityPolicy: false
}));

// Hide technology stack signatures
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.removeHeader('Server');
  next();
});

// Enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://vchat-sigma.vercel.app'
];
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigin === '*' || allowedOrigins.includes(origin) || origin === corsOrigin) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse json request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount API routes
app.use('/api/v1', routes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`"app.js","GlobalErrorMiddleware","Unhandled error: ${err.message}"`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
