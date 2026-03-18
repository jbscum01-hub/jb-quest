const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildReviewRevisionModal(submissionId) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:modal_submit:review_revision:${submissionId}`)
    .setTitle('เหตุผลที่ต้องแก้ไข');

  const reviewNoteInput = new TextInputBuilder()
    .setCustomId('review_note')
    .setLabel('ระบุสิ่งที่ผู้เล่นต้องแก้ไข')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000)
    .setPlaceholder('เช่น รูปยังไม่เห็นจำนวนไอเทมครบ กรุณาแคปใหม่ให้เห็น inventory ชัดเจน');

  modal.addComponents(
    new ActionRowBuilder().addComponents(reviewNoteInput)
  );

  return modal;
}

module.exports = {
  buildReviewRevisionModal
};
