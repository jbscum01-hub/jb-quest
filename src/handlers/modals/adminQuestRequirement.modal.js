const {
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal
} = require('../../services/adminPanel.service');
const { findQuestRequirementById } = require('../../db/queries/questMaster.repo');

async function handleAdminQuestRequirementModal(interaction) {
  if (interaction.customId.startsWith('q:reqe:')) {
    const requirementId = interaction.customId.split(':')[2];
    const requirement = await findQuestRequirementById(requirementId);
    if (!requirement) {
      await interaction.reply({ content: 'ไม่พบรายการของที่ต้องส่งนี้', ephemeral: true });
      return;
    }
    await saveQuestRequirementFromModal(interaction, requirement.quest_id, requirementId);
    return;
  }

  if (interaction.customId.startsWith('q:reqa:')) {
    const questId = interaction.customId.split(':')[2];
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
