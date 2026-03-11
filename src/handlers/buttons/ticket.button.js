const { isQuestAdmin } = require('../../utils/permission');
const {
  submitCurrentStep,
  approveCurrentStep,
  revisionCurrentStep
} = require('../../services/stepTicket.service');

async function handleTicketButton(interaction, parsed) {
  const { action } = parsed;

  if (action === 'submit_step') {
    await interaction.deferReply({ flags: 64 });

    await submitCurrentStep({
      client: interaction.client,
      channelId: interaction.channelId,
      userId: interaction.user.id
    });

    await interaction.editReply({
      content: '✅ ส่งขั้นตอนนี้ให้แอดมินตรวจสอบแล้ว'
    });
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
      reviewerId: interaction.user.id,
      reviewerTag: interaction.user.tag
    });

    await interaction.editReply({
      content: '✅ อนุมัติขั้นตอนเรียบร้อยแล้ว'
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
      reviewerId: interaction.user.id,
      reviewerTag: interaction.user.tag
    });

    await interaction.editReply({
      content: '✅ ส่งกลับให้ผู้เล่นแก้ไขแล้ว'
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
