const {
  renderLevelBrowser,
  renderQuestBrowser,
  renderQuestDetail
} = require('../../services/adminPanel.service');

async function handleAdminSelects(interaction) {
  const { customId, values } = interaction;
  const parts = customId.split(':');
  const action = parts[2];

  if (action === 'select_profession') {
    const professionId = values[0];
    await renderLevelBrowser(interaction, professionId);
    return;
  }

  if (action === 'select_level') {
    const professionId = parts[3];
    const questLevel = values[0];
    await renderQuestBrowser(interaction, professionId, questLevel);
    return;
  }

  if (action === 'select_quest') {
    const professionId = parts[3];
    const questLevel = parts[4];
    const questId = values[0];
    await renderQuestDetail(interaction, questId, professionId, questLevel);
    return;
  }

  await interaction.reply({
    content: 'ยังไม่รองรับ select menu นี้ในระบบแอดมิน',
    ephemeral: true
  });
}

module.exports = {
  handleAdminSelects
};
