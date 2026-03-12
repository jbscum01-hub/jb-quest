const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

module.exports = {
  refreshAdminPanel
};
