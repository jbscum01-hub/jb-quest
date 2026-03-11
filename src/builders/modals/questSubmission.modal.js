const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildQuestSubmissionModal({ submissionMode, professionCode }) {
  const modal = new ModalBuilder()
    .setCustomId(buildCustomId('modal_submit', submissionMode, professionCode))
    .setTitle(submissionMode === 'MAIN' ? `ส่งเควสหลัก - ${professionCode}` : `ส่งเควสซ้ำ - ${professionCode}`);

  const ingameNameInput = new TextInputBuilder()
    .setCustomId('submission_ingame_name')
    .setLabel('ชื่อตัวละครในเกม')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100)
    .setPlaceholder('เช่น PraewRung');

  const textInput = new TextInputBuilder()
    .setCustomId('submission_text')
    .setLabel('รายละเอียดการส่งเควส')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1500)
    .setPlaceholder('อธิบายสิ่งที่ทำให้ครบตามเงื่อนไข พร้อมลิงก์หลักฐานถ้ามี');

  modal.addComponents(
    new ActionRowBuilder().addComponents(ingameNameInput),
    new ActionRowBuilder().addComponents(textInput)
  );

  return modal;
}

module.exports = {
  buildQuestSubmissionModal
};
