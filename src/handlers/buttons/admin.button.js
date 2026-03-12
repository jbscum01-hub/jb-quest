const { buildQuestSearchModal } = require('../../builders/modals/adminQuestSearch.modal');
const {
  refreshAdminPanel,
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionPicker,
  renderLevelPicker,
  renderQuestList,
  renderQuestDetail,
  renderPanelStatus,
  toggleQuestActiveAndRender
} = require('../../services/adminPanel.service');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');

async function handleAdminButtons(interaction) {
  const { customId } = interaction;
  const parts = customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;

  if (action === 'home_panels') {
    await renderPanelManagement(interaction);
    return;
  }

  if (action === 'home_master') {
    await renderMasterHome(interaction);
    return;
  }

  if (action === 'home_refresh') {
    await refreshAdminPanel(interaction.message);
    await interaction.reply({ content: '✅ รีเฟรชแผงแอดมินเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'back_home') {
    await renderAdminHome(interaction);
    return;
  }

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

  if (action === 'panel_status') {
    await renderPanelStatus(interaction);
    return;
  }

  if (action === 'browse_quests') {
    await renderProfessionPicker(interaction);
    return;
  }

  if (action === 'browse_levels') {
    await renderLevelPicker(interaction, extra);
    return;
  }

  if (action === 'back_quest_list') {
    const [professionCode, levelText] = (extra || '').split('|');
    await renderQuestList(interaction, professionCode, Number(levelText));
    return;
  }

  if (action === 'search_quest') {
    await interaction.showModal(buildQuestSearchModal());
    return;
  }

  if (action === 'create_quest') {
    await interaction.reply({
      content: '🧱 ปุ่มสร้างเควสถูกเตรียมไว้แล้ว แต่รอบนี้ยังไม่ได้ลง flow create จริง เพื่อให้โครงหน้าจัดการเควสเสร็จก่อน',
      ephemeral: true
    });
    return;
  }

  if (action === 'toggle_active') {
    await toggleQuestActiveAndRender(interaction, extra);
    return;
  }

  if (['edit_description', 'edit_requirements', 'edit_rewards', 'edit_dependency', 'manage_images', 'add_requirement', 'add_reward', 'add_image'].includes(action)) {
    await interaction.reply({
      content: `🛠️ ปุ่ม "${interaction.component.label}" ผูกกับเควสนี้แล้ว แต่รอบนี้ยังเป็นโครงหน้าจัดการและแสดงข้อมูลรวมก่อน`,
      ephemeral: true
    });
    return;
  }

  if (action === 'open_quest') {
    await renderQuestDetail(interaction, extra);
    return;
  }
}

module.exports = {
  handleAdminButtons
};
