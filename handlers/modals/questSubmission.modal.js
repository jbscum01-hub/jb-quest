const { getCurrentQuestSummary } = require('../../services/panel.service');
const { submitQuest } = require('../../services/submission.service');
const { sendSubmissionMirrors } = require('../../services/submissionMessage.service');
const { findQuestById } = require('../../db/queries/questMaster.repo');

async function handleQuestSubmissionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const { action, extra } = parsed;
    const submissionMode = action;
    const contextValue = extra;

    const characterName = interaction.fields.getTextInputValue('character_name');
    const screenshot = interaction.fields.getTextInputValue('screenshot');

    const submitPayload = {
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      discordDisplayName: interaction.member?.displayName || interaction.user.username,
      submissionMode,
      ingameName: characterName,
      submissionText: screenshot,
      attachments: []
    };

    let professionCode = '-';
    let questName = '-';

    if (submissionMode === 'GLOBAL') {
      submitPayload.questId = contextValue;
      const quest = await findQuestById(contextValue);
      if (!quest) throw new Error('ไม่พบเควสที่ต้องการส่ง');
      professionCode = quest.category_code === 'LEGENDARY' ? 'LEGENDARY' : 'SPECIAL';
      questName = quest.quest_name || quest.quest_code;
    } else {
      submitPayload.professionCode = contextValue;
      professionCode = contextValue;
    }

    const result = await submitQuest(submitPayload);

    if (submissionMode !== 'GLOBAL') {
      const currentQuestSummary = await getCurrentQuestSummary(interaction.user.id, contextValue);
      const currentQuest = result.quest || currentQuestSummary?.quest || null;
      questName = currentQuest?.quest_name || `${contextValue} Lv.?`;
    }

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
