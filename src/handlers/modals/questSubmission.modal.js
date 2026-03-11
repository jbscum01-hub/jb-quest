const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { getConfig } = require('../../services/config.service');

function generateSubmissionId() {
  return crypto.randomUUID();
}

async function handleQuestSubmissionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const { extra } = parsed;
    const professionCode = extra;
    const submissionId = generateSubmissionId();

    const characterName =
      interaction.fields.getTextInputValue('character_name');

    const screenshot =
      interaction.fields.getTextInputValue('screenshot');

    const reviewChannelId = await getConfig('QUEST_REVIEW_CHANNEL');

    if (!reviewChannelId) {
      await interaction.editReply({
        content: '❌ ไม่พบ QUEST_REVIEW_CHANNEL ใน config'
      });
      return;
    }

    const reviewChannel =
      await interaction.client.channels.fetch(reviewChannelId);

    const embed = new EmbedBuilder()
      .setTitle('📩 Quest Submission')
      .setColor(0x2b82ff)
      .addFields(
        { name: 'Submission ID', value: `${submissionId}` },
        { name: 'ผู้เล่น', value: characterName || interaction.user.username },
        { name: 'สายอาชีพ', value: professionCode || '-' },
        { name: 'เควส', value: `${professionCode} Lv.1` },
        { name: 'ผู้ตรวจ', value: '-' },
        { name: 'หมายเหตุ', value: '-' }
      )
      .setImage(screenshot)
      .setFooter({
        text: `Discord: ${interaction.user.tag}`
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
