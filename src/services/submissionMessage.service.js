const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { getConfig } = require('./config.service');
const { findSubmissionById, saveSubmissionMessageRefs } = require('../db/queries/submission.repo');

function buildReviewActionRows(submissionId) {
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
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`quest:review:reward:${submissionId}`)
      .setLabel('🎁 รางวัล')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1];
}

function buildClosedRows() {
  return [];
}

function buildSubmissionEmbed({
  submissionId,
  discordUserId,
  characterName,
  professionCode,
  questName,
  screenshot,
  reviewerText = '-',
  reviewNote = '-',
  title = '📩 Quest Submission',
  color = 0x2b82ff
}) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(
`Submission ID: ${submissionId}
ผู้เล่น: <@${discordUserId}>
ชื่อในเกม: ${characterName}
สายอาชีพ: ${professionCode}
เควส: ${questName}
ผู้ตรวจ: ${reviewerText}
หมายเหตุ: ${reviewNote}`
    )
    .setImage(screenshot || null)
    .setTimestamp();
}

async function sendSubmissionMirrors({
  client,
  submission,
  discordUserId,
  characterName,
  professionCode,
  questName,
  screenshot
}) {
  const reviewChannelId = await getConfig('QUEST_REVIEW_CHANNEL');
  const logChannelId = await getConfig('QUEST_SUBMISSION_LOG_CHANNEL');

  if (!reviewChannelId) {
    throw new Error('ไม่พบ QUEST_REVIEW_CHANNEL ใน config');
  }

  if (!logChannelId) {
    throw new Error('ไม่พบ QUEST_SUBMISSION_LOG_CHANNEL ใน config');
  }

  const reviewChannel = await client.channels.fetch(reviewChannelId);
  const logChannel = await client.channels.fetch(logChannelId);

  const reviewEmbed = buildSubmissionEmbed({
    submissionId: submission.submission_id,
    discordUserId,
    characterName,
    professionCode,
    questName,
    screenshot
  });

  const logEmbed = buildSubmissionEmbed({
    submissionId: submission.submission_id,
    discordUserId,
    characterName,
    professionCode,
    questName,
    screenshot
  });

  const reviewMessage = await reviewChannel.send({
    embeds: [reviewEmbed],
    components: buildReviewActionRows(submission.submission_id)
  });

  const logMessage = await logChannel.send({
    embeds: [logEmbed]
  });

  await saveSubmissionMessageRefs({
    submissionId: submission.submission_id,
    reviewChannelId: reviewChannel.id,
    reviewMessageId: reviewMessage.id,
    logChannelId: logChannel.id,
    logMessageId: logMessage.id
  });

  return {
    reviewMessage,
    logMessage
  };
}

async function updateSubmissionMirrors({
  client,
  submissionId,
  action,
  reviewerId,
  reviewNote = '-'
}) {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new Error('ไม่พบ submission');
  }

  let title = '📩 Quest Submission';
  let color = 0x2b82ff;

  if (action === 'approve') {
    title = '🛠️ ผลการตรวจเควส: อนุมัติ';
    color = 0x57f287;
    reviewNote = '-';
  }

  if (action === 'revision') {
    title = '🛠️ ผลการตรวจเควส: ขอแก้ไข';
    color = 0xfee75c;
  }

  const embed = buildSubmissionEmbed({
    submissionId: submission.submission_id,
    discordUserId: submission.discord_user_id,
    characterName: submission.player_ingame_name || '-',
    professionCode: submission.profession_code || '-',
    questName: submission.quest_name || '-',
    screenshot: submission.submission_text || null,
    reviewerText: `<@${reviewerId}>`,
    reviewNote,
    title,
    color
  });

  if (submission.review_channel_id && submission.review_message_id) {
    const reviewChannel = await client.channels.fetch(submission.review_channel_id).catch(() => null);
    if (reviewChannel) {
      const reviewMessage = await reviewChannel.messages.fetch(submission.review_message_id).catch(() => null);
      if (reviewMessage) {
        await reviewMessage.edit({
          embeds: [embed],
          components: buildClosedRows()
        });
      }
    }
  }

  if (submission.log_channel_id && submission.log_message_id) {
    const logChannel = await client.channels.fetch(submission.log_channel_id).catch(() => null);
    if (logChannel) {
      const logMessage = await logChannel.messages.fetch(submission.log_message_id).catch(() => null);
      if (logMessage) {
        await logMessage.edit({
          embeds: [embed]
        });
      }
    }
  }

  return submission;
}

module.exports = {
  buildReviewActionRows,
  buildClosedRows,
  sendSubmissionMirrors,
  updateSubmissionMirrors
};
