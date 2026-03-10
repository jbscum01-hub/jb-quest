const {
  refreshAdminPanel
} = require('../../services/adminPanel.service');

const {
  deployProfessionPanels
} = require('../../services/panelAutoDeploy.service');

async function handleAdminButtons(interaction) {

  const { customId } = interaction;

  if (customId === 'quest:admin:refresh_panels') {

    await refreshAdminPanel(interaction.message);

    return interaction.reply({
      content: '✅ Panel refreshed',
      ephemeral: true
    });
  }

  if (customId === 'quest:admin:deploy_panels') {

    await deployProfessionPanels(interaction.client);

    return interaction.reply({
      content: '✅ Panels deployed',
      ephemeral: true
    });
  }

  if (customId === 'quest:admin:sync_quests') {

    return interaction.reply({
      content: '🔄 Quest sync coming soon',
      ephemeral: true
    });
  }

  if (customId === 'quest:admin:system_status') {

    return interaction.reply({
      content: '🟢 System running',
      ephemeral: true
    });
  }

}

module.exports = {
  handleAdminButtons
};
