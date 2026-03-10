const { createBot } = require('./bot');
const { logger } = require('./config/logger');
const { testConnection } = require('./db/pool');

async function bootstrap() {
  try {
    const client = await createBot();
    await testConnection();
    await client.login(process.env.BOT_TOKEN);
    logger.info('SCUM Quest Bot started successfully');
  } catch (error) {
    logger.error('Failed to start bot', error);
    process.exit(1);
  }
}

bootstrap();
