// src/services/adminPanelAutoDeploy.service.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPool } = require('../db/pool');
const { logger } = require('../config/logger');

function buildAdminPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription(
`ระบบควบคุม Quest Bot

ใช้ปุ่มด้านล่างเพื่อจัดการระบบ

• Deploy Panels
• Refresh Panels
• Sync Quest
• System Status`
    )
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

function buildAdminPanelButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quest:admin:deploy_panels')
      .setLabel('Deploy Panels')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('quest:admin:refresh_panels')
      .setLabel('Refresh Panels')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('quest:admin:sync_quests')
      .setLabel('Sync Quest')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('quest:admin:system_status')
      .setLabel('System Status')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

async function getConfig(key) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = $1
      AND is_active = true
    LIMIT 1
    `,
    [key]
  );

  return result.rows[0]?.config_value || null;
}

async function savePanelMessageId(messageId) {
  const pool = getPool();

  await pool.query(
    `
    INSERT INTO tb_quest_master_discord_config
    (
      scope_type,
      scope_key,
      config_key,
      config_value,
      display_name
    )
    VALUES
    (
      'GLOBAL',
      'SYSTEM',
      'QUEST_ADMIN_PANEL_MESSAGE',
      $1,
      'Admin Panel Message'
    )
    ON CONFLICT (scope_type, scope_key, config_key)
    DO UPDATE SET
      config_value = EXCLUDED.config_value,
      updated_at = NOW()
    `,
    [messageId]
  );
}

async function getPanelMessageId() {
  return getConfig('QUEST_ADMIN_PANEL_MESSAGE');
}

async function autoDeployAdminPanel(client) {
  try {

    const channelId = await getConfig('QUEST_ADMIN_PANEL_CHANNEL');

    if (!channelId) {
      logger.warn('QUEST_ADMIN_PANEL_CHANNEL not found');
      return;
    }

    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      logger.warn('Admin panel channel not found');
      return;
    }

    const embed = buildAdminPanelEmbed();
    const components = buildAdminPanelButtons();

    const existingMessageId = await getPanelMessageId();

    if (existingMessageId) {
      try {

        const message = await channel.messages.fetch(existingMessageId);

        await message.edit({
          embeds: [embed],
          components
        });

        logger.info('Admin panel refreshed');
        return;

      } catch (err) {
        logger.warn('Admin panel message not found, creating new');
      }
    }

    const message = await channel.send({
      embeds: [embed],
      components
    });

    await savePanelMessageId(message.id);

    logger.info('Admin panel created');

  } catch (error) {
    logger.error('autoDeployAdminPanel failed', error);
  }
}

module.exports = {
  autoDeployAdminPanel
};
