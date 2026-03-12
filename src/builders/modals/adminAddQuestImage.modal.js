const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildAdminAddQuestImageModal(questId) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin_modal:add_image:${questId}`)
    .setTitle('เพิ่มรูปตัวอย่างเควส');

  const imageUrl = new TextInputBuilder()
    .setCustomId('media_url')
    .setLabel('URL ของรูป')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('https://cdn.discordapp.com/...');

  const mediaTitle = new TextInputBuilder()
    .setCustomId('media_title')
    .setLabel('ชื่อรูป')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const mediaDescription = new TextInputBuilder()
    .setCustomId('media_description')
    .setLabel('คำอธิบายรูป')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  const displayOrder = new TextInputBuilder()
    .setCustomId('display_order')
    .setLabel('ลำดับแสดงผล')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('1');

  modal.addComponents(
    new ActionRowBuilder().addComponents(imageUrl),
    new ActionRowBuilder().addComponents(mediaTitle),
    new ActionRowBuilder().addComponents(mediaDescription),
    new ActionRowBuilder().addComponents(displayOrder)
  );

  return modal;
}

module.exports = {
  buildAdminAddQuestImageModal
};
