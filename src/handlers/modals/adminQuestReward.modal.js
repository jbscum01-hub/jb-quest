const {
  saveQuestRewardFromModal,
  addQuestRewardFromModal
} = require('../../services/adminPanel.service');
const { findQuestRewardById } = require('../../db/queries/questMaster.repo');

async function handleAdminQuestRewardModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];

  if (action === 'rewe') {
    const rewardId = parts[2];
    const reward = await findQuestRewardById(rewardId);
    if (!reward) {
      await interaction.reply({ content: 'ไม่พบรางวัลนี้', ephemeral: true });
      return;
    }
    await saveQuestRewardFromModal(interaction, reward.quest_id, rewardId);
    return;
  }

  if (action === 'rewa') {
    const questId = parts[2];
    await addQuestRewardFromModal(interaction, questId);
  }
}

module.exports = {
  handleAdminQuestRewardModal
};
