const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./config.service');

async function sendRevisionDm(client, submission, reviewNote) {
  try {
    const user = await client.users.fetch(submission.discord_user_id);

    if (!user) {
      return { ok: false, reason: 'USER_NOT_FOUND' };
    }

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('📝 คำขอแก้ไขเควส')
      .setDescription(
        [
          `เควส: ${submission.quest_name || '-'}`,
          `Submission ID: ${submission.submission_id}`,
          `สถานะ: ขอแก้ไข`,
          `เหตุผลจากแอดมิน: ${reviewNote || '-'}`,
          '',
          'โปรดแก้ไขและส่งใหม่ผ่าน panel ของสายอาชีพเดิม'
        ].join('\n')
      )
      .setTimestamp();

    await user.send({ embeds: [embed] });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message || 'DM_FAILED' };
  }
}

async function sendRevisionLog(client, submission, reviewerId, reviewNote, dmResult) {
  const logChannelId = await getConfig('QUEST_SUBMISSION_LOG_CHANNEL');

  if (!logChannelId) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('📝 Revision Requested')
    .setDescription(
      [
        `ผู้เล่น: <@${submission.discord_user_id}>`,
        `เควส: ${submission.quest_name || '-'}`,
        `Submission ID: ${submission.submission_id}`,
        `ผู้ตรวจ: <@${reviewerId}>`,
        `เหตุผล: ${reviewNote || '-'}`,
        `DM: ${dmResult.ok ? 'สำเร็จ' : 'ไม่สำเร็จ'}`
      ].join('\n')
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function notifyRevision({ client, submission, reviewerId, reviewNote }) {
  const dmResult = await sendRevisionDm(client, submission, reviewNote);
  await sendRevisionLog(client, submission, reviewerId, reviewNote, dmResult);
  return dmResult;
}

module.exports = {
  notifyRevision
};
