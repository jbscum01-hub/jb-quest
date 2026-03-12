const {
  renderLevelPicker,
  renderQuestList,
  renderQuestDetail
} = require('../../services/adminPanel.service');

async function handleAdminSelect(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;

  if (action === 'profession') {
    const professionCode = interaction.values[0];
    await renderLevelPicker(interaction, professionCode);
    return;
  }

  if (action === 'level') {
    const professionCode = extra;
    const level = Number(interaction.values[0]);
    await renderQuestList(interaction, professionCode, level);
    return;
  }

  if (action === 'quest') {
    const questId = interaction.values[0];
    if (questId === 'NO_QUEST') {
      await interaction.reply({ content: 'ไม่พบเควสให้เปิดรายละเอียด', ephemeral: true });
      return;
    }

    await renderQuestDetail(interaction, questId);
  }
}

module.exports = {
  handleAdminSelect
};
