const { PROFESSION_LIST } = require('../constants/professions');
const { logger } = require('../config/logger');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  saveProfessionPanelMessageId
} = require('./discordConfig.service');
const { buildProfessionPanelEmbed } = require('../builders/embeds/professionPanel.embed');
const { buildProfessionPanelComponents } = require('../builders/components/professionPanel.components');

function getExpectedPanelCustomIds(professionCode) {
  return [
    `quest:panel:view_current:${professionCode}`,
    `quest:panel:submit_main:${professionCode}`
  ];
}

function isSameProfessionPanel(message, professionCode) {
  if (!message?.author?.bot) return false;

  const expectedCustomIds = getExpectedPanelCustomIds(professionCode);
  const buttonIds = (message.components || [])
    .flatMap((row) => row.components || [])
    .map((component) => component.customId)
    .filter(Boolean);

  if (buttonIds.length !== expectedCustomIds.length) return false;
  return expectedCustomIds.every((id) => buttonIds.includes(id));
}

async function cleanupDuplicateProfessionPanels(channel, professionCode, keepMessageId = null) {
  const fetched = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!fetched) return [];

  const duplicates = fetched
    .filter((message) => isSameProfessionPanel(message, professionCode) && message.id !== keepMessageId)
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

  for (const message of duplicates.values()) {
    await message.delete().catch(() => null);
  }

  return [...duplicates.keys()];
}

async function deployOrRefreshProfessionPanel(client, professionCode) {
  const channelId = await getProfessionPanelChannelId(professionCode);
  if (!channelId) {
    logger.warn(`Missing channel config for ${professionCode}`);
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    logger.warn(`Channel not found for ${professionCode}`);
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
      const removedIds = await cleanupDuplicateProfessionPanels(channel, professionCode, existingMessage.id);
      logger.info(`Panel refreshed for ${professionCode}${removedIds.length ? `, removed duplicates: ${removedIds.join(', ')}` : ''}`);
      return;
    }
  }

  const message = await channel.send(payload);
  await saveProfessionPanelMessageId(professionCode, message.id);
  await cleanupDuplicateProfessionPanels(channel, professionCode, message.id);
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
  deployProfessionPanels,
  deployOrRefreshProfessionPanel
};
