const {
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal
} = require('../../services/adminPanel.service');
const { findQuestRequirementById } = require('../../db/queries/questMaster.repo');

async function handleAdminQuestRequirementModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];

  if (action === 'reqe') {
    const requirementId = parts[2];
    const requirement = await findQuestRequirementById(requirementId);
    if (!requirement) {
      await interaction.reply({ content: 'ไม่พบรายการของที่ต้องส่งนี้', ephemeral: true });
      return;
    }
    await saveQuestRequirementFromModal(interaction, requirement.quest_id, requirementId);
    return;
  }

  if (action === 'reqa') {
    const questId = parts[2];
    await addQuestRequirementFromModal(interaction, questId);
  }
}

module.exports = {
  handleAdminQuestRequirementModal
};
