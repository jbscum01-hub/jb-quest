const { parseCustomId } = require('../utils/customId');
const { logger } = require('../config/logger');

const { handlePanelButton } = require('./buttons/panel.button');
const { handleReviewButton } = require('./buttons/review.button');
const { handleAdminButtons } = require('./buttons/admin.button');
const { handleTicketButton } = require('./buttons/ticket.button');

const { handleQuestSubmissionModal } = require('./modals/questSubmission.modal');
const { handleReviewRevisionModal } = require('./modals/reviewRevision.modal');
const { handleStepSubmissionModal } = require('./modals/stepSubmission.modal');

const { handleAdminSelects } = require('./selects/admin.select');
const { handleAdminSearchQuestModal } = require('./modals/adminSearchQuest.modal');

async function safeReply(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    if (typeof interaction.followUp === 'function') {
      return interaction.followUp(payload).catch(() => null);
    }
    if (typeof interaction.editReply === 'function') {
      return interaction.editReply(payload).catch(() => null);
    }
    return null;
  }

  if (typeof interaction.reply === 'function') {
    return interaction.reply(payload).catch(() => null);
  }

  return null;
}

function registerInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      // =========================
      // ADMIN BUTTONS
      // =========================
      if (interaction.isButton()) {
        const handledAdminButton = await handleAdminButtons(interaction);
        if (handledAdminButton) return;
      }

      // =========================
      // ADMIN SELECT MENUS
      // =========================
      if (interaction.isStringSelectMenu()) {
        const handledAdminSelect = await handleAdminSelects(interaction);
        if (handledAdminSelect) return;
      }

      // =========================
      // ADMIN MODALS
      // =========================
      if (interaction.isModalSubmit()) {
        const handledAdminModal = await handleAdminSearchQuestModal(interaction);
        if (handledAdminModal) return;
      }

      // =========================
      // ORIGINAL BUTTON FLOW
      // =========================
      if (interaction.isButton()) {
        const parsed = parseCustomId(interaction.customId);

        if (!parsed) {
          await safeReply(interaction, {
            content: 'รูปแบบปุ่มไม่ถูกต้อง',
            flags: 64
          });
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

        await safeReply(interaction, {
          content: 'ยังไม่รองรับ interaction นี้ในระบบ',
          flags: 64
        });
        return;
      }

      // =========================
      // ORIGINAL MODAL FLOW
      // =========================
      if (interaction.isModalSubmit()) {
        const parsed = parseCustomId(interaction.customId);

        if (!parsed) {
          await safeReply(interaction, {
            content: 'รูปแบบฟอร์มไม่ถูกต้อง',
            flags: 64
          });
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

        await safeReply(interaction, {
          content: 'ยังไม่รองรับ modal นี้ในระบบ',
          flags: 64
        });
      }
    } catch (error) {
      logger.error('interactionCreate handler failed', error);

      await safeReply(interaction, {
        content: `เกิดข้อผิดพลาดระหว่างประมวลผล: ${error.message}`,
        flags: 64
      });
    }
  });
}

module.exports = {
  registerInteractionHandler
};
