const { EmbedBuilder } = require('discord.js');
const { getQuestColor } = require('../../utils/questColor.util');

function truncate(text, max = 1024) {
  const value = String(text || '').trim();
  if (!value) return '-';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

// แยกข้อความ requirement เป็น: qty / item / desc(ในวงเล็บ) / ที่เหลือ (คงไว้ท้าย item)
function extractRequirementParts(row) {
  const baseText =
    row.display_text ||
    row.item_name ||
    row.input_label ||
    row.admin_display_text ||
    '';

  let text = cleanText(baseText);

  // 1) ดึงจำนวน x20, x 20
  let qty = '';
  const matchQty = text.match(/\bx\s*(\d+)\b/i);
  if (matchQty) {
    qty = `x${matchQty[1]}`;
    text = cleanText(text.replace(matchQty[0], ' '));
  } else if (Number.isFinite(Number(row.required_quantity)) && Number(row.required_quantity) > 0) {
    qty = `x${Number(row.required_quantity)}`;
  }

  // 2) ดึง (desc)
  let desc = '';
  const matchDesc = text.match(/\(([^()]+)\)/);
  if (matchDesc) {
    desc = cleanText(matchDesc[1]);
    text = cleanText(text.replace(matchDesc[0], ' '));
  }

  // 3) ที่เหลือคงไว้เป็น item (รวม condition เช่น เหลือเกินครึ่ง, Stack เต็ม ฯลฯ)
  const item = text;

  return { qty, item, desc };
}

// แสดงแบบ Compact Hybrid (แถวเดียว)
function formatRequirementLine(row) {
  // กรณี special types
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

  const { qty, item, desc } = extractRequirementParts(row);

  // รูปแบบ:
  // • x20 Painkillers (ยาแก้ปวด-กล่อง) เหลือเกินครึ่ง
  // • x1 Copper Coin
  let line = '• ';

  if (qty) line += `${qty} `;
  line += item;

  if (desc) {
    // ใส่ desc ในวงเล็บต่อท้าย item
    line += ` (${desc})`;
  }

  return cleanText(line);
}

// chunk สำหรับ requirement (เว้นบรรทัดระหว่าง item)
function chunkRequirementLines(lines, maxLength = 1024) {
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line; // ไม่ต้องเว้นบรรทัดเพิ่มแล้ว (compact)
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

// reward (ไม่เว้นบรรทัด)
function chunkLinesCompact(lines, maxLength = 1024) {
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

function buildQuestInfoBlock({ professionCode, quest }) {
  return [
    `- สายอาชีพ: ${quest.profession_code || professionCode || '-'}`,
    `- ระดับ: ${quest.quest_level ? `Lv.${quest.quest_level}` : '-'}${quest.is_step_quest ? ' Step Quest' : ''}`,
    `- ประเภท: ${getQuestTypeText(quest)}`,
    `- Fame ขั้นต่ำ: ${getFameDisplayText(quest)}`
  ].join('\n');
}

function buildCurrentQuestEmbed({
  professionCode,
  profession,
  quest,
  requirements = [],
  rewards = [],
  completedAllMain = false,
  guideMedia = []
}) {
  if (!quest && completedAllMain) {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`✅ ${profession?.profession_name_th || professionCode}`)
      .setDescription('คุณจบเควสหลักทั้งหมดแล้ว รออัปเดตเควสใหม่')
      .setFooter({ text: 'SCUM Quest System' })
      .setTimestamp();
  }

  if (!quest) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`ไม่พบเควสของสาย ${professionCode}`)
      .setDescription('กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล');
  }

  const requirementLines = requirements.map(formatRequirementLine).filter(Boolean);
  const rewardLines = rewards.map(formatReward).filter(Boolean);

  const requirementChunks = chunkRequirementLines(requirementLines);
  const rewardChunks = chunkLinesCompact(rewardLines);

  const embed = new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setTitle(`${quest.icon_emoji || (quest.is_repeatable ? '♻️' : '📜')} ${quest.quest_name}`)
    .setDescription(truncate(quest.quest_description || quest.panel_description || 'เควสนี้ไม่มีคำอธิบาย'))
    .addFields({
      name: '📌 ข้อมูลเควส',
      value: truncate(buildQuestInfoBlock({ professionCode, quest })),
      inline: false
    });

  requirementChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '📦 สิ่งที่ต้องส่ง / เงื่อนไข' : '📦 สิ่งที่ต้องส่ง / เงื่อนไข (ต่อ)',
      value: truncate(chunk),
      inline: false
    });
  });

  rewardChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '🎁 รางวัล' : '🎁 รางวัล (ต่อ)',
      value: truncate(chunk),
      inline: false
    });
  });

  return embed
    .setFooter({ text: quest.fame_note || 'SCUM Quest System' })
    .setTimestamp();
}

function buildCurrentQuestImageEmbeds(guideMedia = [], title = 'รูปตัวอย่างเควส', limit = 8, quest = null) {
  const color = quest ? getQuestColor(quest) : 0x5865f2;

  return guideMedia.slice(0, limit).map((row, index) => new EmbedBuilder()
    .setColor(color)
    .setTitle(`🖼️ ${title} ${index + 1}/${guideMedia.length}`)
    .setDescription(row.media_title || row.media_description || `รูปตัวอย่าง ${index + 1}`)
    .setImage(row.media_url)
    .setFooter({ text: 'SCUM Quest System' }));
}

module.exports = {
  buildCurrentQuestEmbed,
  buildCurrentQuestImageEmbeds
};
