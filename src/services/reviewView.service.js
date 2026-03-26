const { EmbedBuilder } = require('discord.js');
const { findSubmissionById } = require('../db/queries/submission.repo');
const { findQuestRequirements, findQuestRewards, findQuestGuideMedia } = require('../db/queries/questMaster.repo');

function bulletifyMultiline(value, fallback = '• -') {
  const lines = String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? lines.map((line) => `• ${line}`).join('\n') : fallback;
}

function buildRewardLines(rewards) {
  const summary = [];
  const commands = [];

  for (const row of rewards.filter((item) => ['SCUM_ITEM', 'DISCORD_ROLE'].includes(item.reward_type))) {
    if (row.reward_type === 'SCUM_ITEM' && row.reward_display_text) summary.push(bulletifyMultiline(row.reward_display_text, ''));
    else if (row.reward_type === 'DISCORD_ROLE' && row.reward_display_text) summary.push(bulletifyMultiline(row.reward_display_text, ''));
    else if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) summary.push(`• Role ID: ${row.discord_role_id}`);

    if (row.reward_type === 'SCUM_ITEM' && row.reward_spawn_command_template) {
      commands.push(row.reward_spawn_command_template.trim());
    }
  }

  return {
    summaryText: summary.length ? summary.join('\n') : 'ไม่มี reward ในฐานข้อมูล',
    commandText: commands.length ? commands.join('\n') : 'ไม่มีคำสั่งไอเทมสำหรับเควสนี้'
  };
}

async function buildRequirementEmbedBySubmissionId(submissionId) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw new Error('ไม่พบ submission');

  const requirements = await findQuestRequirements(submission.quest_id);
  const media = await findQuestGuideMedia(submission.quest_id);
  const guideImage = media[0]?.media_url || null;
  const requirement = requirements.find((row) => row.step_id == null && row.display_text);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔎 ตรวจสอบเงื่อนไขเควส')
    .addFields(
      { name: 'เควส', value: submission.quest_name || '-', inline: false },
      { name: 'สายอาชีพ', value: submission.profession_name_th || submission.profession_code || '-', inline: false },
      { name: 'รายการที่ต้องส่ง', value: requirement ? bulletifyMultiline(requirement.display_text) : '-', inline: false }
    )
    .setFooter({ text: `Submission ID: ${submission.submission_id}` })
    .setTimestamp();

  if (guideImage) embed.setImage(guideImage);
  return embed;
}

async function buildRewardEmbedBySubmissionId(submissionId) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw new Error('ไม่พบ submission');

  const rewards = await findQuestRewards(submission.quest_id);
  const { summaryText, commandText } = buildRewardLines(rewards);

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🎁 รางวัลเควส')
    .addFields(
      { name: 'เควส', value: submission.quest_name || '-', inline: false },
      { name: 'สรุปรางวัล', value: summaryText, inline: false },
      { name: 'คำสั่งสำหรับแอดมิน', value: `\`\`\`txt\n${commandText}\n\`\`\``, inline: false }
    )
    .setFooter({ text: `Submission ID: ${submission.submission_id}` })
    .setTimestamp();
}

module.exports = { buildRequirementEmbedBySubmissionId, buildRewardEmbedBySubmissionId };
