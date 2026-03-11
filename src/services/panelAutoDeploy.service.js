const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { findActiveProfessions } = require('../db/queries/adminPanel.repo');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  setGlobalConfigValue
} = require('./discordConfig.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function buildProfessionPanelEmbed(profession) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${profession.icon_emoji || '📘'} เควสสาย ${profession.profession_name_th}`)
    .setDescription([
      'ใช้พาเนลนี้เพื่อดูเควสปัจจุบันและส่งเควสของสายนี้',
      '',
      `**สายอาชีพ:** ${profession.profession_name_th} (${profession.profession_code})`,
      '',
      'หมายเหตุ:',
      '• ถ้าข้อมูลเควสมีการแก้ไข แอดมินสามารถกดรีเฟรชพาเนลได้จาก Admin Panel',
      '• ถ้าเป็นเควสแบบ Step Quest ระบบจะเปิด Ticket ให้อัตโนมัติ'
    ].join('\n'))
    .setFooter({ text: `Profession: ${profession.profession_code}` })
    .setTimestamp();
}

function buildProfessionPanelComponents(profession) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:panel:current:${profession.profession_code}`)
        .setLabel('ดูเควสปัจจุบัน')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:panel:submit:${profession.profession_code}`)
        .setLabel('ส่งเควส')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

async function deployProfessionPanels(client) {
  const professions = await findActiveProfessions();

  for (const profession of professions) {
    const channelId = await getProfessionPanelChannelId(profession.profession_code);
    if (!channelId) continue;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) continue;

    const oldMessageId = await getProfessionPanelMessageId(profession.profession_code);
    let message = null;

    if (oldMessageId) {
      message = await channel.messages.fetch(oldMessageId).catch(() => null);
    }

    const payload = {
      embeds: [buildProfessionPanelEmbed(profession)],
      components: buildProfessionPanelComponents(profession)
    };

    if (message) {
      await message.edit(payload);
    } else {
      message = await channel.send(payload);
      await setGlobalConfigValue(
        `${DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE_PREFIX}${profession.profession_code}`,
        message.id,
        `Quest Panel Message ${profession.profession_code}`
      );
    }
  }
}

module.exports = {
  deployProfessionPanels
};
