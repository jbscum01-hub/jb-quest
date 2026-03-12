const { saveStepFromModal } = require('../../services/adminPanel.service');

async function handleAdminStepModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const targetId = parts[3];

  if (action === 'stpa') {
    await saveStepFromModal(interaction, 'add', targetId);
    return;
  }

  if (action === 'stpe') {
    await saveStepFromModal(interaction, 'edit', targetId);
  }
}

module.exports = { handleAdminStepModal };
