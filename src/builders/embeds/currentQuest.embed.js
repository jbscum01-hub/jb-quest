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

  let qty = '';
  const matchQty = text.match(/\bx\s*(\d+)\b/i);

  if (matchQty) {
    qty = matchQty[1];
    text = text.replace(matchQty[0], '').trim();
  } else if (row.required_quantity) {
    qty = String(row.required_quantity);
  }

  let desc = '';
  const matchDesc = text.match(/\(([^()]+)\)/);

  if (matchDesc) {
    desc = cleanText(matchDesc[1]);
    text = text.replace(matchDesc[0], '').trim();
  }

  text = cleanText(text);

  let line = qty ? `• x${qty} ${text}` : `• ${text}`;

  if (desc) {
    line += ` (${desc})`;
  }

  return line;
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
      .setTitle(`ไม่พบเควสของสาย ${professionCode}`)
      .setDescription('กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล');
  }

  const requirementLines = requirements.map(formatRequirement).filter(Boolean);
  const rewardLines = rewards.map(formatReward).filter(Boolean);

  const requirementChunks = chunkLines(requirementLines);
  const rewardChunks = chunkLines(rewardLines);

  const embed = new EmbedBuilder()
    .setColor(getQuestColor(quest))
    .setTitle(`${quest.icon_emoji || '📜'} ${quest.quest_name}`)
    .setDescription(truncate(quest.quest_description || quest.panel_description || '-'))
    .addFields({
      name: '📌 ข้อมูลเควส',
      value: [
        `- สายอาชีพ: ${quest.profession_code || professionCode || '-'}`,
        `- ระดับ: ${quest.quest_level ? `Lv.${quest.quest_level}` : '-'}`,
        `- ประเภท: ${getQuestTypeText(quest)}`,
        `- Fame ขั้นต่ำ: ${getFameDisplayText(quest)}`
      ].join('\n'),
      inline: false
    });

  requirementChunks.forEach((chunk, i) => {
    embed.addFields({
      name: i === 0 ? '📦 สิ่งที่ต้องส่ง' : '📦 สิ่งที่ต้องส่ง (ต่อ)',
      value: truncate(chunk),
      inline: false
    });
  });

  rewardChunks.forEach((chunk, i) => {
    embed.addFields({
      name: i === 0 ? '🎁 รางวัล' : '🎁 รางวัล (ต่อ)',
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
