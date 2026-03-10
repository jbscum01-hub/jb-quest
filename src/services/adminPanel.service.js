const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');

async function sendAdminPanel(channel) {
  const embed = buildAdminPanelEmbed();
  const components = buildAdminPanelButtons();

  await channel.send({
    embeds: [embed],
    components
  });
}

async function refreshAdminPanel(message) {
  const embed = buildAdminPanelEmbed();
  const components = buildAdminPanelButtons();

  await message.edit({
    embeds: [embed],
    components
  });
}

module.exports = {
  sendAdminPanel,
  refreshAdminPanel
};
