const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { getConfig } = require('../../services/config.service');

function generateSubmissionId() {
  return Math.floor(100000 + Math.random() * 900000);
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

    // ดึง channel id จาก config table
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

    const embed = new EmbedBuilder()
      .setTitle("📩 Quest Submission")
      .setColor(0x2b82ff)
      .setDescription(
`Submission ID: ${submissionId}

ผู้เล่น: ${characterName}

สายอาชีพ: ${professionCode}

เควส: ${professionCode} Lv.1

ผู้ตรวจ: -

หมายเหตุ: -`
      )
      .setImage(screenshot)
      .setFooter({
        text: `Discord: ${interaction.user.tag}`
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`quest:review:approve:${interaction.user.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`quest:review:reject:${interaction.user.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)

    );

    await reviewChannel.send({
      embeds: [embed],
      components: [row]
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
