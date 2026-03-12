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
    logger.warn(`Missing channel config for ${professionCode}`);
    return { professionCode, status: 'NO_CHANNEL' };
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    logger.warn(`Channel not found for ${professionCode}`);
    return { professionCode, status: 'CHANNEL_NOT_FOUND', channelId };
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
      return { professionCode, status: 'REFRESHED', channelId, messageId };
    }
  }

  const message = await channel.send(payload);
  await saveProfessionPanelMessageId(professionCode, message.id);
  logger.info(`Panel created for ${professionCode}`);
  return { professionCode, status: 'CREATED', channelId, messageId: message.id };
}

async function autoDeployPanels(client) {
  const results = [];
  for (const professionCode of PROFESSION_LIST) {
    results.push(await deployOrRefreshProfessionPanel(client, professionCode));
  }
  return results;
}

async function deployProfessionPanels(client) {
  return autoDeployPanels(client);
}

async function repairMissingProfessionPanels(client) {
  const results = [];
  for (const professionCode of PROFESSION_LIST) {
    const channelId = await getProfessionPanelChannelId(professionCode);
    const messageId = await getProfessionPanelMessageId(professionCode);
    if (!channelId) {
      results.push({ professionCode, status: 'NO_CHANNEL' });
      continue;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      results.push({ professionCode, status: 'CHANNEL_NOT_FOUND', channelId });
      continue;
    }

    const exists = messageId ? await channel.messages.fetch(messageId).catch(() => null) : null;
    if (exists) {
      results.push({ professionCode, status: 'OK', channelId, messageId });
      continue;
    }

    results.push(await deployOrRefreshProfessionPanel(client, professionCode));
  }
  return results;
}

async function getProfessionPanelStatuses(client) {
  const rows = [];
  for (const professionCode of PROFESSION_LIST) {
    const channelId = await getProfessionPanelChannelId(professionCode);
    const messageId = await getProfessionPanelMessageId(professionCode);
    if (!channelId) {
      rows.push({ professionCode, status: 'NO_CHANNEL', channelId: null, messageId: null });
      continue;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      rows.push({ professionCode, status: 'CHANNEL_NOT_FOUND', channelId, messageId });
      continue;
    }

    const message = messageId ? await channel.messages.fetch(messageId).catch(() => null) : null;
    rows.push({
      professionCode,
      status: message ? 'OK' : 'MESSAGE_NOT_FOUND',
      channelId,
      messageId
    });
  }
  return rows;
}

module.exports = {
  autoDeployPanels,
  deployProfessionPanels,
  repairMissingProfessionPanels,
  getProfessionPanelStatuses,
  deployOrRefreshProfessionPanel
};
