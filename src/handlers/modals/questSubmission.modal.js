const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

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

  // 🔴 ใส่ ID ห้อง quest-review ของคุณ
  const reviewChannelId = "1480607496023445665";

  const reviewChannel =
    await interaction.client.channels.fetch(reviewChannelId);

  const embed = new EmbedBuilder()
    .setTitle("📩 Quest Submission")
    .setColor(0x2b82ff)
    .addFields(
      { name: "Submission ID", value: `${submissionId}` },
      { name: "ผู้เล่น", value: characterName || interaction.user.username },
      { name: "สายอาชีพ", value: professionCode },
      { name: "เควส", value: `${professionCode} Lv.1` },
      { name: "ผู้ตรวจ", value: "-" },
      { name: "หมายเหตุ", value: "-" }
    )
    .setImage(screenshot)
    .setFooter({ text: `Discord: ${interaction.user.tag}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(`quest:review:approve:${interaction.user.id}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`quest:review:reject:${interaction.user.id}`)
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger)

  );

  await reviewChannel.send({
    embeds: [embed],
    components: [row]
  });

  await interaction.editReply({
    content: "✅ ส่งเควสเรียบร้อยแล้ว ทีมงานกำลังตรวจสอบ"
  });

}

module.exports = {
  handleQuestSubmissionModal
};
