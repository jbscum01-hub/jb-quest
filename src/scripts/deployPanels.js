const { createBot } = require('../bot');
const { testConnection } = require('../db/pool');
const { deployProfessionPanels } = require('../handlers/commands/deployPanels.command');
const { logger } = require('../config/logger');

async function main() {
  const client = await createBot();

  client.once('ready', async () => {
    try {
      await testConnection();
      const results = await deployProfessionPanels(client);
      logger.info('Deploy panel results', results);
    } catch (error) {
      logger.error('Deploy panels failed', error);
    } finally {
      await client.destroy();
      process.exit(0);
    }
  });

  await client.login(process.env.BOT_TOKEN);
}

main();
