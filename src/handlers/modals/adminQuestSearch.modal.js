const { renderQuestSearchResults } = require('../../services/adminPanel.service');

async function handleAdminQuestSearchModal(interaction) {
  const keyword = interaction.fields.getTextInputValue('keyword');
  await renderQuestSearchResults(interaction, keyword);
}

module.exports = {
  handleAdminQuestSearchModal
};
