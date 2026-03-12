const adminRepo = require('../db/queries/adminPanel.repo');
const adminService = require('./adminPanel.service');

async function ensureAdminPanelMessage(client, logger = console) {
  try {
    const channelId = await adminRepo.getDiscordConfigValue('QUEST_ADMIN_PANEL_CHANNEL');
    if (!channelId) {
      logger.warn?.('[ADMIN] Missing QUEST_ADMIN_PANEL_CHANNEL config');
      return null;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      logger.warn?.(`[ADMIN] Admin panel channel not found: ${channelId}`);
      return null;
    }

    const payload = await adminService.buildAdminHomePayload();
    const storedMessageId = await adminRepo.getDiscordConfigValue('QUEST_ADMIN_PANEL_MESSAGE');

    if (storedMessageId) {
      const existing = await channel.messages.fetch(storedMessageId).catch(() => null);
      if (existing) {
        await existing.edit(payload);
        logger.info?.('[ADMIN] Admin panel refreshed');
        return existing;
      }
    }

    const message = await channel.send(payload);
    await adminRepo.upsertDiscordConfigValue({
      configKey: 'QUEST_ADMIN_PANEL_MESSAGE',
      configValue: message.id,
      displayName: 'Quest Admin Panel Message'
    });

    logger.info?.('[ADMIN] Admin panel created');
    return message;
  } catch (error) {
    logger.error?.('[ADMIN] Failed to ensure admin panel message', error);
    throw error;
  }
}

module.exports = { ensureAdminPanelMessage };
