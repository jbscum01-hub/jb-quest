const {
  addQuestImageFromModal,
  addStepImageFromModal
} = require('../../services/adminPanel.service');

async function handleAdminQuestImageModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const targetId = parts[3];

  if (action === 'qimg') {
    await addQuestImageFromModal(interaction, targetId);
    return;
  }

  if (action === 'simg') {
    await addStepImageFromModal(interaction, targetId);
    return;
  }

  if (interaction.customId.startsWith('quest:admin_modal:add_image:')) {
    const questId = parts.slice(3).join(':');
    await addQuestImageFromModal(interaction, questId);
  }
}

module.exports = { handleAdminQuestImageModal };
