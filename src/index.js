const { createBot } = require('./bot');
const { logger } = require('./config/logger');

async function bootstrap() {
  try {
    const client = await createBot();
    await client.login(process.env.BOT_TOKEN);
    logger.info('SCUM Quest Bot started successfully');
  } catch (error) {
    logger.error('Failed to start bot', error);
    process.exit(1);
  }
}

bootstrap();
