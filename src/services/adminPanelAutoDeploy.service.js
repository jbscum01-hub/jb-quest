const {
  buildAdminHomeEmbed
} = require('../builders/embeds/adminPanel.embed');

const {
  buildAdminHomeComponents
} = require('../builders/components/adminPanel.components');

const {
  getQuestDiscordConfig
} = require('./discordConfig.service');

async function ensureAdminPanelMessage(client, logger = console) {
  const adminPanelChannelId = await getQuestDiscordConfig('QUEST_ADMIN_PANEL_CHANNEL');

  if (!adminPanelChannelId) {
    logger.warn('QUEST_ADMIN_PANEL_CHANNEL is not configured');
    return null;
  }

  const channel = await client.channels.fetch(adminPanelChannelId).catch(() => null);

  if (!channel) {
    logger.warn(`Admin panel channel not found: ${adminPanelChannelId}`);
    return null;
  }

  const embed = buildAdminHomeEmbed();
  const components = buildAdminHomeComponents();

  const message = await channel.send({
    embeds: [embed],
    components
  });

  logger.info(`Admin panel created: ${message.id}`);
  return message;
}

async function autoDeployAdminPanel(client, logger = console) {
  try {
    return await ensureAdminPanelMessage(client, logger);
  } catch (error) {
    logger.error('Auto deploy admin panel failed', error);
    return null;
  }
}

module.exports = {
  autoDeployAdminPanel,
  ensureAdminPanelMessage
};
