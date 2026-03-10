const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPool } = require('../db/pool');

async function getAdminChannelId() {

  const pool = getPool();

  const result = await pool.query(`
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = 'QUEST_ADMIN_PANEL_CHANNEL'
    LIMIT 1
  `);

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0].config_value;

}

function buildEmbed() {

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription(`ระบบควบคุม Quest Bot

Deploy Panels
Refresh Panels
Sync Quest
System Status`)
    .setTimestamp();

}

function buildButtons() {

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

async function autoDeployAdminPanel(client) {

  const channelId = await getAdminChannelId();

  if (!channelId) {
    console.log('Admin panel channel not configured');
    return;
  }

  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    console.log('Admin panel channel not found');
    return;
  }

  const embed = buildEmbed();
  const components = buildButtons();

  await channel.send({
    embeds: [embed],
    components
  });

  console.log('Admin panel created');

}

module.exports = {
  autoDeployAdminPanel
};
