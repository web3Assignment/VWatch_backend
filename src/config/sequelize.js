const { Sequelize } = require('sequelize');
const config = require('./config.js');

const env = process.env.NODE_ENV || 'local';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
    pool: {
      max: 15,
      min: 2,
      acquire: 60000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
