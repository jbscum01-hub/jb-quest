const {
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestRequirementModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const targetId = parts[3];

  if (action === 'reqe') {
    await saveQuestRequirementFromModal(interaction, targetId);
    return;
  }

  if (action === 'reqa') {
    await addQuestRequirementFromModal(interaction, targetId);
    return;
  }

  if (action === 'edit_requirement') {
    await saveQuestRequirementFromModal(interaction, parts[4]);
    return;
  }
  if (action === 'add_requirement') {
    await addQuestRequirementFromModal(interaction, parts[3]);
  }
}

module.exports = { handleAdminQuestRequirementModal };
