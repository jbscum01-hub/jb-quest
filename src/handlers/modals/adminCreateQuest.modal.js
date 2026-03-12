const { saveCreateQuestFromModal } = require('../../services/adminPanel.service');

async function handleAdminCreateQuestModal(interaction) {
  const raw = interaction.customId.split(':')[3] || '';
  const [professionCode, level] = raw.split('|');
  await saveCreateQuestFromModal(interaction, professionCode, Number(level));
}

module.exports = { handleAdminCreateQuestModal };
