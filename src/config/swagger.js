const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YouTube Watch Party API',
      version: '1.0.0',
      description: 'API documentation for the YouTube Watch Party real-time synchronized backend API.',
    },
    servers: [
      {
        url: 'https://saurabhsrivastav.dev/api/v1',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/auth/signup': {
        post: {
          summary: 'Register a new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'emailAddress', 'password'],
                  properties: {
                    username: { type: 'string', example: 'john_doe' },
                    emailAddress: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', format: 'password', example: 'securePassword123' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Bad request / Email already registered' }
          }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Log in an existing user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['emailAddress', 'password'],
                  properties: {
                    emailAddress: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', format: 'password', example: 'securePassword123' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/auth/me': {
        get: {
          summary: 'Get profile of logged-in user',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user profile details' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/rooms': {
        post: {
          summary: 'Create a new Watch Room',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Friday Night Anime Party' },
                    initialVideoId: { type: 'string', example: 'dQw4w9WgXcQ' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Room created successfully' },
            401: { description: 'Unauthorized' }
          }
        },
        get: {
          summary: 'Get list of active Watch Rooms',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of rooms returned successfully' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/rooms/{roomId}': {
        get: {
          summary: 'Get details of a specific room',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'roomId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: { description: 'Room details returned successfully' },
            404: { description: 'Room not found' }
          }
        }
      },
      '/rooms/{roomId}/chat': {
        get: {
          summary: 'Get recent chat message logs of a specific room',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'roomId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: { description: 'Chat history returned successfully' }
          }
        }
      },
      '/rooms/{roomId}/logs': {
        get: {
          summary: 'Get recent video sync audit logs of a specific room',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'roomId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            200: { description: 'Playback logs returned successfully' }
          }
        }
      }
    }
  },
  apis: [], // Keep route files clean and compile swagger config statically
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
