const { isQuestAdmin } = require('../../utils/permission');
const { buildStepSubmissionModal } = require('../../builders/modals/stepSubmission.modal');
const {
  approveCurrentStep,
  revisionCurrentStep,
  closeTicketRoom
} = require('../../services/stepTicket.service');

async function handleTicketButton(interaction, parsed) {
  const { action, extra } = parsed;

  if (action === 'submit_step') {
    const [ticketId, stepNo] = extra.split(':');
    const modal = buildStepSubmissionModal(ticketId, stepNo);
    await interaction.showModal(modal);
    return;
  }

  if (action === 'approve_step') {
    const isAdmin = await isQuestAdmin(interaction.member);
    if (!isAdmin) {
      await interaction.reply({
        content: '❌ เฉพาะแอดมินเควสเท่านั้น',
        flags: 64
      });
      return;
    }

    await interaction.deferReply({ flags: 64 });

    await approveCurrentStep({
      client: interaction.client,
      channelId: interaction.channelId,
      reviewerTag: interaction.user.tag,
      actionMessage: interaction.message
    });

    await interaction.editReply({
      content: '✅ อนุมัติ Step แล้ว'
    });
    return;
  }

  if (action === 'revision_step') {
    const isAdmin = await isQuestAdmin(interaction.member);
    if (!isAdmin) {
      await interaction.reply({
        content: '❌ เฉพาะแอดมินเควสเท่านั้น',
        flags: 64
      });
      return;
    }

    await interaction.deferReply({ flags: 64 });

    await revisionCurrentStep({
      client: interaction.client,
      channelId: interaction.channelId,
      reviewerTag: interaction.user.tag,
      actionMessage: interaction.message
    });

    await interaction.editReply({
      content: '📝 ส่งกลับให้ผู้เล่นแก้ไขแล้ว'
    });
    return;
  }

  if (action === 'close_room') {
    const isAdmin = await isQuestAdmin(interaction.member);
    if (!isAdmin) {
      await interaction.reply({
        content: '❌ เฉพาะแอดมินเควสเท่านั้น',
        flags: 64
      });
      return;
    }

    await interaction.deferReply({ flags: 64 });

    await closeTicketRoom({
      client: interaction.client,
      channelId: interaction.channelId,
      reviewerTag: interaction.user.tag
    });

    await interaction.editReply({
      content: '🔒 ปิดห้องเรียบร้อยแล้ว'
    });
    return;
  }

  await interaction.reply({
    content: '❌ ไม่พบ action ของ ticket นี้',
    flags: 64
  });
}

module.exports = {
  handleTicketButton
};
