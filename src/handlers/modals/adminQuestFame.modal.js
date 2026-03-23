const { saveQuestFameFromModal } = require('../../services/adminPanel.service');

async function handleAdminQuestFameModal(interaction) {
  const questId = interaction.customId.split(':')[3];
  await saveQuestFameFromModal(interaction, questId);
}

module.exports = { handleAdminQuestFameModal };
