const { pool } = require('../db/pool');

const {
  buildAdminHomeEmbed
} = require('../builders/embeds/adminPanel.embed');

const {
  buildAdminHomeComponents
} = require('../builders/components/adminPanel.components');

async function getAdminPanelChannelId() {
  const result = await pool.query(`
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = 'QUEST_ADMIN_PANEL_CHANNEL'
    AND is_active = true
    LIMIT 1
  `);

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0].config_value;
}

async function ensureAdminPanelMessage(client, logger = console) {
  const channelId = await getAdminPanelChannelId();

  if (!channelId) {
    logger.warn('QUEST_ADMIN_PANEL_CHANNEL not configured');
    return null;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    logger.warn(`Admin panel channel not found: ${channelId}`);
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
