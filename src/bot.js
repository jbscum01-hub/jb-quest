const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require('discord.js');

const { loadEnv } = require('./config/env');
const { logger } = require('./config/logger');
const { registerInteractionHandler } = require('./handlers/interactionCreate');
const { autoDeployPanels } = require('./services/panelAutoDeploy.service');

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

  client.once('ready', async () => {
    logger.info(`Logged in as ${client.user.tag}`);
    
    await autoDeployPanels(client);
    
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
