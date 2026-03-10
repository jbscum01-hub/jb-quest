const { Client, GatewayIntentBits } = require('discord.js');

const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');

const { getPool } = require('../db/pool');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

async function getAdminPanelChannelId() {

  const pool = getPool();

  const result = await pool.query(`
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = 'QUEST_ADMIN_PANEL_CHANNEL'
    LIMIT 1
  `);

  if (!result.rows.length) {
    throw new Error('QUEST_ADMIN_PANEL_CHANNEL not found in config');
  }

  return result.rows[0].config_value;

}

async function createAdminPanel() {

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  client.once('ready', async () => {

    try {

      console.log(`Bot logged in as ${client.user.tag}`);

      const channelId = await getAdminPanelChannelId();

      const guild = await client.guilds.fetch(GUILD_ID);
      const channel = await guild.channels.fetch(channelId);

      if (!channel) {
        throw new Error('Admin panel channel not found');
      }

      const embed = buildAdminPanelEmbed();
      const components = buildAdminPanelButtons();

      const message = await channel.send({
        embeds: [embed],
        components
      });

      console.log('Admin panel created:', message.id);

    } catch (err) {

      console.error('Create admin panel failed', err);

    }

    process.exit(0);

  });

  await client.login(BOT_TOKEN);

}

createAdminPanel();
