const { PROFESSION_LIST } = require('../constants/professions');
const { logger } = require('../config/logger');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  saveProfessionPanelMessageId
} = require('./discordConfig.service');
const { buildProfessionPanelEmbed } = require('../builders/embeds/professionPanel.embed');
const { buildProfessionPanelComponents } = require('../builders/components/professionPanel.components');

async function deployOrRefreshProfessionPanel(client, professionCode) {
  const channelId = await getProfessionPanelChannelId(professionCode);
  if (!channelId) {
    logger.warn(`Missing panel channel config for ${professionCode}`);
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    logger.warn(`Panel channel not found for ${professionCode}`);
    return;
  }

  const payload = {
    embeds: [buildProfessionPanelEmbed(professionCode)],
    components: buildProfessionPanelComponents(professionCode)
  };

  const messageId = await getProfessionPanelMessageId(professionCode);
  if (messageId) {
    const existingMessage = await channel.messages.fetch(messageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit(payload);
      logger.info(`Panel refreshed for ${professionCode}`);
      return;
    }
  }

  const message = await channel.send(payload);
  await saveProfessionPanelMessageId(professionCode, message.id);
  logger.info(`Panel created for ${professionCode}`);
}

async function autoDeployPanels(client) {
  for (const professionCode of PROFESSION_LIST) {
    await deployOrRefreshProfessionPanel(client, professionCode);
  }
}

async function deployProfessionPanels(client) {
  await autoDeployPanels(client);
}

module.exports = {
  autoDeployPanels,
  deployProfessionPanels
};
