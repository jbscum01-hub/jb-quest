const { renderSearchResults } = require('../../services/adminPanel.service');

async function handleAdminSearchQuestModal(interaction) {
  const keyword = interaction.fields.getTextInputValue('keyword').trim();
  await renderSearchResults(interaction, keyword);
}

module.exports = {
  handleAdminSearchQuestModal
};
