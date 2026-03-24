const {
  saveQuestRewardFromModal,
  addQuestRewardFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestRewardModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const targetId = parts[3];

  if (action === 'rewe') {
    await saveQuestRewardFromModal(interaction, targetId);
    return;
  }

  if (action === 'rewa') {
    await addQuestRewardFromModal(interaction, targetId);
    return;
  }

  if (action === 'edit_reward') {
    await saveQuestRewardFromModal(interaction, parts[4]);
    return;
  }
  if (action === 'add_reward') {
    await addQuestRewardFromModal(interaction, parts[3]);
  }
}

module.exports = { handleAdminQuestRewardModal };
