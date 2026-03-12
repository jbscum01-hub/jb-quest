const { ensureAdmin } = require('../buttons/admin.button');
const { buildSearchResultPayload } = require('../../services/adminPanel.service');

async function handleAdminSearchQuestModal(interaction) {
  if (!(await ensureAdmin(interaction))) return;

  const query = interaction.fields.getTextInputValue('search_text')?.trim();
  await interaction.update(await buildSearchResultPayload(query));
}

module.exports = {
  handleAdminSearchQuestModal
};
