const {
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestRequirementModal(interaction) {
  if (interaction.customId.startsWith('q:reqe:')) {
    const requirementId = interaction.customId.split(':').slice(-1)[0];
    await saveQuestRequirementFromModal(interaction, null, requirementId);
    return;
  }

  if (interaction.customId.startsWith('q:reqa:')) {
    const questId = interaction.customId.split(':').slice(-1)[0];
    await addQuestRequirementFromModal(interaction, questId);
    return;
  }

  const parts = interaction.customId.split(':');
  const action = parts[2];

  if (action === 'edit_requirement') {
    const questId = parts[3];
    const requirementId = parts[4];
    await saveQuestRequirementFromModal(interaction, questId, requirementId);
    return;
  }

  if (action === 'add_requirement') {
    const questId = parts[3];
    await addQuestRequirementFromModal(interaction, questId);
  }
}

module.exports = {
  handleAdminQuestRequirementModal
};
