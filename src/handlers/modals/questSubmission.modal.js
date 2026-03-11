const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const crypto = require('crypto');
const { getConfig } = require('../../services/config.service');
const { getCurrentQuestSummary } = require('../../services/panel.service');
const { submitQuest } = require('../../services/submission.service');

function generateSubmissionId() {
  return crypto.randomUUID();
}

async function handleQuestSubmissionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const { action, extra } = parsed;
    const submissionMode = action;
    const professionCode = extra;

    const characterName = interaction.fields.getTextInputValue('character_name');
    const screenshot = interaction.fields.getTextInputValue('screenshot');

    const reviewChannelId = await getConfig('QUEST_REVIEW_CHANNEL');

    if (!reviewChannelId) {
      await interaction.editReply({
        content: '❌ ไม่พบ QUEST_REVIEW_CHANNEL ใน config'
      });
      return;
    }

    const reviewChannel = await interaction.client.channels.fetch(reviewChannelId);

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

    const embed = new EmbedBuilder()
      .setTitle('📩 Quest Submission')
      .setColor(0x2b82ff)
      .setDescription(
`Submission ID: ${result.submission.submission_id || generateSubmissionId()}
ผู้เล่น: <@${interaction.user.id}>
ชื่อในเกม: ${characterName}
สายอาชีพ: ${professionCode}
เควส: ${questName}
ผู้ตรวจ: -
หมายเหตุ: -`
      )
      .setImage(screenshot)
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:review:inspect:${result.submission.submission_id}`)
        .setLabel('🔎 ตรวจสอบ')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`quest:review:approve:${result.submission.submission_id}`)
        .setLabel('✅ อนุมัติ')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`quest:review:revision:${result.submission.submission_id}`)
        .setLabel('📝 ขอแก้ไข')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`quest:review:reward:${result.submission.submission_id}`)
        .setLabel('🎁 รางวัล')
        .setStyle(ButtonStyle.Secondary)
    );

    await reviewChannel.send({
      embeds: [embed],
      components: [row1]
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
