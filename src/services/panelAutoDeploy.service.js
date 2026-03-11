const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPool } = require('../db/pool');
const { logger } = require('../config/logger');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  saveProfessionPanelMessageId
} = require('./discordConfig.service');

async function getActiveProfessions() {
  const result = await getPool().query(`
    SELECT profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_code ASC
  `);
  return result.rows;
}

function buildProfessionPanelEmbed(profession) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${profession.icon_emoji || '📘'} เควสสาย ${profession.profession_name_th}`)
    .setDescription([
      'ใช้พาเนลนี้เพื่อดูเควสปัจจุบันและส่งเควสของสายนี้',
      '',
      `**สายอาชีพ:** ${profession.profession_name_th} (${profession.profession_code})`,
      '',
      'วิธีใช้งาน:',
      '• กด **ดูเควสปัจจุบัน** เพื่อเช็กว่าอยู่เควสไหน',
      '• กด **ส่งเควส** เพื่อส่งหลักฐานของเควสปัจจุบัน',
      '• ถ้าเป็นเควสแบบ Step Quest ระบบจะเปิด Ticket ให้อัตโนมัติ'
    ].join('\n'))
    .setFooter({ text: `Profession: ${profession.profession_code}` })
    .setTimestamp();
}

function buildProfessionPanelComponents(professionCode) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:panel:current:${professionCode}`)
        .setLabel('ดูเควสปัจจุบัน')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:panel:submit:${professionCode}`)
        .setLabel('ส่งเควส')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

async function deployOrRefreshProfessionPanel(client, profession) {
  const channelId = await getProfessionPanelChannelId(profession.profession_code);
  if (!channelId) {
    logger.warn(`Missing panel channel config for ${profession.profession_code}`);
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    logger.warn(`Panel channel not found for ${profession.profession_code}`);
    return;
  }

  const payload = {
    embeds: [buildProfessionPanelEmbed(profession)],
    components: buildProfessionPanelComponents(profession.profession_code)
  };

  const messageId = await getProfessionPanelMessageId(profession.profession_code);
  if (messageId) {
    const existingMessage = await channel.messages.fetch(messageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit(payload);
      logger.info(`Panel refreshed for ${profession.profession_code}`);
      return;
    }
  }

  const message = await channel.send(payload);
  await saveProfessionPanelMessageId(profession.profession_code, message.id);
  logger.info(`Panel created for ${profession.profession_code}`);
}

async function autoDeployPanels(client) {
  const professions = await getActiveProfessions();
  for (const profession of professions) {
    await deployOrRefreshProfessionPanel(client, profession);
  }
}

async function deployProfessionPanels(client) {
  await autoDeployPanels(client);
}

module.exports = {
  autoDeployPanels,
  deployProfessionPanels
};
