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

  const description = new TextInputBuilder()
    .setCustomId('step_text')
    .setLabel('อธิบายขั้นตอนที่ทำ')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(new ActionRowBuilder().addComponents(description));

  return modal;
}

module.exports = {
  buildStepSubmissionModal
};
