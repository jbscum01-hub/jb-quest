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

function pad(value, length) {
  return String(value || '').padEnd(length, ' ');
}

function safeCell(value, maxLength) {
  const text = cleanText(value);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

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

function extractRequirementParts(row) {
  const baseText =
    row.display_text ||
    row.item_name ||
    row.input_label ||
    row.admin_display_text ||
    '';

  let text = cleanText(baseText);

  let qty = '-';
  const qtyMatch = text.match(/\bx\s*(\d+)\b/i);

  if (qtyMatch) {
    qty = `x${qtyMatch[1]}`;
    text = cleanText(text.replace(qtyMatch[0], ' '));
  } else if (Number.isFinite(Number(row.required_quantity)) && Number(row.required_quantity) > 0) {
    qty = `x${Number(row.required_quantity)}`;
  }

  let detail = '';
  const descMatch = text.match(/\(([^()]+)\)/);

  if (descMatch) {
    detail = cleanText(descMatch[1]);
    text = cleanText(text.replace(descMatch[0], ' '));
  }

  return {
    qty,
    item: text || '-',
    detail
  };
}

function buildRequirementRows(requirements = []) {
  const tableRows = [];
  const noteLines = [];

  for (const row of requirements) {
    if (row.requirement_type === 'INGAME_NAME') {
      noteLines.push('• ระบุชื่อตัวละคร');
      continue;
    }

    if (row.requirement_type === 'IMAGE') {
      noteLines.push('• ส่งภาพหลักฐาน');
      continue;
    }

    if (row.requirement_type === 'CUSTOM_TEXT') {
      noteLines.push(
        `• ${cleanText(
          row.display_text ||
            row.input_label ||
            row.admin_display_text ||
            'เงื่อนไขเพิ่มเติม'
        )}`
      );
      continue;
    }

    tableRows.push(extractRequirementParts(row));
  }

  return { tableRows, noteLines };
}

function chunkRequirementTable(tableRows = [], maxLength = 1024) {
  if (!tableRows.length) return ['```Qty  Item\n---- ------------------------------\n-    ไม่มีข้อมูล```'];

  const qtyWidth = 4;
  const itemWidth = 36;

  const header1 = `${pad('Qty', qtyWidth)} ${pad('Item', itemWidth)}`;
  const header2 = `${pad('----', qtyWidth)} ${'-'.repeat(itemWidth)}`;

  const blocks = [];
  let bodyLines = [];

  const wrapBlock = (lines) => `\`\`\`\n${[header1, header2, ...lines].join('\n')}\n\`\`\``;

  for (const row of tableRows) {
    const line = `${pad(safeCell(row.qty, qtyWidth), qtyWidth)} ${safeCell(row.item, itemWidth)}`;
    const candidate = wrapBlock([...bodyLines, line]);

    if (candidate.length > maxLength && bodyLines.length > 0) {
      blocks.push(wrapBlock(bodyLines));
      bodyLines = [line];
    } else {
      bodyLines.push(line);
    }
  }

  if (bodyLines.length > 0) {
    blocks.push(wrapBlock(bodyLines));
  }

  return blocks.length ? blocks : ['```Qty  Item\n---- ------------------------------\n-    ไม่มีข้อมูล```'];
}

function buildRequirementDetailLines(tableRows = []) {
  const lines = [];

  for (const row of tableRows) {
    if (!row.detail) continue;
    lines.push(`• ${row.item} — ${row.detail}`);
  }

  return lines;
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

  const { tableRows, noteLines } = buildRequirementRows(requirements);
  const requirementTableChunks = chunkRequirementTable(tableRows);
  const requirementDetailLines = buildRequirementDetailLines(tableRows);
  const requirementDetailChunks = chunkLinesCompact(requirementDetailLines, 1024);
  const noteChunks = chunkLinesCompact(noteLines, 1024);

  const rewardLines = rewards.map(formatReward).filter(Boolean);
  const rewardChunks = chunkLinesCompact(rewardLines, 1024);

  const embed = new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setTitle(`${quest.icon_emoji || (quest.is_repeatable ? '♻️' : '📜')} ${quest.quest_name}`)
    .setDescription(truncate(quest.quest_description || quest.panel_description || 'เควสนี้ไม่มีคำอธิบาย'))
    .addFields({
      name: '📌 ข้อมูลเควส',
      value: truncate(buildQuestInfoBlock({ professionCode, quest })),
      inline: false
    });

  noteChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '✅ เงื่อนไข' : '✅ เงื่อนไข (ต่อ)',
      value: truncate(chunk),
      inline: false
    });
  });

  requirementTableChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '📦 สิ่งที่ต้องส่ง' : '📦 สิ่งที่ต้องส่ง (ต่อ)',
      value: chunk,
      inline: false
    });
  });

  if (requirementDetailLines.length > 0) {
    requirementDetailChunks.forEach((chunk, index) => {
      embed.addFields({
        name: index === 0 ? '📝 รายละเอียดไอเทม' : '📝 รายละเอียดไอเทม (ต่อ)',
        value: truncate(chunk),
        inline: false
      });
    });
  }

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
