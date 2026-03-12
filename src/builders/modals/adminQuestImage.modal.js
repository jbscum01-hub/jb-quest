const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildQuestImageModal(questId) {
  const imageUrlInput = new TextInputBuilder()
    .setCustomId('image_url')
    .setLabel('ลิงก์รูปตัวอย่าง')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(true)
    .setMaxLength(500);

  const titleInput = new TextInputBuilder()
    .setCustomId('image_title')
    .setLabel('ชื่อรูป / หัวข้อ')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('เช่น ตัวอย่างการส่งของ')
    .setRequired(false)
    .setMaxLength(150);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('image_description')
    .setLabel('คำอธิบายรูป')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('อธิบายว่ารูปนี้ใช้ดูอะไร')
    .setRequired(false)
    .setMaxLength(1000);

  return new ModalBuilder()
    .setCustomId(buildCustomId('admin_modal', 'add_image', questId))
    .setTitle('เพิ่มรูปตัวอย่างเควส')
    .addComponents(
      new ActionRowBuilder().addComponents(imageUrlInput),
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput)
    );
}

module.exports = {
  buildQuestImageModal
};
