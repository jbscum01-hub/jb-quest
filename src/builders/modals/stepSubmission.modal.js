const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

const { buildCustomId } = require('../../utils/customId');

function buildStepSubmissionModal(ticketId, stepNo) {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId('modal_submit', 'step_submit', `${ticketId}:${stepNo}`))
    .setTitle(`ส่ง Step ${stepNo}`);

  const characterName = new TextInputBuilder()
    .setCustomId('character_name')
    .setLabel('ชื่อในเกม')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const stepText = new TextInputBuilder()
    .setCustomId('step_text')
    .setLabel('อธิบายขั้นตอนที่ทำ')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000);

  const screenshot = new TextInputBuilder()
    .setCustomId('screenshot')
    .setLabel('ลิงก์รูปหลักฐาน')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('https://...');

  modal.addComponents(
    new ActionRowBuilder().addComponents(characterName),
    new ActionRowBuilder().addComponents(stepText),
    new ActionRowBuilder().addComponents(screenshot)
  );

  return modal;
}

module.exports = {
  buildStepSubmissionModal
};
