const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPool } = require('../db/pool');

async function getChannelId() {

  const pool = getPool();

  const result = await pool.query(`
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = 'QUEST_ADMIN_PANEL_CHANNEL'
    LIMIT 1
  `);

  if (!result.rows.length) return null;

  return result.rows[0].config_value;
}

async function getPanelMessageId() {

  const pool = getPool();

  const result = await pool.query(`
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = 'QUEST_ADMIN_PANEL_MESSAGE'
    LIMIT 1
  `);

  if (!result.rows.length) return null;

  return result.rows[0].config_value;
}

async function savePanelMessageId(messageId) {

  const pool = getPool();

  await pool.query(`
    INSERT INTO tb_quest_master_discord_config
    (scope_type, scope_key, config_key, config_value)
    VALUES ('GLOBAL','SYSTEM','QUEST_ADMIN_PANEL_MESSAGE',$1)
    ON CONFLICT (scope_type,scope_key,config_key)
    DO UPDATE SET config_value = EXCLUDED.config_value
  `,[messageId]);

}

function buildEmbed() {

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription(`
Deploy Panels
Refresh Panels
Sync Quest
System Status
`)
    .setTimestamp();

}

function buildButtons() {

  return [
    new ActionRowBuilder().addComponents(

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

    )
  ];
}

async function autoDeployAdminPanel(client) {

  const channelId = await getChannelId();

  if (!channelId) {
    console.log('QUEST_ADMIN_PANEL_CHANNEL not configured');
    return;
  }

  const channel = await client.channels.fetch(channelId);

  const embed = buildEmbed();
  const components = buildButtons();

  const panelMessageId = await getPanelMessageId();

  if (panelMessageId) {

    try {

      const message = await channel.messages.fetch(panelMessageId);

      await message.edit({
        embeds:[embed],
        components
      });

      console.log('Admin panel refreshed');
      return;

    } catch {

      console.log('Old panel not found, creating new');

    }

  }

  const message = await channel.send({
    embeds:[embed],
    components
  });

  await savePanelMessageId(message.id);

  console.log('Admin panel created');

}

module.exports = {
  autoDeployAdminPanel
};
