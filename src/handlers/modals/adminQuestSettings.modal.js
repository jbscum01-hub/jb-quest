const { saveQuestSettingsFromModal } = require('../../services/adminPanel.service');

async function handleAdminQuestSettingsModal(interaction) {
  const questId = interaction.customId.split(':').slice(3).join(':');
  await saveQuestSettingsFromModal(interaction, questId);
}

module.exports = { handleAdminQuestSettingsModal };