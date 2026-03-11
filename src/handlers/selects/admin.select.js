const {
  showLevelBrowse,
  showQuestBrowse,
  showQuestDetail
} = require('../../services/adminPanel.service');

async function handleAdminSelect(interaction) {
  const { customId, values } = interaction;
  const selected = values[0];

  if (customId === 'quest:admin:select_profession') {
    await showLevelBrowse(interaction, selected);
    return;
  }

  if (customId.startsWith('quest:admin:select_level:')) {
    const professionId = customId.split(':')[4];
    await showQuestBrowse(interaction, professionId, Number(selected));
    return;
  }

  if (customId.startsWith('quest:admin:select_quest:')) {
    await showQuestDetail(interaction, selected);
  }
}

module.exports = {
  handleAdminSelect
};
