const { saveCreateQuestFromModal } = require('../../services/adminPanel.service');

async function handleAdminCreateQuestModal(interaction) {
  const raw = interaction.customId.split(':')[3] || '';
  if (raw.startsWith('GLOBAL|')) {
    const [, categoryCode] = raw.split('|');
    await saveCreateQuestFromModal(interaction, { categoryCode });
    return;
  }

  const [professionCode, level] = raw.split('|');
  await saveCreateQuestFromModal(interaction, { professionCode, level: Number(level) });
}

module.exports = { handleAdminCreateQuestModal };
