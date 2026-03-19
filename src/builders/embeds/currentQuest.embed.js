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
  if (row.requirement_type === 'INGAME_NAME') {
    return '• ระบุชื่อตัวละคร';
  }

  if (row.requirement_type === 'IMAGE') {
    return '• ส่งภาพหลักฐาน';
  }

  if (row.requirement_type === 'CUSTOM_TEXT') {
    return `• ${cleanText(
      row.display_text ||
        row.input_label ||
        row.admin_display_text ||
        'เงื่อนไขเพิ่มเติม'
    )}`;
  }

  const baseText =
    row.display_text ||
    row.item_name ||
    row.input_label ||
    row.admin_display_text ||
    '';

  let text = cleanText(baseText);
  let qty = '';

  const qtyMatch = text.match(/\bx\s*(\d+)\b/i);

  if (qtyMatch) {
    qty = qtyMatch[1];
    text = cleanText(text.replace(qtyMatch[0], ' '));
  } else if (
    Number.isFinite(Number(row.required_quantity)) &&
    Number(row.required_quantity) > 0
  ) {
    qty = String(Number(row.required_quantity));
  }

  return qty ? `• x${qty} ${text}` : `• ${text}`;
}

function formatReward(row) {
  if (row.reward_display_text) {
    return `• ${cleanText(row.reward_display_text)}`;
  }

  if (row.reward_item_name && row.reward_quantity) {
    return `• ${row.reward_item_name} x${row.reward_quantity}`;
  }

  if (row.reward_item_name) {
    return `• ${row.reward_item_name}`;
  }

  if (row.reward_type === 'SCUM_MONEY' && row.reward_value_number) {
    return `• เงิน ${Number(row.reward_value_number).toLocaleString('en-US')}`;
  }

  if (row.reward_type === 'FAME_POINT' && row.reward_value_number) {
    return `• FP ${Number(row.reward_value_number).toLocaleString('en-US')}`;
  }

  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_name) {
    return `• Role: ${row.discord_role_name}`;
  }

  return `• ${cleanText(row.reward_type || 'รางวัล')}`;
}

function buildHeaderBlock(quest, professionCode) {
  const questName = cleanText(
    quest?.quest_name ||
      `${professionCode || quest?.profession_code || '-'} Lv.${quest?.quest_level || '-'}`
  );

  return [
    DIVIDER,
    `🧩 QUEST : ${questName}`,
    DIVIDER
  ].join('\n');
}

function buildDescriptionSection(quest) {
  const desc = String(quest?.quest_description || '').trim();
  if (!desc) return null;

  return [
    '📍 รายละเอียด',
    desc
  ].join('\n');
}

function buildConditionSection(quest, requirements = []) {
  const lines = [
    '✅ เงื่อนไขการส่ง',
    `• Fame ขั้นต่ำ : ${getFameDisplayText(quest)}`
  ];

  const requirementLines = requirements
    .map(formatRequirement)
    .filter(Boolean);

  const nonItemLines = requirementLines.filter(
    (line) =>
      line === '• ระบุชื่อตัวละคร' ||
      line === '• ส่งภาพหลักฐาน' ||
      !line.startsWith('• x')
  );

  for (const line of nonItemLines) {
    if (!lines.includes(line)) {
      lines.push(line);
    }
  }

  return lines.join('\n');
}

function buildItemSection(requirements = []) {
  const itemLines = requirements
    .map(formatRequirement)
    .filter((line) => line && line.startsWith('• x'));

  return ['📦 สิ่งที่ต้องส่ง', ...itemLines].join('\n');
}

function buildRewardSection(rewards = []) {
  const rewardLines = rewards.map(formatReward).filter(Boolean);
  return ['🎁 รางวัล', ...rewardLines].join('\n');
}

function buildCurrentQuestEmbed({
  professionCode,
  profession,
  quest,
  requirements = [],
  rewards = [],
  completedAllMain = false
}) {
  if (!quest && completedAllMain) {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription([
        DIVIDER,
        `✅ ${profession?.profession_name_th || professionCode || 'Quest'}`,
        DIVIDER,
        '',
        'คุณจบเควสหลักทั้งหมดแล้ว'
      ].join('\n'))
      .setFooter({ text: 'SCUM Quest System' })
      .setTimestamp();
  }

  if (!quest) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription([
        DIVIDER,
        `❌ ไม่พบเควสของสาย ${professionCode || '-'}`,
        DIVIDER,
        '',
        'กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล'
      ].join('\n'));
  }

  const headerBlock = buildHeaderBlock(quest, professionCode);
  const descriptionSection = buildDescriptionSection(quest);
  const conditionBlock = buildConditionSection(quest, requirements);
  const itemBlock = buildItemSection(requirements);
  const rewardBlock = buildRewardSection(rewards);

  const description = [
    headerBlock,
    '',
    descriptionSection || '',
    descriptionSection ? '' : '',
    conditionBlock,
    '',
    DIVIDER,
    itemBlock,
    '',
    DIVIDER,
    rewardBlock,
    '',
    DIVIDER
  ]
    .filter(Boolean)
    .join('\n');

  return new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setDescription(truncate(description, 4096))
    .setFooter({ text: quest.fame_note || 'SCUM Quest System' })
    .setTimestamp();
}

function buildCurrentQuestImageEmbeds(
  guideMedia = [],
  title = 'รูปตัวอย่างเควส',
  limit = 8,
  quest = null
) {
  if (!Array.isArray(guideMedia) || guideMedia.length === 0) {
    return [];
  }

  const color = quest ? getQuestColor(quest) : 0x5865f2;

  return guideMedia.slice(0, limit).map((row, index) => {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🖼️ ${title} ${index + 1}/${guideMedia.length}`)
      .setFooter({ text: 'SCUM Quest System' });

    if (row.media_title || row.media_description) {
      embed.setDescription(
        cleanText(row.media_title || row.media_description)
      );
    }

    if (row.media_url) {
      embed.setImage(row.media_url);
    }

    return embed;
  });
}

module.exports = {
  buildCurrentQuestEmbed,
  buildCurrentQuestImageEmbeds
};
