const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./config.service');
const { getReviewColor } = require('../utils/questColor.util');

const DIVIDER = '═════════════════════════════════';
const PROFESSION_ICONS = {
  MEDIC: '🩺',
  FARMER: '🌾',
  SOLDIER: '🪖',
  FISHER: '🎣',
  HUNTER: '🦌',
  EXPLORER: '🧭',
  CHEF: '👨‍🍳',
  ENGINEER: '🛠️',
  AVIATION: '🛩️',
  LEGENDARY: '👑',
  SPECIAL: '🌸'
};

function cleanText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function getProfessionIcon(professionCode) {
  return PROFESSION_ICONS[String(professionCode || '').toUpperCase()] || '📘';
}

function buildQuestHeadline(submission) {
  const professionCode = cleanText(submission.profession_code, '-');
  const questName = cleanText(submission.quest_name, '-');
  return `${getProfessionIcon(professionCode)} ${questName} (${professionCode})`;
}

function buildLogEmbedFromSubmission(submission, action, reviewerId, reviewNote = '-') {
  const title =
    action === 'approve'
      ? '✅ อนุมัติเควส'
      : '⚠️ ขอแก้ไขเควส';

  const color = getReviewColor({ quest: submission, action });

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription([
      DIVIDER,
      title,
      DIVIDER,
      '',
      buildQuestHeadline(submission),
      '',
      `👤 ผู้เล่น: <@${submission.discord_user_id}>`,
      `🎮 ชื่อในเกม: ${cleanText(submission.player_ingame_name)}`,
      `🆔 Submission: ${cleanText(submission.submission_id)}`,
      `👮 ผู้ตรวจ: <@${reviewerId}>`,
      `📌 หมายเหตุ: ${cleanText(reviewNote)}`
    ].join('\n'))
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
