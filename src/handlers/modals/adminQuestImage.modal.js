const { addQuestImageFromModal } = require('../../services/adminPanel.service');

async function handleAdminQuestImageModal(interaction) {
  const questId = interaction.customId.split(':').slice(3).join(':');
  await addQuestImageFromModal(interaction, questId);
}

module.exports = {
  handleAdminQuestImageModal
};
