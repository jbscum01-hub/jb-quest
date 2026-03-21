const { saveQuestScheduleFromModal } = require('../../services/adminPanel.service');

async function handleAdminQuestScheduleModal(interaction) {
  const questId = interaction.customId.split(':')[3];
  await saveQuestScheduleFromModal(interaction, questId);
}

module.exports = { handleAdminQuestScheduleModal };
