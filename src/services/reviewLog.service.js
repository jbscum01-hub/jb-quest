const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./config.service');

function replaceLine(description, label, value) {
  const pattern = new RegExp(`${label}:\\s*.*`);
  const replacement = `${label}: ${value}`;

  if (pattern.test(description)) {
    return description.replace(pattern, replacement);
  }

  return `${description}\n${replacement}`;
}

function buildLogEmbedFromSubmission(submission, action, reviewerId, reviewNote = '-') {
  const title =
    action === 'approve'
      ? '🛠️ ผลการตรวจเควส: อนุมัติ'
      : '🛠️ ผลการตรวจเควส: ขอแก้ไข';

  const color = action === 'approve' ? 0x57f287 : 0xfee75c;

  let description =
`Submission ID: ${submission.submission_id}
ผู้เล่น: <@${submission.discord_user_id}>
ชื่อในเกม: ${submission.player_ingame_name || '-'}
สายอาชีพ: ${submission.profession_code || '-'}
เควส: ${submission.quest_name || '-'}
ผู้ตรวจ: <@${reviewerId}>
หมายเหตุ: ${reviewNote || '-'}`;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(description)
    .setTimestamp();

  if (submission.submission_text) {
    embed.setImage(submission.submission_text);
  }

  return embed;
}

async function sendReviewLog(client, submission, action, reviewerId, reviewNote = '-') {
  const logChannelId = await getConfig('QUEST_SUBMISSION_LOG_CHANNEL');
  if (!logChannelId) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;

  const embed = buildLogEmbedFromSubmission(submission, action, reviewerId, reviewNote);

  await channel.send({
    embeds: [embed]
  });
}

module.exports = {
  sendReviewLog
};
