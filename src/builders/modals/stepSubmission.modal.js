const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

const { buildCustomId } = require('../../utils/customId');

function buildStepSubmissionModal(ticketId, stepNo, professionCode = 'QUEST') {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId('modal_submit', 'step_submit', `${ticketId}:${stepNo}`))
    .setTitle(`ส่งเควส ${professionCode}`);

  const characterName = new TextInputBuilder()
    .setCustomId('character_name')
    .setLabel('ชื่อตัวละคร')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const screenshot = new TextInputBuilder()
    .setCustomId('screenshot')
    .setLabel('อัปโหลดรูปหลักฐาน (วางรูปได้เลย)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('วางลิงก์รูปภาพ เช่น https://...')
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(characterName),
    new ActionRowBuilder().addComponents(screenshot)
  );

  return modal;
}

module.exports = {
  buildStepSubmissionModal
};
