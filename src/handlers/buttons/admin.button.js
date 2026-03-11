const {
  refreshAdminPanel,
  renderAdminHome,
  showPanelManagement,
  showMasterHome,
  showProfessionBrowse,
  showQuestDetail,
  showRequirements,
  showRewards,
  showDependencies,
  showImages,
  showSteps,
  showPanelStatus,
  openCreateQuestModal,
  openEditDescriptionModal,
  openAddRequirementModal,
  openAddRewardModal,
  openAddImageModal,
  openEditDependencyModal,
  showRequirementEditor,
  showRewardEditor,
  toggleQuestActiveWithAudit
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
    await refreshAdminPanel(interaction.message);
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '✅ รีเฟรชพาเนลเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId === 'quest:admin:deploy_panels' || customId === 'quest:admin:repair_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await interaction.reply({
      content: customId.endsWith('repair_panels') ? '🛠️ ซ่อม/สร้างพาเนลที่ขาดเรียบร้อยแล้ว' : '✅ สร้างพาเนลเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:refresh_current_view') {
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '🔄 รีเฟรชมุมมองเควสปัจจุบันเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId === 'quest:admin:panel_status') {
    await showPanelStatus(interaction);
    return;
  }

  if (customId === 'quest:admin:create_quest') {
    await openCreateQuestModal(interaction);
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

  if (customId.startsWith('quest:admin:view_steps:')) {
    await showSteps(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:edit_description:')) {
    await openEditDescriptionModal(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:edit_requirements:')) {
    await showRequirementEditor(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:edit_rewards:')) {
    await showRewardEditor(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:edit_dependency:')) {
    await openEditDependencyModal(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:add_requirement:')) {
    await openAddRequirementModal(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:add_reward:')) {
    await openAddRewardModal(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:add_image:')) {
    await openAddImageModal(interaction, getLastPart(customId));
    return;
  }

  if (customId.startsWith('quest:admin:toggle_active:')) {
    const questId = getLastPart(customId);
    await toggleQuestActiveWithAudit(questId, {
      actorId: interaction.user.id,
      actorTag: interaction.user.tag
    });
    await showQuestDetail(interaction, questId);
  }
}

module.exports = {
  handleAdminButtons
};
