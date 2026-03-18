const { saveCreateQuestFromModal } = require('../../services/adminPanel.service');

async function handleAdminCreateQuestModal(interaction) {
  const raw = interaction.customId.split(':')[3] || '';
  const [professionCode, level, categoryCode] = raw.split('|');
  await saveCreateQuestFromModal(interaction, professionCode, Number(level), categoryCode || 'MAIN');
}

module.exports = { handleAdminCreateQuestModal };