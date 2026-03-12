const { saveQuestDescriptionFromModal } = require('../../services/adminPanel.service');

async function handleAdminQuestDescriptionModal(interaction) {
  const questId = interaction.customId.split(':').slice(3).join(':');
  await saveQuestDescriptionFromModal(interaction, questId);
}

module.exports = {
  handleAdminQuestDescriptionModal
};
