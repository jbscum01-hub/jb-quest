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
  renderQuestDetail,
  renderQuestImageManager,
  renderPanelStatus,
  renderRequirementEditor,
  renderRewardEditor,
  toggleQuestActiveAndRender,
  showQuestDescriptionModal,
  showAddRequirementModal,
  showAddRewardModal,
  removeQuestImageAndRender
} = require('../../services/adminPanel.service');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');

async function handleAdminButtons(interaction) {
  const { customId } = interaction;
  const parts = customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;

  if (action === 'home_panels') return renderPanelManagement(interaction);
  if (action === 'home_master') return renderMasterHome(interaction);

  if (action === 'home_refresh') {
    await refreshAdminPanel(interaction.message);
    await interaction.reply({ content: '✅ รีเฟรชแผงแอดมินเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'back_home') return renderAdminHome(interaction);

  if (action === 'refresh_panels') {
    await refreshAdminPanel(interaction.message);
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '✅ รีเฟรชพาเนลผู้เล่นเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'deploy_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '✅ สร้าง/อัปเดตพาเนลผู้เล่นเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'repair_panels') {
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '🛠️ ระบบพยายามซ่อมพาเนลที่หายแล้ว', ephemeral: true });
    return;
  }

  if (action === 'refresh_current_quest') {
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '🔄 รีเฟรชข้อมูลเควสปัจจุบันเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'panel_status') return renderPanelStatus(interaction);
  if (action === 'browse_quests') return renderProfessionPicker(interaction);
  if (action === 'browse_levels') return renderLevelPicker(interaction, extra);

  if (action === 'back_quest_list') {
    const [professionCode, levelText] = (extra || '').split('|');
    return renderQuestList(interaction, professionCode, Number(levelText));
  }

  if (action === 'search_quest') return interaction.showModal(buildQuestSearchModal());

  if (action === 'create_quest') {
    await interaction.reply({
      content: '🧱 ปุ่มสร้างเควสถูกเตรียมไว้แล้ว แต่รอบนี้ยังไม่ได้ลง flow create จริง',
      ephemeral: true
    });
    return;
  }

  if (action === 'toggle_active') return toggleQuestActiveAndRender(interaction, extra);
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
  if (action === 'edit_requirements') return renderRequirementEditor(interaction, extra);
  if (action === 'edit_rewards') return renderRewardEditor(interaction, extra);
  if (action === 'add_requirement') return showAddRequirementModal(interaction, extra);
  if (action === 'add_reward') return showAddRewardModal(interaction, extra);

  if (action === 'edit_dependency') {
    await interaction.reply({
      content: '🛠️ ปุ่มแก้เควสก่อนหน้าถูกผูกกับเควสนี้แล้ว แต่รอบนี้ยังไม่ได้ลงหน้าแก้ dependency จริง',
      ephemeral: true
    });
    return;
  }

  if (action === 'open_quest') return renderQuestDetail(interaction, extra);
}

module.exports = {
  handleAdminButtons
};
