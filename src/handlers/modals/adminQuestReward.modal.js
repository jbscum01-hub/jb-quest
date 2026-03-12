const {
  saveQuestRewardFromModal,
  addQuestRewardFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestRewardModal(interaction) {
  if (interaction.customId.startsWith('q:rewe:')) {
    const rewardId = interaction.customId.split(':').slice(-1)[0];
    await saveQuestRewardFromModal(interaction, null, rewardId);
    return;
  }

  if (interaction.customId.startsWith('q:rewa:')) {
    const questId = interaction.customId.split(':').slice(-1)[0];
    await addQuestRewardFromModal(interaction, questId);
    return;
  }

  const parts = interaction.customId.split(':');
  const action = parts[2];

  if (action === 'edit_reward') {
    const questId = parts[3];
    const rewardId = parts[4];
    await saveQuestRewardFromModal(interaction, questId, rewardId);
    return;
  }

  if (action === 'add_reward') {
    const questId = parts[3];
    await addQuestRewardFromModal(interaction, questId);
  }
}

module.exports = {
  handleAdminQuestRewardModal
};
