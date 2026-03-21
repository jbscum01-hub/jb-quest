const { handleAdminModalSubmit } = require('../../services/adminPanel.service');

async function handleAdminQuestEditDescriptionModal(interaction) {
  return handleAdminModalSubmit(interaction);
}

module.exports = {
  handleAdminQuestEditDescriptionModal
};
