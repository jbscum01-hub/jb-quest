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
const { autoDeployAdminPanel } = require('./services/adminPanelAutoDeploy.service');

async function createBot() {

  loadEnv();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [
      Partials.Channel,
      Partials.Message
    ]
  });

  client.commands = new Collection();

  client.once('ready', async () => {

    try {

      logger.info(`Logged in as ${client.user.tag}`);

      // สร้าง Admin Panel อัตโนมัติ
      await autoDeployAdminPanel(client);

      // สร้าง Panel สายอาชีพทั้งหมด
      await autoDeployPanels(client);

      logger.info('Panel auto deploy completed');

    } catch (error) {

      logger.error('Auto deploy panels failed', error);

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
