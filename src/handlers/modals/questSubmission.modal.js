const { getCurrentQuestSummary } = require('../../services/panel.service');
const { submitQuest } = require('../../services/submission.service');
const { sendSubmissionMirrors } = require('../../services/submissionMessage.service');

async function handleQuestSubmissionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const { action, extra } = parsed;
    const submissionMode = action;
    const professionCode = extra;

    const characterName = interaction.fields.getTextInputValue('character_name');
    const screenshot = interaction.fields.getTextInputValue('screenshot');

    const result = await submitQuest({
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      discordDisplayName: interaction.member?.displayName || interaction.user.username,
      professionCode,
      submissionMode,
      ingameName: characterName,
      submissionText: screenshot,
      attachments: []
    });

    const currentQuestSummary = await getCurrentQuestSummary(interaction.user.id, professionCode);
    const currentQuest = result.quest || currentQuestSummary?.quest || null;
    const questName = currentQuest?.quest_name || `${professionCode} Lv.?`;

    await sendSubmissionMirrors({
      client: interaction.client,
      submission: result.submission,
      discordUserId: interaction.user.id,
      characterName,
      professionCode,
      questName,
      screenshot
    });

    await interaction.editReply({
      content: '✅ ส่งเควสเรียบร้อยแล้ว ทีมงานกำลังตรวจสอบ'
    });
  } catch (error) {
    console.error(error);

    await interaction.editReply({
      content: `❌ ${error.message || 'เกิดข้อผิดพลาดระหว่างส่งเควส'}`
    });
  }
}

module.exports = {
  handleQuestSubmissionModal
};
