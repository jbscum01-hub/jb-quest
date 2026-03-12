const { buildSearchResultsPayload } = require('../../services/adminPanel.service');

async function handleAdminSearchQuestModal(interaction) {
  const query = interaction.fields.getTextInputValue('query')?.trim();
  await interaction.reply({ ...(await buildSearchResultsPayload(query)), ephemeral: true });
}

module.exports = {
  handleAdminSearchQuestModal
};
