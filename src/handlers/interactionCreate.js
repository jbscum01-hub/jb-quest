const { parseCustomId } = require('../utils/customId');
const { logger } = require('../config/logger');
const { handlePanelButton } = require('./buttons/panel.button');
const { handleReviewButton } = require('./buttons/review.button');
const { handleAdminButtons } = require('./buttons/admin.button');
const { handleTicketButton } = require('./buttons/ticket.button');
const { handleQuestSubmissionModal } = require('./modals/questSubmission.modal');
const { handleReviewRevisionModal } = require('./modals/reviewRevision.modal');
const { handleStepSubmissionModal } = require('./modals/stepSubmission.modal');
const { handleAdminQuestSearchModal } = require('./modals/adminQuestSearch.modal');
const { handleAdminQuestImageModal } = require('./modals/adminQuestImage.modal');
const { handleAdminQuestDescriptionModal } = require('./modals/adminQuestDescription.modal');
const { handleAdminQuestRequirementModal } = require('./modals/adminQuestRequirement.modal');
const { handleAdminQuestRewardModal } = require('./modals/adminQuestReward.modal');
const { handleAdminSelect } = require('./selects/admin.select');

function registerInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('quest:admin')) {
          await handleAdminButtons(interaction);
          return;
        }

        const parsed = parseCustomId(interaction.customId);

        if (!parsed) {
          await interaction.reply({ content: 'รูปแบบปุ่มไม่ถูกต้อง', flags: 64 });
          return;
        }

        if (parsed.scope === 'panel') {
          await handlePanelButton(interaction, parsed);
          return;
        }

        if (parsed.scope === 'review') {
          await handleReviewButton(interaction, parsed);
          return;
        }

        if (parsed.scope === 'ticket') {
          await handleTicketButton(interaction, parsed);
          return;
        }

        await interaction.reply({ content: 'ยังไม่รองรับ interaction นี้ในระบบ', flags: 64 });
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('quest:admin_select')) {
          await handleAdminSelect(interaction);
          return;
        }

        await interaction.reply({ content: 'ยังไม่รองรับ select menu นี้', flags: 64 });
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'quest:admin_modal:quest_search') {
          await handleAdminQuestSearchModal(interaction);
          return;
        }

        if (interaction.customId.startsWith('quest:admin_modal:add_image:')) {
          await handleAdminQuestImageModal(interaction);
          return;
        }

        if (interaction.customId.startsWith('quest:admin_modal:edit_description:')) {
          await handleAdminQuestDescriptionModal(interaction);
          return;
        }

        if (interaction.customId.startsWith('quest:admin_modal:edit_requirement:')
          || interaction.customId.startsWith('quest:admin_modal:add_requirement:')
          || interaction.customId.startsWith('q:reqe:')
          || interaction.customId.startsWith('q:reqa:')) {
          await handleAdminQuestRequirementModal(interaction);
          return;
        }

        if (interaction.customId.startsWith('quest:admin_modal:edit_reward:')
          || interaction.customId.startsWith('quest:admin_modal:add_reward:')
          || interaction.customId.startsWith('q:rewe:')
          || interaction.customId.startsWith('q:rewa:')) {
          await handleAdminQuestRewardModal(interaction);
          return;
        }

        const parsed = parseCustomId(interaction.customId);

        if (!parsed) {
          await interaction.reply({ content: 'รูปแบบฟอร์มไม่ถูกต้อง', flags: 64 });
          return;
        }

        if (parsed.scope === 'modal_submit' && parsed.action === 'review_revision') {
          await handleReviewRevisionModal(interaction, parsed);
          return;
        }

        if (parsed.scope === 'modal_submit' && parsed.action === 'step_submit') {
          await handleStepSubmissionModal(interaction, parsed);
          return;
        }

        if (parsed.scope === 'modal_submit') {
          await handleQuestSubmissionModal(interaction, parsed);
          return;
        }

        await interaction.reply({ content: 'ยังไม่รองรับ modal นี้ในระบบ', flags: 64 });
      }
    } catch (error) {
      logger.error('interactionCreate handler failed', error);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'เกิดข้อผิดพลาดระหว่างประมวลผล', flags: 64 });
        return;
      }

      await interaction.reply({ content: `เกิดข้อผิดพลาดระหว่างประมวลผล: ${error.message}`, flags: 64 });
    }
  });
}

module.exports = {
  registerInteractionHandler
};
