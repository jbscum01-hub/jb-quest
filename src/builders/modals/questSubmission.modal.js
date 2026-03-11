const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildQuestSubmissionModal({ submissionMode, professionCode }) {

  const modal = new ModalBuilder()
    .setCustomId(`quest:modal_submit:${submissionMode}:${professionCode}`)
    .setTitle(`ส่งเควส ${professionCode}`);

  const characterName = new TextInputBuilder()
    .setCustomId('character_name')
    .setLabel('ชื่อตัวละคร')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const screenshot = new TextInputBuilder()
    .setCustomId('screenshot')
    .setLabel('อัปโหลดรูปหลักฐาน (วางรูปได้เลย)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(characterName),
    new ActionRowBuilder().addComponents(screenshot)
  );

  return modal;
}

module.exports = {
  buildQuestSubmissionModal
};
