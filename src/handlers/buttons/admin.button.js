const { buildQuestSearchModal } = require('../../builders/modals/adminQuestSearch.modal');
const { buildQuestImageModal } = require('../../builders/modals/adminQuestImage.modal');
const {
  refreshAdminPanel,
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionPicker,
  renderLevelPicker,
  renderQuestList,
  renderCategoryQuestList,
  renderQuestDetail,
  renderQuestImageManager,
  renderPanelStatus,
  renderRequirementEditor,
  renderRewardEditor,
  toggleQuestActiveAndRender,
  showQuestDescriptionModal,
  showQuestFameModal,
  showAddRequirementModal,
  showAddRewardModal,
  removeQuestImageAndRender,
  showCreateQuestModal,
  showCreateGlobalQuestModal,
  showQuestScheduleModal,
  deployQuestPanelAndRender,
  renderDependencyEditor,
  renderStepManager,
  renderStepDetail,
  showAddStepModal,
  showEditStepModal,
  toggleStepActiveAndRender,
  renderStepImageManager,
  removeStepImageAndRender,
  showAddStepImageModal
} = require('../../services/adminPanel.service');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { deployAllGlobalQuestPanels } = require('../../services/globalPanel.service');
const { deployAllLegendaryClaimPanels } = require('../../services/legendaryClaimPanel.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');


const EPHEMERAL_FLAGS = 64;

async function runDeferredEphemeral(interaction, task, successMessage) {
  await interaction.deferReply({ flags: EPHEMERAL_FLAGS });
  await task();
  await interaction.editReply({ content: successMessage });
}


async function handleAdminButtons(interaction) {
  const { customId } = interaction;
  const parts = customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;

  if (action === 'home_panels') return renderPanelManagement(interaction);
  if (action === 'home_master') return renderMasterHome(interaction);

  if (action === 'home_refresh') {
    await runDeferredEphemeral(
      interaction,
      async () => {
        await refreshAdminPanel(interaction.message);
      },
      '✅ รีเฟรชแผงแอดมินเรียบร้อยแล้ว'
    );
    return;
  }

  if (action === 'back_home') return renderAdminHome(interaction);

  if (action === 'refresh_panels') {
    await runDeferredEphemeral(
      interaction,
      async () => {
        await refreshAdminPanel(interaction.message);
        await deployProfessionPanels(interaction.client);
        await deployAllGlobalQuestPanels(interaction.client);
        await deployAllLegendaryClaimPanels(interaction.client);
      },
      '✅ รีเฟรชพาเนลผู้เล่นเรียบร้อยแล้ว'
    );
    return;
  }

  if (action === 'deploy_panels') {
    await runDeferredEphemeral(
      interaction,
      async () => {
        await autoDeployAdminPanel(interaction.client);
        await deployProfessionPanels(interaction.client);
        await deployAllGlobalQuestPanels(interaction.client);
        await deployAllLegendaryClaimPanels(interaction.client);
      },
      '✅ สร้าง/อัปเดตพาเนลผู้เล่นเรียบร้อยแล้ว'
    );
    return;
  }

  if (action === 'repair_panels') {
    await runDeferredEphemeral(
      interaction,
      async () => {
        await deployProfessionPanels(interaction.client);
        await deployAllGlobalQuestPanels(interaction.client);
        await deployAllLegendaryClaimPanels(interaction.client);
      },
      '🛠️ ระบบพยายามซ่อมพาเนลที่หายแล้ว'
    );
    return;
  }

  if (action === 'refresh_current_quest') {
    await runDeferredEphemeral(
      interaction,
      async () => {
        await deployProfessionPanels(interaction.client);
        await deployAllGlobalQuestPanels(interaction.client);
        await deployAllLegendaryClaimPanels(interaction.client);
      },
      '🔄 รีเฟรชข้อมูลเควสปัจจุบันเรียบร้อยแล้ว'
    );
    return;
  }

  if (action === 'panel_status') return renderPanelStatus(interaction);
  if (action === 'browse_quests') return renderProfessionPicker(interaction, 'browse');
  if (action === 'browse_timed_quests') return renderCategoryQuestList(interaction, 'TIMED');
  if (action === 'browse_legendary_quests') return renderCategoryQuestList(interaction, 'LEGENDARY');
  if (action === 'browse_levels') return renderLevelPicker(interaction, extra, 'browse');

  if (action === 'back_quest_list') {
    const [professionCode, levelText] = (extra || '').split('|');
    return renderQuestList(interaction, professionCode, Number(levelText));
  }

  if (action === 'back_category_list') {
    return renderCategoryQuestList(interaction, extra);
  }

  if (action === 'search_quest') return interaction.showModal(buildQuestSearchModal());
  if (action === 'create_quest') return renderProfessionPicker(interaction, 'create');
  if (action === 'create_timed_quest') return showCreateGlobalQuestModal(interaction, 'TIMED');
  if (action === 'create_legendary_quest') return showCreateGlobalQuestModal(interaction, 'LEGENDARY');
  if (action === 'toggle_active') return toggleQuestActiveAndRender(interaction, extra);
  if (action === 'edit_schedule') return showQuestScheduleModal(interaction, extra);
  if (action === 'deploy_quest_panel' || action === 'refresh_quest_panel') return deployQuestPanelAndRender(interaction, extra);

  if (action === 'manage_images') {
    const [questId, indexText] = (extra || '').split('|');
    return renderQuestImageManager(interaction, questId, Number(indexText || 0));
  }
  if (action === 'image_prev' || action === 'image_next') {
    const [questId, indexText] = (extra || '').split('|');
    return renderQuestImageManager(interaction, questId, Number(indexText || 0));
  }
  if (action === 'image_remove') {
    const [questId, indexText] = (extra || '').split('|');
    return removeQuestImageAndRender(interaction, questId, Number(indexText || 0));
  }
  if (action === 'add_image') return interaction.showModal(buildQuestImageModal(extra));

  if (action === 'edit_description') return showQuestDescriptionModal(interaction, extra);
  if (action === 'edit_fame') return showQuestFameModal(interaction, extra);
  if (action === 'edit_requirements') return renderRequirementEditor(interaction, extra);
  if (action === 'edit_rewards') return renderRewardEditor(interaction, extra);
  if (action === 'add_requirement') return showAddRequirementModal(interaction, extra);
  if (action === 'add_reward') return showAddRewardModal(interaction, extra);
  if (action === 'edit_dependency') return renderDependencyEditor(interaction, extra);
  if (action === 'open_quest') return renderQuestDetail(interaction, extra);

  if (action === 'manage_steps') return renderStepManager(interaction, extra);
  if (action === 'add_step') return showAddStepModal(interaction, extra);
  if (action === 'open_step') return renderStepDetail(interaction, extra);
  if (action === 'edit_step') return showEditStepModal(interaction, extra);
  if (action === 'toggle_step') return toggleStepActiveAndRender(interaction, extra);
  if (action === 'manage_step_images') {
    const [stepId, indexText] = (extra || '').split('|');
    return renderStepImageManager(interaction, stepId, Number(indexText || 0));
  }
  if (action === 'step_image_prev' || action === 'step_image_next') {
    const [stepId, indexText] = (extra || '').split('|');
    return renderStepImageManager(interaction, stepId, Number(indexText || 0));
  }
  if (action === 'step_image_remove') {
    const [stepId, indexText] = (extra || '').split('|');
    return removeStepImageAndRender(interaction, stepId, Number(indexText || 0));
  }
  if (action === 'add_step_image') return showAddStepImageModal(interaction, extra);
}

module.exports = { handleAdminButtons };
