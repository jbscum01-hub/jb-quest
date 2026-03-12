const {
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestRequirementModal(interaction) {
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
