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

  const { action, extra } = parsed;

  const professionCode = extra;
  const submissionId = generateSubmissionId();

  const characterName =
    interaction.fields.getTextInputValue('character_name');

  const screenshot =
    interaction.fields.getTextInputValue('screenshot');

  const reviewChannelId =
    await getConfig('QUEST_REVIEW_CHANNEL');

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

  const row1 = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(`quest:review:inspect:${submissionId}`)
      .setLabel("🔎 ตรวจสอบ")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`quest:review:approve:${submissionId}`)
      .setLabel("✅ อนุมัติ")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`quest:review:revision:${submissionId}`)
      .setLabel("📝 ขอแก้ไข")
      .setStyle(ButtonStyle.Primary)

  );

  const row2 = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(`quest:review:reject:${submissionId}`)
      .setLabel("❌ ปฏิเสธ")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`quest:review:reward:${submissionId}`)
      .setLabel("🎁 ดูรางวัล")
      .setStyle(ButtonStyle.Secondary)

  );

  await reviewChannel.send({
    embeds: [embed],
    components: [row1, row2]
  });

  await interaction.editReply({
    content: "✅ ส่งเควสเรียบร้อยแล้ว ทีมงานกำลังตรวจสอบ"
  });

}

module.exports = {
  handleQuestSubmissionModal
};
