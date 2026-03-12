const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require('discord.js');

const { loadEnv } = require('./config/env');
const { logger } = require('./config/logger');
const { registerInteractionHandler } = require('./handlers/interactionCreate');
const { autoDeployAdminPanel } = require('./services/adminPanelAutoDeploy.service');

async function createBot() {
  loadEnv();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
  });

  client.commands = new Collection();

  client.once('clientReady', async () => {
    try {
      logger.info(`Logged in as ${client.user.tag}`);
      await autoDeployAdminPanel(client);
      logger.info('Admin panel ready');
    } catch (error) {
      logger.error('Auto deploy admin panel failed', error);
    }
  });

  registerInteractionHandler(client);

  client.on('error', (error) => {
    logger.error('Discord client error', error);
  });

  client.on('warn', (message) => {
    logger.warn(message);
  });

  return client;
}

module.exports = {
  createBot
};
