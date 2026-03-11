const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { findActiveProfessions } = require('../db/queries/adminPanel.repo');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  setProfessionPanelMessageId
} = require('./discordConfig.service');

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
    const professionCode = profession.profession_code;
    const channelId = await getProfessionPanelChannelId(professionCode);

    if (!channelId) {
      continue;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      continue;
    }

    const oldMessageId = await getProfessionPanelMessageId(professionCode);
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
      await setProfessionPanelMessageId(
        professionCode,
        message.id,
        `Quest Panel Message ${professionCode}`
      );
    }
  }
}

module.exports = {
  deployProfessionPanels
};
