const { Pool } = require('pg');
const { logger } = require('../config/logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on('error', (error) => {
      logger.error('Unexpected PostgreSQL pool error', error);
    });
  }

  return pool;
}

async function testConnection() {
  const client = await getPool().connect();

  try {
    const result = await client.query('SELECT NOW() AS server_time');
    logger.info(`PostgreSQL connected: ${result.rows[0].server_time}`);
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  testConnection
};
