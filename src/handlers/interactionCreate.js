const { parseCustomId } = require('../utils/customId');
const { logger } = require('../config/logger');
const { handlePanelButton } = require('./buttons/panel.button');
const { handleReviewButton } = require('./buttons/review.button');
const { handleAdminButtons } = require('./buttons/admin.button');
const { handleQuestSubmissionModal } = require('./modals/questSubmission.modal');

function registerInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('quest:admin')) {
          await handleAdminButtons(interaction);
          return;
        }

        const parsed = parseCustomId(interaction.customId);
        if (!parsed) return;

        if (parsed.scope === 'panel') {
          await handlePanelButton(interaction, parsed);
          return;
        }

        if (parsed.scope === 'review') {
          await handleReviewButton(interaction, parsed);
          return;
        }

        await interaction.reply({
          content: 'ยังไม่รองรับ interaction นี้ในระบบ',
          ephemeral: true
        });
        return;
      }

      if (interaction.isModalSubmit()) {
        const parsed = parseCustomId(interaction.customId);
        if (!parsed) return;

        if (parsed.scope === 'modal_submit') {
          await handleQuestSubmissionModal(interaction, parsed);
          return;
        }

        await interaction.reply({
          content: 'ยังไม่รองรับ modal นี้ในระบบ',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('interactionCreate handler failed', error);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: 'เกิดข้อผิดพลาดระหว่างประมวลผล',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: 'เกิดข้อผิดพลาดระหว่างประมวลผล',
        ephemeral: true
      });
    }
  });
}

module.exports = {
  registerInteractionHandler
};
