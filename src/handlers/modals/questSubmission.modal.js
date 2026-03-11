const { logger } = require('../../config/logger');

async function handleQuestSubmissionModal(interaction, parsed) {

  await interaction.deferReply({ ephemeral: true });

  const characterName =
    interaction.fields.getTextInputValue('character_name');

  const screenshot =
    interaction.fields.getTextInputValue('screenshot');

  console.log("Quest Submit", {
    user: interaction.user.id,
    characterName,
    screenshot
  });

  await interaction.editReply({
    content: 'ส่งเควสเรียบร้อยแล้ว ทีมงานจะตรวจสอบให้'
  });

}

module.exports = {
  handleQuestSubmissionModal
};
