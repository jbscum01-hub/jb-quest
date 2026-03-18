const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestImageModal(questId) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:qimg:${questId}`)
    .setTitle('เพิ่มรูปตัวอย่างเควส')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_url').setLabel('ลิงก์รูปตัวอย่าง').setStyle(TextInputStyle.Short).setPlaceholder('https://...').setRequired(true).setMaxLength(500)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_title').setLabel('ชื่อรูป').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_description').setLabel('คำอธิบายรูป').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000)
      )
    );
}

function buildStepImageModal(stepId) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:simg:${stepId}`)
    .setTitle('เพิ่มรูปตัวอย่าง Step')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_url').setLabel('ลิงก์รูป Step').setStyle(TextInputStyle.Short).setPlaceholder('https://...').setRequired(true).setMaxLength(500)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_title').setLabel('ชื่อรูป').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_description').setLabel('คำอธิบายรูป').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000)
      )
    );
}

module.exports = { buildQuestImageModal, buildStepImageModal };
