const adminService = require('../../services/adminPanel.service');

async function handleAdminSearchQuestModal(interaction) {
  if (!interaction.isModalSubmit()) return false;
  if (interaction.customId !== 'admin:master:search_submit') return false;

  const query = interaction.fields.getTextInputValue('query');
  await interaction.reply(await adminService.buildSearchResultPayload(query));
  return true;
}

module.exports = { handleAdminSearchQuestModal };
