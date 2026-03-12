const {
  buildLevelPickerPayload,
  buildQuestPickerPayload,
  buildQuestDetailPayload
} = require('../../services/adminPanel.service');
const {
  findRequirementById,
  findRewardById
} = require('../../db/queries/adminPanel.repo');
const { buildAdminEditRequirementModal } = require('../../builders/modals/adminEditRequirement.modal');
const { buildAdminEditRewardModal } = require('../../builders/modals/adminEditReward.modal');

function parseSelect(customId) {
  const parts = customId.split(':');
  return {
    action: parts[2] || null,
    arg1: parts[3] || null
  };
}

async function handleAdminSelect(interaction) {
  const { customId, values } = interaction;
  const { action, arg1 } = parseSelect(customId);
  const value = values[0];

  if (action === 'profession') {
    await interaction.update(await buildLevelPickerPayload(value));
    return;
  }

  if (action === 'level') {
    const [professionId, level] = value.split('|');
    await interaction.update(await buildQuestPickerPayload(professionId, Number(level)));
    return;
  }

  if (action === 'quest') {
    await interaction.update(await buildQuestDetailPayload(value));
    return;
  }

  if (action === 'requirement') {
    const requirement = await findRequirementById(value);
    await interaction.showModal(buildAdminEditRequirementModal(requirement));
    return;
  }

  if (action === 'reward') {
    const reward = await findRewardById(value);
    await interaction.showModal(buildAdminEditRewardModal(reward));
    return;
  }

  await interaction.reply({ content: 'ยังไม่รองรับ select menu นี้', ephemeral: true });
}

module.exports = {
  handleAdminSelect
};
