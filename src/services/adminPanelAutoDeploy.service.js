const { EmbedBuilder } = require('discord.js');
const { renderAdminHome } = require('./adminPanel.service');
const {
  getGlobalConfigValue,
  setGlobalConfigValue,
  getAdminPanelMessageId
} = require('./discordConfig.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

async function autoDeployAdminPanel(client) {
  const channelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_CHANNEL);
  if (!channelId) {
    throw new Error('ยังไม่ได้ตั้งค่า QUEST_ADMIN_PANEL_CHANNEL');
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    throw new Error(`ไม่พบห้องแอดมินพาเนล: ${channelId}`);
  }

  const existingMessageId = await getAdminPanelMessageId();
  let message = null;

  if (existingMessageId) {
    message = await channel.messages.fetch(existingMessageId).catch(() => null);
  }

  if (!message) {
    message = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle('⚙️ กำลังสร้าง Quest Admin Panel...')
          .setDescription('ระบบจะอัปเดตข้อความนี้เป็นหน้าควบคุมหลักอัตโนมัติ')
      ]
    });

    await setGlobalConfigValue(
      DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE,
      message.id,
      'Quest Admin Panel Message ID'
    );
  }

  await renderAdminHome(message);
  return message;
}

module.exports = {
  autoDeployAdminPanel
};
