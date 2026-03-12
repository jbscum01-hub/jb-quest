const { buildAdminSearchQuestModal } = require('../../builders/modals/adminSearchQuest.modal');
const adminService = require('../../services/adminPanel.service');

function splitCustomId(customId) {
  return String(customId || '').split(':');
}

async function replyOrUpdate(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  return interaction.update(payload);
}

async function handleAdminButtons(interaction) {
  const parts = splitCustomId(interaction.customId);
  if (parts[0] !== 'admin') return false;

  if (interaction.isButton()) {
    if (interaction.customId === 'admin:home') {
      await replyOrUpdate(interaction, await adminService.buildAdminHomePayload());
      return true;
    }

    if (interaction.customId === 'admin:panel:home') {
      await replyOrUpdate(interaction, await adminService.buildPanelManagementPayload());
      return true;
    }

    if (interaction.customId === 'admin:panel:status') {
      await replyOrUpdate(interaction, await adminService.buildPanelStatusPayload());
      return true;
    }

    if (interaction.customId === 'admin:panel:deploy_players' || interaction.customId === 'admin:panel:refresh_players') {
      await interaction.reply({ content: 'เมนูนี้ยังไม่เปิดใช้งานจริงในชุดนี้ เดี๋ยวค่อยต่อ logic deploy / refresh พาเนลผู้เล่น', ephemeral: true });
      return true;
    }

    if (interaction.customId === 'admin:master:home') {
      await replyOrUpdate(interaction, await adminService.buildMasterHomePayload());
      return true;
    }

    if (interaction.customId === 'admin:master:browse') {
      await replyOrUpdate(interaction, await adminService.buildBrowseProfessionPayload());
      return true;
    }

    if (interaction.customId === 'admin:master:search') {
      await interaction.showModal(buildAdminSearchQuestModal());
      return true;
    }

    if (interaction.customId === 'admin:master:create') {
      await interaction.reply({ content: 'เมนูสร้างเควสใหม่ยังเตรียมไว้ก่อน เดี๋ยวค่อยต่อในรอบถัดไป', ephemeral: true });
      return true;
    }

    if (parts[0] === 'admin' && parts[1] === 'master' && parts[2] === 'back_to_level') {
      const professionId = parts[3];
      await replyOrUpdate(interaction, await adminService.buildBrowseLevelPayload(professionId));
      return true;
    }

    if (parts[0] === 'admin' && parts[1] === 'master' && parts[2] === 'back_to_quests') {
      const professionId = parts[3];
      const level = Number(parts[4]);
      await replyOrUpdate(interaction, await adminService.buildBrowseQuestPayload(professionId, level));
      return true;
    }

    if (parts[0] === 'admin' && parts[1] === 'quest') {
      const action = parts[2];
      const questId = parts[3];

      if (['edit_description', 'edit_requirements', 'edit_rewards', 'edit_dependency', 'add_image', 'toggle_active', 'add_requirement', 'add_reward'].includes(action)) {
        await interaction.reply({ content: `เมนู ${action} ยังเตรียมไว้ก่อน เดี๋ยวค่อยต่อ logic แก้ไขจริง`, ephemeral: true });
        return true;
      }

      if (action === 'detail') {
        await replyOrUpdate(interaction, await adminService.buildQuestDetailPayload(questId));
        return true;
      }
    }
  }

  return false;
}

module.exports = { handleAdminButtons };
