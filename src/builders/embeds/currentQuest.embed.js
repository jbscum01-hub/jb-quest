const { EmbedBuilder } = require('discord.js');
const { getQuestColor } = require('../../utils/questColor.util');

const DIVIDER = '═════════════════════════════════';

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(text, max = 4096) {
  const value = String(text || '').trim();
  if (!value) return '-';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function getFameDisplayText(quest) {
  const fame = Number(quest?.fame_required_display || 0);
  if (quest?.is_step_quest) return 'ไม่จำกัด';
  if (!fame) return 'ไม่จำกัด';
  return fame.toLocaleString('en-US');
}

function formatRequirement(row) {
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  if (row.requirement_type === 'IMAGE') return '• ส่งภาพหลักฐาน';
  const text = cleanText(row.display_text || '');
  return text ? `• ${text}` : null;
}

function formatReward(row) {
  if (row.reward_display_text) return `• ${cleanText(row.reward_display_text)}`;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) return `• Role ID: ${row.discord_role_id}`;
  return null;
}

function buildHeaderBlock(quest, professionCode) {
  const questName = cleanText(quest?.quest_name || `${professionCode || quest?.profession_code || '-'} Lv.${quest?.quest_level || '-'}`);
  return [DIVIDER, `🧩 QUEST : ${questName}`, DIVIDER].join('\n');
}

function buildDescriptionSection(quest) {
  const desc = String(quest?.quest_description || '').trim();
  if (!desc) return null;
  return ['📍 รายละเอียด', desc].join('\n');
}

function buildConditionSection(quest, requirements = []) {
  const lines = ['✅ เงื่อนไขการส่ง', `• Fame ขั้นต่ำ : ${getFameDisplayText(quest)}`];
  for (const line of requirements.map(formatRequirement).filter(Boolean)) {
    if (!lines.includes(line)) lines.push(line);
  }
  return lines.join('\n');
}

function buildItemSection(requirements = []) {
  const itemLines = requirements.map(formatRequirement).filter(Boolean);
  return ['📦 สิ่งที่ต้องส่ง', ...(itemLines.length ? itemLines : ['• ไม่มี'])].join('\n');
}

function buildRewardSection(rewards = []) {
  const rewardLines = rewards.map(formatReward).filter(Boolean);
  return ['🎁 รางวัล', ...(rewardLines.length ? rewardLines : ['• ไม่มี'])].join('\n');
}

function buildCurrentQuestEmbed({ professionCode, profession, quest, requirements = [], rewards = [], completedAllMain = false }) {
  if (!quest && completedAllMain) {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription([DIVIDER, `✅ ${profession?.profession_name_th || professionCode || 'Quest'}`, DIVIDER, '', 'คุณจบเควสหลักทั้งหมดแล้ว'].join('\n'))
      .setFooter({ text: 'SCUM Quest System' })
      .setTimestamp();
  }

  if (!quest) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription([DIVIDER, `❌ ไม่พบเควสของสาย ${professionCode || '-'}`, DIVIDER, '', 'กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล'].join('\n'));
  }

  const description = [
    buildHeaderBlock(quest, professionCode),
    '',
    buildDescriptionSection(quest) || '',
    '',
    DIVIDER,
    buildConditionSection(quest, requirements),
    '',
    DIVIDER,
    buildItemSection(requirements),
    '',
    DIVIDER,
    buildRewardSection(rewards),
    '',
    DIVIDER
  ].filter(Boolean).join('\n');

  return new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setDescription(truncate(description, 4096))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

function buildCurrentQuestImageEmbeds(images = [], titlePrefix = 'รูปตัวอย่างเควส', limit = 8, quest = null) {
  return (images || []).slice(0, limit).map((item, index) => new EmbedBuilder()
    .setColor(getQuestColor(quest || {}))
    .setTitle(`${titlePrefix} ${index + 1}/${images.length}`)
    .setDescription(item.media_title || item.media_description || '-')
    .setImage(item.media_url));
}

module.exports = { buildCurrentQuestEmbed, buildCurrentQuestImageEmbeds };
