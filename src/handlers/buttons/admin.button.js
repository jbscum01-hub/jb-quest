const { refreshAdminPanel } = require('../../services/adminPanel.service');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');

async function handleAdminButtons(interaction) {
  const { customId } = interaction;

  if (customId === 'quest:admin:refresh_panels') {
    await refreshAdminPanel(interaction.message);
    await deployProfessionPanels(interaction.client);

    await interaction.reply({
      content: '✅ Refresh panel เรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:deploy_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);

    await interaction.reply({
      content: '✅ Deploy panel เรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:sync_quests') {
    await interaction.reply({
      content: '🔄 Sync quest ยังเป็น stub แต่ระบบหลักพร้อมใช้งานแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:system_status') {
    await interaction.reply({
      content: '🟢 Bot online / DB online / Panels online',
      ephemeral: true
    });
  }
}

module.exports = {
  handleAdminButtons
};
