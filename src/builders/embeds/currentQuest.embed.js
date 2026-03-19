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

function stripOuterParens(value) {
  const text = cleanText(value);
  if (!text.startsWith('(') || !text.endsWith(')')) return text;
  return text.slice(1, -1).trim();
}

function extractQuantity(rawText, fallbackQuantity) {
  const text = cleanText(rawText);
  const fallback =
    Number.isFinite(Number(fallbackQuantity)) && Number(fallbackQuantity) > 0
      ? Number(fallbackQuantity)
      : null;

  const patterns = [
    /\bx\s*(\d+)\s*$/i,
    /×\s*(\d+)\s*$/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        quantity: Number(match[1]),
        textWithoutQuantity: cleanText(text.replace(match[0], ''))
      };
    }
  }

  return {
    quantity: fallback,
    textWithoutQuantity: text
  };
}

function splitRequirementText(rawText) {
  let text = cleanText(rawText);
  if (!text) {
    return {
      main: '',
      details: []
    };
  }

  const details = [];

  const parenMatches = [...text.matchAll(/\(([^()]+)\)/g)];
  if (parenMatches.length) {
    for (const match of parenMatches) {
      const inside = stripOuterParens(match[0]);
      if (inside) details.push(inside);
    }
    text = cleanText(text.replace(/\(([^()]+)\)/g, ' '));
  }

  const tailPatterns = [
    /\bStack\s*เต็ม\b.*$/i,
    /\bไม่ต้องอัปเต็ม\b.*$/i,
    /\bสีใดก็ได้\b.*$/i,
    /\bน้ำหนัก\s*.+$/i,
    /\bเหลือเกิน\s*.+$/i,
    /\bมากกว่า\s*.+$/i,
    /\bขึ้นไป\b.*$/i
  ];

  for (const pattern of tailPatterns) {
    const match = text.match(pattern);
    if (match) {
      const tail = cleanText(match[0]).replace(/^เหลือเกิน\s*/i, '≥');
      if (tail) details.push(tail);
      text = cleanText(text.replace(match[0], ' '));
      break;
    }
  }

  text = cleanText(text.replace(/\s+-\s+/g, ' '));

  const uniqueDetails = [];
  for (const detail of details) {
    const normalized = cleanText(detail);
    if (!normalized) continue;
    if (!uniqueDetails.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      uniqueDetails.push(normalized);
    }
  }

  return {
    main: text,
    details: uniqueDetails
  };
}

function formatRequirementItemRow(row) {
  const baseText =
    row.display_text ||
    row.item_name ||
    row.input_label ||
    row.admin_display_text ||
    '';

  const { quantity, textWithoutQuantity } = extractQuantity(baseText, row.required_quantity);
  const { main, details } = splitRequirementText(textWithoutQuantity);

  const title = quantity
    ? `• x${quantity} ${main || row.item_name || row.input_label || 'รายการ'}`
    : `• ${main || row.item_name || row.input_label || 'รายการ'}`;
  const extraLines = details.map((detail) => `  └ ${detail}`);

  return [title, ...extraLines].join('\n');
}

function formatRequirement(row) {
  if (row.requirement_type === 'IMAGE') return '• แนบรูปหลักฐาน';
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  if (row.requirement_type === 'CUSTOM_TEXT') {
    return `• ${cleanText(row.display_text || row.input_label || row.admin_display_text || 'เงื่อนไขเพิ่มเติม')}`;
  }

  if (row.item_name || row.display_text || row.input_label) {
    return formatRequirementItemRow(row);
  }

  return `• ${cleanText(row.requirement_type || 'เงื่อนไข')}`;
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

function chunkLines(lines, maxLength = 1024) {
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

  const requirementLines = requirements.map(formatRequirement);
  const rewardLines = rewards.map(formatReward);

  const requirementChunks = chunkLines(requirementLines);
  const rewardChunks = chunkLines(rewardLines);

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
