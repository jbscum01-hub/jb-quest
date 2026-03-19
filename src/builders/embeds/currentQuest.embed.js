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

function chunkPlainLines(lines, maxLength = 1024) {
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

function padRight(value, width) {
  const text = String(value || '');
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
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

function buildQuestHeader({ questName, profession, level }) {
  const left = '┌';
  const right = '┐';
  const bottomLeft = '└';
  const bottomRight = '┘';
  const line = '─';

  const title = `🧩 QUEST : ${questName || '-'}`;
  const sub = `สาย : ${profession || '-'} | ระดับ : ${level ? `Lv.${level}` : '-'}`;

  const width = Math.max(title.length, sub.length) + 8;

  const topLine =
    left +
    line.repeat(Math.floor((width - title.length) / 2)) +
    title +
    line.repeat(Math.ceil((width - title.length) / 2)) +
    right;

  const middleLine =
    `│ ${sub}${' '.repeat(Math.max(0, width - sub.length - 1))}│`;

  const bottomLine =
    bottomLeft +
    line.repeat(width) +
    bottomRight;

  return ['```', topLine, middleLine, bottomLine, '```'].join('\n');
}

function splitRequirementRows(requirements = []) {
  const conditionLines = [];
  const itemRows = [];

  for (const row of requirements) {
    if (row.requirement_type === 'INGAME_NAME') {
      conditionLines.push('  ┆ - ระบุชื่อตัวละคร');
      continue;
    }

    if (row.requirement_type === 'IMAGE') {
      conditionLines.push('  ┆ - ส่งภาพหลักฐาน');
      continue;
    }

    if (row.requirement_type === 'CUSTOM_TEXT') {
      conditionLines.push(
        `  ┆ - ${cleanText(
          row.display_text ||
          row.input_label ||
          row.admin_display_text ||
          'เงื่อนไขเพิ่มเติม'
        )}`
      );
      continue;
    }

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

    itemRows.push({
      qty,
      item: text || '-'
    });
  }

  return { conditionLines, itemRows };
}

function buildRequirementTableLines(itemRows = []) {
  const lines = [
    '  จำนวน   ไอเทม',
    '  ──────   ─────────────────────────────────────────'
  ];

  if (!itemRows.length) {
    lines.push('  -        ไม่มีข้อมูล');
    return lines;
  }

  for (const row of itemRows) {
    const qty = padRight(row.qty || '-', 8);
    lines.push(`  ${qty}${row.item}`);
  }

  return lines;
}

function chunkRequirementTableLines(lines = [], maxLength = 1024) {
  if (!lines.length) return ['-'];

  const header = lines.slice(0, 2);
  const body = lines.slice(2);

  if (!body.length) {
    return [lines.join('\n')];
  }

  const chunks = [];
  let currentBody = [];

  const wrap = (bodyLines) => [...header, ...bodyLines].join('\n');

  for (const line of body) {
    const candidate = wrap([...currentBody, line]);

    if (candidate.length > maxLength && currentBody.length > 0) {
      chunks.push(wrap(currentBody));
      currentBody = [line];
    } else {
      currentBody.push(line);
    }
  }

  if (currentBody.length > 0) {
    chunks.push(wrap(currentBody));
  }

  return chunks.length ? chunks : [lines.join('\n')];
}

function formatReward(row) {
  if (row.reward_display_text) {
    return `  ┆ • ${cleanText(row.reward_display_text)}`;
  }

  if (row.reward_item_name && row.reward_quantity) {
    return `  ┆ • ${row.reward_item_name} x ${row.reward_quantity}`;
  }

  if (row.reward_item_name) {
    return `  ┆ • ${row.reward_item_name}`;
  }

  if (row.reward_type === 'SCUM_MONEY' && row.reward_value_number) {
    return `  ┆ • เงิน ${Number(row.reward_value_number).toLocaleString('en-US')}`;
  }

  if (row.reward_type === 'FAME_POINT' && row.reward_value_number) {
    return `  ┆ • FP ${Number(row.reward_value_number).toLocaleString('en-US')}`;
  }

  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_name) {
    return `  ┆ • Role: ${row.discord_role_name}`;
  }

  return `  ┆ • ${cleanText(row.reward_type || 'รางวัล')}`;
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
      .setTitle(`ไม่พบเควสของสาย ${professionCode}`)
      .setDescription('กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล');
  }

  const headerBlock = buildQuestHeader({
    questName: quest.quest_name,
    profession: quest.profession_code || professionCode,
    level: quest.quest_level
  });

  const { conditionLines, itemRows } = splitRequirementRows(requirements);
  const conditionChunks = chunkPlainLines(conditionLines, 1024);
  const requirementTableLines = buildRequirementTableLines(itemRows);
  const requirementChunks = chunkRequirementTableLines(requirementTableLines, 1024);

  const rewardLines = rewards.map(formatReward).filter(Boolean);
  const rewardChunks = chunkPlainLines(rewardLines, 1024);

  const embed = new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setDescription(headerBlock)
    .addFields({
      name: '📍 ข้อมูลเควส',
      value: [
        `  ┆ - ประเภท : ${getQuestTypeText(quest)}`,
        `  ┆ - Fame ขั้นต่ำ : ${getFameDisplayText(quest)}`
      ].join('\n'),
      inline: false
    });

  if (conditionLines.length > 0) {
    conditionChunks.forEach((chunk, index) => {
      embed.addFields({
        name: index === 0 ? '🔻 เงื่อนไขการส่งเควส:' : '🔻 เงื่อนไขการส่งเควส (ต่อ):',
        value: truncate(chunk),
        inline: false
      });
    });
  }

  requirementChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '📦 สิ่งที่ต้องส่ง:' : '📦 สิ่งที่ต้องส่ง (ต่อ):',
      value: truncate(chunk),
      inline: false
    });
  });

  rewardChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '🎁 รางวัล:' : '🎁 รางวัล (ต่อ):',
      value: truncate(chunk),
      inline: false
    });
  });

  return embed
    .setFooter({ text: quest.fame_note || 'SCUM Quest System' })
    .setTimestamp();
}

function buildCurrentQuestImageEmbeds(guideMedia = [], title = 'รูปตัวอย่างเควส', limit = 8, quest = null) {
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
      embed.setDescription(row.media_title || row.media_description);
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
