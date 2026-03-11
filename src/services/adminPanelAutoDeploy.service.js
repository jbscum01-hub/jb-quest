const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');
const { logger } = require('../config/logger');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const {
  getGlobalConfigValue,
  getAdminPanelMessageId,
  saveAdminPanelMessageId
} = require('./discordConfig.service');

async function autoDeployAdminPanel(client) {
  const channelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_CHANNEL);

  if (!channelId) {
    logger.warn('QUEST_ADMIN_PANEL_CHANNEL not configured');
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    logger.warn('Admin panel channel not found');
    return;
  }

  const payload = {
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  };

  const existingMessageId = await getAdminPanelMessageId();

  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit(payload);
      logger.info('Admin panel refreshed');
      return;
    }
  }

  const message = await channel.send(payload);
  await saveAdminPanelMessageId(message.id);
  logger.info('Admin panel created');
}

module.exports = {
  autoDeployAdminPanel
};
