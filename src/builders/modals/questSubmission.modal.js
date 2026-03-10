const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildQuestSubmissionModal({ submissionMode, professionCode }) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:modal_submit:${submissionMode}:${professionCode}`)
    .setTitle(
      submissionMode === 'MAIN'
        ? `ส่งเควสหลัก - ${professionCode}`
        : `ส่งเควสซ้ำ - ${professionCode}`
    );

  const titleInput = new TextInputBuilder()
    .setCustomId('submission_title')
    .setLabel('หัวข้อการส่ง')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100)
    .setPlaceholder('เช่น ส่งเควสพร้อมหลักฐานครบแล้ว');

  const descriptionInput = new TextInputBuilder()
    .setCustomId('submission_description')
    .setLabel('รายละเอียด')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000)
    .setPlaceholder('อธิบายสิ่งที่ทำ / สิ่งที่ส่ง / เงื่อนไขที่ทำครบ');

  const proofInput = new TextInputBuilder()
    .setCustomId('submission_proof')
    .setLabel('หลักฐาน / ลิงก์รูป / โน้ตเพิ่มเติม')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000)
    .setPlaceholder('ใส่ลิงก์รูป, รายละเอียดเพิ่มเติม, หรือคำอธิบายหลักฐาน');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(proofInput)
  );

  return modal;
}

module.exports = {
  buildQuestSubmissionModal
};
