const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { getConfig } = require('../../services/config.service');
const { getCurrentQuestSummary } = require('../../services/panel.service');

function generateSubmissionId() {
  return crypto.randomUUID();
}

async function handleQuestSubmissionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const { action, extra } = parsed;

    const submissionMode = action;
    const professionCode = extra;

    const submissionId = generateSubmissionId();

    const characterName =
      interaction.fields.getTextInputValue('character_name');

    const screenshot =
      interaction.fields.getTextInputValue('screenshot');

    const reviewChannelId =
      await getConfig('QUEST_REVIEW_CHANNEL');

    if (!reviewChannelId) {
      await interaction.editReply({
        content: '❌ ไม่พบ QUEST_REVIEW_CHANNEL ใน config'
      });
      return;
    }

    const reviewChannel =
      await interaction.client.channels.fetch(reviewChannelId);

    // ดึงเควสปัจจุบันของผู้เล่นจริง
    const currentQuestSummary =
      await getCurrentQuestSummary(
        interaction.user.id,
        professionCode
      );

    const currentQuest = currentQuestSummary?.quest || null;

    const questName =
      currentQuest?.quest_name || `${professionCode} Lv.?`;

    const questLevel =
      currentQuest?.quest_level ?? '-';

    const embed = new EmbedBuilder()
      .setTitle('📩 Quest Submission')
      .setColor(0x2b82ff)
      .addFields(
        { name: 'Submission ID', value: `${submissionId}` },
        { name: 'ผู้เล่น', value: characterName || interaction.user.username },
        { name: 'Discord Tag', value: interaction.user.tag || '-' },
        { name: 'สายอาชีพ', value: professionCode || '-' },
        { name: 'เควส', value: questName },
        { name: 'เลเวลเควส', value: `${questLevel}` },
        { name: 'โหมดเควส', value: submissionMode || '-' },
        { name: 'ผู้ตรวจ', value: '-' },
        { name: 'หมายเหตุ', value: '-' }
      )
      .setImage(screenshot)
      .setFooter({
        text: `Discord ID: ${interaction.user.id}`
      })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:review:inspect:${submissionId}`)
        .setLabel('🔎 ตรวจสอบ')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`quest:review:approve:${submissionId}`)
        .setLabel('✅ อนุมัติ')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`quest:review:revision:${submissionId}`)
        .setLabel('📝 ขอแก้ไข')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:review:reject:${submissionId}`)
        .setLabel('❌ ปฏิเสธ')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`quest:review:reward:${submissionId}`)
        .setLabel('🎁 ดูรางวัล')
        .setStyle(ButtonStyle.Secondary)
    );

    await reviewChannel.send({
      embeds: [embed],
      components: [row1, row2]
    });

    await interaction.editReply({
      content: '✅ ส่งเควสเรียบร้อยแล้ว ทีมงานกำลังตรวจสอบ'
    });
  } catch (error) {
    console.error(error);

    await interaction.editReply({
      content: '❌ เกิดข้อผิดพลาดระหว่างส่งเควส'
    });
  }
}

module.exports = {
  handleQuestSubmissionModal
};
