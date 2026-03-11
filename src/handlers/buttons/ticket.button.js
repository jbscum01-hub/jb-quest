const { buildStepSubmissionModal } = require('../../builders/modals/stepSubmission.modal');
const {
  submitCurrentStep,
  approveCurrentStep,
  revisionCurrentStep
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
    await interaction.deferReply({ flags: 64 });

    await approveCurrentStep({
      client: interaction.client,
      channelId: interaction.channelId,
      reviewerId: interaction.user.id,
      reviewerTag: interaction.user.tag
    });

    await interaction.editReply({
      content: '✅ อนุมัติ Step แล้ว'
    });
    return;
  }

  if (action === 'revision_step') {
    await interaction.deferReply({ flags: 64 });

    await revisionCurrentStep({
      client: interaction.client,
      channelId: interaction.channelId,
      reviewerId: interaction.user.id,
      reviewerTag: interaction.user.tag
    });

    await interaction.editReply({
      content: '📝 ส่งกลับให้ผู้เล่นแก้ไขแล้ว'
    });
    return;
  }
}

module.exports = {
  handleTicketButton
};
