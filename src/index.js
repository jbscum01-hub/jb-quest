const { createBot } = require('./bot');
const { logger } = require('./config/logger');
const { testConnection } = require('./db/pool');
const { startViewSessionExpiryWorker } = require('./services/viewSessionExpiry.service');

async function bootstrap() {
  try {
    const client = await createBot();
    await testConnection();
    logger.info(`Node version: ${process.version}`);
    await client.login(process.env.BOT_TOKEN);
    await startViewSessionExpiryWorker();
    logger.info('SCUM Quest Bot started successfully');
  } catch (error) {
    logger.error('Failed to start bot', error);
    process.exit(1);
  }
}

bootstrap();
