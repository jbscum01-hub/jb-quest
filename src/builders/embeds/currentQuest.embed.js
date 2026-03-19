const { EmbedBuilder } = require('discord.js');
const { getQuestColor } = require('../../utils/questColor.util');

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(text, max = 1024) {
  const value = String(text || '').trim();
  if (!value) return '-';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function formatRequirement(row) {
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  if (row.requirement_type === 'IMAGE') return '• ส่งภาพหลักฐาน';

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

  // ดึง xจำนวน
  let qty = '';
  const matchQty = text.match(/\bx\s*(\d+)\b/i);

  if (matchQty) {
    qty = matchQty[1];
    text = text.replace(matchQty[0], '').trim();
  } else if (row.required_quantity) {
    qty = row.required_quantity;
  }

  // ดึง (desc)
  let desc = '';
  const matchDesc = text.match(/\(([^()]+)\)/);

  if (matchDesc) {
    desc = cleanText(matchDesc[1]);
    text = text.replace(matchDesc[0], '').trim();
  }

  text = cleanText(text);

  // รวมทุกอย่างในบรรทัดเดียว
  let line = qty ? `• x${qty} ${text}` : `• ${text}`;

  if (desc) {
    line += ` (${desc})`;
  }

  return line;
}

function chunkRequirement(lines, maxLength = 1024) {
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;

    if (next.length > maxLength) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : ['-'];
}

function formatReward(row) {
  if (row.reward_display_text) return `• ${cleanText(row.reward_display_text)}`;
  if (row.reward_item_name && row.reward_quantity) return `• ${row.reward_item_name} x${row.reward_quantity}`;
  if (row.reward_item_name) return `• ${row.reward_item_name}`;

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

function getQuestTypeText(quest) {
  if (quest.category_code === 'LEGENDARY') return 'Legendary Quest';
  if (quest.category_code === 'TIMED') return 'Special Quest';
  if (quest.is_repeatable) return 'Repeatable Quest';
  if (quest.is_step_quest) return 'Step Quest';
  return 'Main Quest';
}

function getFameDisplayText(quest) {
  const fame = Number(quest.fame_required_display || 0);

  if (quest.is_step_quest) return 'ไม่จำกัด';
  if (!fame) return 'ไม่จำกัด';

  return fame.toLocaleString('en-US');
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
      .setTitle(`✅ ${profession?.profession_name_th || professionCode}`)
      .setDescription('คุณจบเควสหลักทั้งหมดแล้ว')
      .setFooter({ text: 'SCUM Quest System' })
      .setTimestamp();
  }

  if (!quest) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`ไม่พบเควสของสาย ${professionCode}`);
  }

  const requirementLines = requirements.map(formatRequirement).filter(Boolean);
  const rewardLines = rewards.map(formatReward).filter(Boolean);

  const requirementChunks = chunkRequirement(requirementLines);
  const rewardChunks = chunkRequirement(rewardLines);

  const embed = new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setTitle(`📜 ${quest.quest_name}`)
    .addFields({
      name: '📌 ข้อมูลเควส',
      value: [
        `- สายอาชีพ: ${quest.profession_code}`,
        `- ระดับ: Lv.${quest.quest_level}`,
        `- ประเภท: ${getQuestTypeText(quest)}`,
        `- Fame ขั้นต่ำ: ${getFameDisplayText(quest)}`
      ].join('\n')
    });

  requirementChunks.forEach((chunk, i) => {
    embed.addFields({
      name: i === 0 ? '📦 สิ่งที่ต้องส่ง' : '📦 สิ่งที่ต้องส่ง (ต่อ)',
      value: chunk
    });
  });

  rewardChunks.forEach((chunk, i) => {
    embed.addFields({
      name: i === 0 ? '🎁 รางวัล' : '🎁 รางวัล (ต่อ)',
      value: chunk
    });
  });

  return embed
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildCurrentQuestEmbed
};
