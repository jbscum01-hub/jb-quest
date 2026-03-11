const {
  renderAdminHome,
  showPanelManagement,
  showMasterHome,
  showProfessionBrowse,
  showQuestDetail,
  showRequirements,
  showRewards,
  showDependencies,
  showImages,
  showPanelStatus,
  logAdminAction
} = require('../../services/adminPanel.service');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');

function getLastPart(customId) {
  return customId.split(':').pop();
}

async function handleAdminButtons(interaction) {
  const { customId } = interaction;

  if (customId === 'quest:admin:home') {
    await renderAdminHome(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_home') {
    await showPanelManagement(interaction);
    return;
  }

  if (customId === 'quest:admin:master_home') {
    await showMasterHome(interaction);
    return;
  }

  if (customId === 'quest:admin:browse_start') {
    await showProfessionBrowse(interaction);
    return;
  }

  if (customId === 'quest:admin:refresh_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await logAdminAction(interaction, { actionType: 'PANEL_REFRESHED', targetTable: 'panel' });
    await interaction.reply({ content: '✅ รีเฟรชพาเนลเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId === 'quest:admin:deploy_panels' || customId === 'quest:admin:repair_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await logAdminAction(interaction, {
      actionType: customId.endsWith('repair_panels') ? 'PANEL_REPAIRED' : 'PANEL_DEPLOYED',
      targetTable: 'panel'
    });
    await interaction.reply({
      content: customId.endsWith('repair_panels') ? '🛠️ ซ่อม/สร้างพาเนลที่ขาดเรียบร้อยแล้ว' : '✅ สร้างพาเนลเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:refresh_current_view') {
    await deployProfessionPanels(interaction.client);
    await logAdminAction(interaction, { actionType: 'PANEL_CURRENT_QUEST_REFRESHED', targetTable: 'panel' });
    await interaction.reply({ content: '🔄 รีเฟรชมุมมองเควสปัจจุบันเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId === 'quest:admin:panel_status') {
    await showPanelStatus(interaction);
    return;
  }

  if (customId === 'quest:admin:create_quest_stub') {
    await interaction.reply({
      content: '📝 ปุ่มสร้างเควสใหม่เตรียมไว้แล้ว เดี๋ยวรอบถัดไปค่อยต่อ modal สำหรับสร้าง quest จริง',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:detail:')) {
    await showQuestDetail(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:view_requirements:')) {
    await showRequirements(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:view_rewards:')) {
    await showRewards(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:view_dependency:')) {
    await showDependencies(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:view_images:')) {
    await showImages(interaction, getLastPart(customId));
    return;
  }

  if (
    customId.startsWith('quest:admin:edit_description:') ||
    customId.startsWith('quest:admin:edit_requirements:') ||
    customId.startsWith('quest:admin:edit_rewards:') ||
    customId.startsWith('quest:admin:edit_dependency:') ||
    customId.startsWith('quest:admin:add_requirement:') ||
    customId.startsWith('quest:admin:add_reward:') ||
    customId.startsWith('quest:admin:add_image:') ||
    customId.startsWith('quest:admin:toggle_active:') ||
    customId.startsWith('quest:admin:view_steps:')
  ) {
    await interaction.reply({
      content: '🛠️ ปุ่มนี้วางโครงไว้แล้ว เพื่อให้ flow ไม่หลง แต่ logic แก้ข้อมูลจริงจะต่อในรอบถัดไป',
      ephemeral: true
    });
  }
}

module.exports = {
  handleAdminButtons
};
