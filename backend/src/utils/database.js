const knex = require('knex');
const logger = require('./logger');

// Database configuration
const config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'helpme',
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: '../migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: '../seeds',
  },
  debug: process.env.NODE_ENV === 'development',
};

// Create knex instance
const db = knex(config);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connection established successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = db; 