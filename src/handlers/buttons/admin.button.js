const { buildAdminSearchQuestModal } = require('../../builders/modals/adminSearchQuest.modal');
const {
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionBrowser,
  renderLevelBrowser,
  renderQuestBrowser,
  renderQuestDetail,
  renderQuestRequirements,
  renderQuestRewards,
  renderQuestDependencies,
  renderQuestImages,
  runPanelDeploy,
  runPanelRefresh,
  runPanelRepair,
  runCurrentQuestRefresh,
  renderPanelStatus,
  buildStubActionEmbed
} = require('../../services/adminPanel.service');

async function handleAdminButtons(interaction) {
  const { customId } = interaction;
  const parts = customId.split(':');
  const action = parts[2];

  if (customId === 'quest:admin:home') {
    await renderAdminHome(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_home') {
    await renderPanelManagement(interaction);
    return;
  }

  if (customId === 'quest:admin:master_home') {
    await renderMasterHome(interaction);
    return;
  }

  if (customId === 'quest:admin:master_browse') {
    await renderProfessionBrowser(interaction);
    return;
  }

  if (customId === 'quest:admin:master_search') {
    await interaction.showModal(buildAdminSearchQuestModal());
    return;
  }

  if (customId === 'quest:admin:master_create') {
    await interaction.reply({
      embeds: [buildStubActionEmbed('สร้างเควสใหม่')],
      ephemeral: true
    });
    return;
  }

  if (customId === 'quest:admin:panel_deploy_players') {
    await runPanelDeploy(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_refresh_players') {
    await runPanelRefresh(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_repair_missing') {
    await runPanelRepair(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_refresh_current') {
    await runCurrentQuestRefresh(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_status') {
    await renderPanelStatus(interaction);
    return;
  }

  if (action === 'back_levels') {
    const professionId = parts[3];
    await renderLevelBrowser(interaction, professionId);
    return;
  }

  if (action === 'back_quests') {
    const professionId = parts[3];
    const questLevel = parts[4];
    await renderQuestBrowser(interaction, professionId, questLevel);
    return;
  }

  if (action === 'quest_detail') {
    const questId = parts[3];
    const professionId = parts[4];
    const questLevel = parts[5];
    await renderQuestDetail(interaction, questId, professionId, questLevel);
    return;
  }

  if (action === 'view_requirements') {
    const questId = parts[3];
    const professionId = parts[4];
    const questLevel = parts[5];
    await renderQuestRequirements(interaction, questId, professionId, questLevel);
    return;
  }

  if (action === 'view_rewards') {
    const questId = parts[3];
    const professionId = parts[4];
    const questLevel = parts[5];
    await renderQuestRewards(interaction, questId, professionId, questLevel);
    return;
  }

  if (action === 'view_dependency') {
    const questId = parts[3];
    const professionId = parts[4];
    const questLevel = parts[5];
    await renderQuestDependencies(interaction, questId, professionId, questLevel);
    return;
  }

  if (action === 'view_images') {
    const questId = parts[3];
    const professionId = parts[4];
    const questLevel = parts[5];
    await renderQuestImages(interaction, questId, professionId, questLevel);
    return;
  }

  if (['edit_description', 'edit_dependency', 'edit_requirements', 'edit_rewards', 'add_image', 'add_requirement', 'add_reward', 'toggle_active'].includes(action)) {
    const questId = parts[3];
    await interaction.reply({
      embeds: [buildStubActionEmbed(action.replaceAll('_', ' '), questId)],
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: 'ยังไม่รองรับปุ่มนี้ในระบบแอดมิน',
    ephemeral: true
  });
}

module.exports = {
  handleAdminButtons
};
