const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

async function handleQuestSubmissionModal(interaction, parsed) {

  await interaction.deferReply({ flags: 64 });

  const { action, extra } = parsed;

  const submissionMode = action;
  const professionCode = extra;

  const characterName =
    interaction.fields.getTextInputValue('character_name');

  const screenshot =
    interaction.fields.getTextInputValue('screenshot');

  // ใช้ channel ที่กดส่งเควสแทนไปก่อน
  const reviewChannel = interaction.channel;

  const embed = new EmbedBuilder()
    .setTitle('📩 Quest Submission')
    .addFields(
      { name: 'ผู้เล่น', value: `<@${interaction.user.id}>` },
      { name: 'ตัวละคร', value: characterName || '-' },
      { name: 'สายอาชีพ', value: professionCode || '-' },
      { name: 'โหมดเควส', value: submissionMode || '-' }
    )
    .setImage(screenshot)
    .setColor(0x2b82ff)
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
    content: '✅ ส่งเควสเรียบร้อยแล้ว'
  });

}

module.exports = {
  handleQuestSubmissionModal
};
