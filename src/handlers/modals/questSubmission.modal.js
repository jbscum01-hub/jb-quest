const { buildReviewCardEmbed } = require('../../builders/embeds/reviewCard.embed');
const { buildReviewCardComponents } = require('../../builders/components/reviewCard.components');
const { DISCORD_CONFIG_KEYS } = require('../../constants/discordConfigKeys');
const { getGlobalConfigValue } = require('../../services/discordConfig.service');
const { submitQuest } = require('../../services/submission.service');

async function handleQuestSubmissionModal(interaction, parsedCustomId) {
  const submissionMode = parsedCustomId.action;
  const professionCode = parsedCustomId.extra;

  const ingameName = interaction.fields.getTextInputValue('submission_ingame_name');
  const submissionText = interaction.fields.getTextInputValue('submission_text');

  const attachments = [];

  const result = await submitQuest({
    discordUserId: interaction.user.id,
    discordUsername: interaction.user.tag,
    discordDisplayName: interaction.member?.displayName || interaction.user.username,
    professionCode,
    submissionMode,
    ingameName,
    submissionText,
    attachments
  });

  const reviewChannelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_REVIEW_CHANNEL);

  if (reviewChannelId) {
    const reviewChannel = await interaction.client.channels.fetch(reviewChannelId).catch(() => null);

    if (reviewChannel) {
      const reviewEmbed = buildReviewCardEmbed({
        submission: result.submission,
        quest: result.quest,
        playerProfile: result.playerProfile,
        memberDisplayName: interaction.member?.displayName || interaction.user.username
      });

      const reviewComponents = buildReviewCardComponents(result.submission.submission_id);

      await reviewChannel.send({
        embeds: [reviewEmbed],
        components: reviewComponents
      });
    }
  }

  await interaction.reply({
    content: submissionMode === 'MAIN'
      ? `ส่งเควสหลักของสาย ${professionCode} เรียบร้อยแล้ว รอแอดมินตรวจสอบ`
      : `ส่งเควสซ้ำของสาย ${professionCode} เรียบร้อยแล้ว รอแอดมินตรวจสอบ`,
    ephemeral: true
  });
}

module.exports = {
  handleQuestSubmissionModal
};
