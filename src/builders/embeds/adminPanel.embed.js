const { EmbedBuilder } = require('discord.js');

const EMBED_COLOR = 0x2b2d31;
const FIELD_LIMIT = 1024;
const DESC_LIMIT = 4096;

function withBase(embed) {
  return embed
    .setColor(EMBED_COLOR)
    .setFooter({ text: 'SCUM Quest Admin' })
    .setTimestamp();
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function yesNo(value) {
  return value ? 'ใช่' : 'ไม่ใช่';
}

function cut(text, max = FIELD_LIMIT) {
  const value = safeText(text, '-');
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function joinLines(lines) {
  return lines.filter(Boolean).join('\n');
}

function chunkText(text, max = FIELD_LIMIT) {
  const raw = safeText(text, '-');
  if (raw.length <= max) return [raw];

  const lines = raw.split('\n');
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length <= max) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    if (line.length <= max) {
      current = line;
      continue;
    }

    let start = 0;
    while (start < line.length) {
      chunks.push(line.slice(start, start + max));
      start += max;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function addChunkedField(embed, name, text, inline = false) {
  const chunks = chunkText(text, FIELD_LIMIT);
  chunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? name : `${name} (ต่อ)`,
      value: cut(chunk, FIELD_LIMIT),
      inline
    });
  });
  return embed;
}

function formatRequirement(row, index) {
  const lines = [
    `[${index + 1}] ${safeText(row.requirement_type)}`,
    `ชื่อ: ${safeText(row.item_name || row.input_label || row.item_code)}`,
    row.required_quantity ? `จำนวน: ${row.required_quantity}` : null,
    `ข้อความผู้เล่น: ${safeText(row.display_text)}`,
    row.admin_display_text ? `ข้อความแอดมิน: ${safeText(row.admin_display_text)}` : null,
    row.item_code ? `Item Code: ${row.item_code}` : null,
    row.item_spawn_name ? `Spawn Name: ${row.item_spawn_name}` : null
  ];

  if (row.item_spawn_command_template) {
    lines.push(`คำสั่งเสก: ${row.item_spawn_command_template}`);
  } else if (row.item_spawn_name && row.required_quantity) {
    lines.push(`คำสั่งเสกแนะนำ: #spawnitem ${row.item_spawn_name} ${row.required_quantity}`);
  }

  return joinLines(lines);
}

function formatReward(row, index) {
  const amountText = row.reward_quantity
    ? `จำนวน: ${row.reward_quantity}`
    : row.reward_value_number !== null && row.reward_value_number !== undefined
      ? `ค่า: ${row.reward_value_number}`
      : null;

  const lines = [
    `[${index + 1}] ${safeText(row.reward_type)}`,
    `ชื่อ: ${safeText(row.reward_item_name || row.discord_role_name || row.reward_value_text || row.reward_type)}`,
    amountText,
    `ข้อความแสดง: ${safeText(row.reward_display_text || row.reward_value_text)}`,
    row.reward_item_code ? `Item Code: ${row.reward_item_code}` : null,
    row.reward_item_spawn_name ? `Spawn Name: ${row.reward_item_spawn_name}` : null,
    row.discord_role_id ? `Role ID: ${row.discord_role_id}` : null,
    row.discord_role_name ? `Role Name: ${row.discord_role_name}` : null
  ];

  if (row.reward_spawn_command_template) {
    lines.push(`คำสั่งเสก: ${row.reward_spawn_command_template}`);
  } else if (row.reward_item_spawn_name && row.reward_quantity) {
    lines.push(`คำสั่งเสกแนะนำ: #spawnitem ${row.reward_item_spawn_name} ${row.reward_quantity}`);
  }

  return joinLines(lines);
}

function formatDependency(row, index) {
  return joinLines([
    `[${index + 1}] ${safeText(row.dependency_type)}`,
    row.required_quest_code || row.required_quest_name
      ? `เควสที่ต้องผ่าน: ${safeText(row.required_quest_code || row.required_quest_name)}`
      : null,
    row.required_level ? `เลเวลหลักที่ต้องถึง: ${row.required_level}` : null,
    row.required_role_id ? `Role ID: ${row.required_role_id}` : null,
    row.required_role_name ? `Role Name: ${row.required_role_name}` : null,
    `เงื่อนไข: ${safeText(row.condition_operator || 'AND')}`
  ]);
}

function formatImage(row, index) {
  return joinLines([
    `[${index + 1}] ${safeText(row.media_title || 'รูปตัวอย่าง')}`,
    row.media_description ? `คำอธิบาย: ${safeText(row.media_description)}` : null,
    `ลิงก์: ${safeText(row.media_url)}`,
    `ประเภท: ${safeText(row.media_type)}`,
    `ลำดับ: ${row.display_order ?? 0}`
  ]);
}

function formatStep(row, index) {
  return joinLines([
    `[${index + 1}] Step ${row.step_no} • ${safeText(row.step_title)}`,
    `รายละเอียด: ${safeText(row.step_description)}`,
    `ต้องกรอกข้อความ: ${yesNo(row.requires_text_input)}`,
    `ต้องแนบรูป: ${yesNo(row.requires_attachment)}`,
    `ต้องอนุมัติ: ${yesNo(row.requires_admin_approval)}`,
    row.success_message ? `ข้อความเมื่อผ่าน: ${safeText(row.success_message)}` : null,
    row.failure_message ? `ข้อความเมื่อไม่ผ่าน: ${safeText(row.failure_message)}` : null
  ]);
}

function formatQuestSummary(quest) {
  const questType = quest.is_repeatable ? 'เควสซ้ำได้' : 'เควสหลัก';

  return joinLines([
    `สาย: ${safeText(quest.profession_name_th || quest.profession_code)}`,
    `เลเวล: ${safeText(quest.quest_level)}`,
    `โค้ดเควส: ${safeText(quest.quest_code)}`,
    `สถานะ: ${quest.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}`,
    `ประเภท: ${questType}`,
    `หมวด: ${safeText(quest.category_name)}`,
    `Step Quest: ${yesNo(quest.is_step_quest)}`,
    `ต้องใช้ Ticket: ${yesNo(quest.requires_ticket)}`,
    `อนุมัติโดยแอดมิน: ${yesNo(quest.requires_admin_approval)}`,
    `รูปแบบปลดล็อก: ${safeText(quest.unlock_mode || 'NONE')}`,
    `เลเวลปลดล็อกหลัก: ${quest.unlock_main_level ?? '-'}`,
    `ลำดับแสดงผล: ${quest.display_order ?? 0}`
  ]);
}

function formatQuestDescriptionBlock(quest) {
  return joinLines([
    `คำอธิบายเควส: ${safeText(quest.quest_description)}`,
    `Panel Title: ${safeText(quest.panel_title)}`,
    `Panel Description: ${safeText(quest.panel_description)}`,
    `ข้อความปุ่ม: ${safeText(quest.button_label)}`,
    quest.admin_note ? `หมายเหตุแอดมิน: ${safeText(quest.admin_note)}` : null
  ]);
}

function buildAdminHomeEmbed() {
  return withBase(
    new EmbedBuilder()
      .setTitle('⚙️ หน้าหลักแอดมินเควส')
      .setDescription([
        'ใช้หน้านี้เป็นศูนย์กลางสำหรับดูแลระบบเควส',
        '',
        '• จัดการพาเนล — ส่ง / รีเฟรช / เช็กสถานะพาเนลผู้เล่น',
        '• จัดการข้อมูลเควส — เลือกเควสก่อน แล้วค่อยดูรายละเอียดหรือแก้ไข',
        '',
        'หน้า Quest Detail จะแสดงข้อมูลสำคัญทั้งหมดในหน้าเดียว เพื่อลดการกดหลายรอบ'
      ].join('\n'))
  );
}

function buildPanelManagementEmbed() {
  return withBase(
    new EmbedBuilder()
      .setTitle('🧩 จัดการพาเนล')
      .setDescription([
        'ใช้สำหรับจัดการพาเนลฝั่งผู้เล่น',
        '',
        '• ส่งพาเนลผู้เล่นใหม่ — สร้างหรืออัปเดตตาม config ปัจจุบัน',
        '• รีเฟรชพาเนลผู้เล่น — แก้ข้อความ/ปุ่มของพาเนลเดิม',
        '• เช็กสถานะพาเนล — ดูว่าแต่ละสายตั้ง channel / message ไว้หรือยัง'
      ].join('\n'))
  );
}

function buildMasterHomeEmbed() {
  return withBase(
    new EmbedBuilder()
      .setTitle('📘 จัดการข้อมูลเควส')
      .setDescription([
        'หลักการของหน้านี้คือ “เลือกเควสก่อน แล้วค่อยดูหรือแก้”',
        '',
        '• เลือกเควสตามสาย — ไล่จาก สาย > เลเวล > เควส',
        '• ค้นหาเควส — ค้นด้วยชื่อเควสหรือ quest code',
        '',
        'เมื่อเลือกเควสแล้ว จะเข้าไปยังหน้า Quest Detail ของเควสนั้นทันที'
      ].join('\n'))
  );
}

function buildBrowseProfessionEmbed() {
  return withBase(
    new EmbedBuilder()
      .setTitle('🗂️ เลือกสายอาชีพ')
      .setDescription('เลือกสายอาชีพก่อน เพื่อไปยังรายการเลเวลและเควสของสายนั้น')
  );
}

function buildBrowseLevelEmbed(profession) {
  return withBase(
    new EmbedBuilder()
      .setTitle(`🗂️ เลือกเลเวล • ${profession.profession_name_th || profession.profession_code}`)
      .setDescription('เลือกเลเวลที่ต้องการดูรายการเควส')
  );
}

function buildBrowseQuestEmbed(profession, level, quests) {
  return withBase(
    new EmbedBuilder()
      .setTitle(`📋 เลือกเควส • ${profession.profession_name_th || profession.profession_code} • Lv.${level}`)
      .setDescription([
        'เลือกเควสจากรายการด้านล่าง',
        `จำนวนเควสที่พบ: ${quests.length}`
      ].join('\n'))
  );
}

function buildQuestDetailEmbed(quest, payload = {}) {
  const requirements = Array.isArray(payload.requirements) ? payload.requirements : [];
  const rewards = Array.isArray(payload.rewards) ? payload.rewards : [];
  const dependencies = Array.isArray(payload.dependencies) ? payload.dependencies : [];
  const images = Array.isArray(payload.images) ? payload.images : [];
  const steps = Array.isArray(payload.steps) ? payload.steps : [];

  const embed = withBase(
    new EmbedBuilder()
      .setTitle(`🧾 ${safeText(quest.quest_name, 'ไม่ทราบชื่อเควส')}`)
      .setDescription(cut(formatQuestSummary(quest), DESC_LIMIT))
  );

  addChunkedField(embed, '📝 รายละเอียดเควส', formatQuestDescriptionBlock(quest), false);

  const requirementText = requirements.length
    ? requirements.map(formatRequirement).join('\n\n')
    : 'ยังไม่มีข้อมูลของที่ต้องส่ง';
  addChunkedField(embed, `📦 ของที่ต้องส่ง (${requirements.length})`, requirementText, false);

  const rewardText = rewards.length
    ? rewards.map(formatReward).join('\n\n')
    : 'ยังไม่มีข้อมูลรางวัล';
  addChunkedField(embed, `🎁 รางวัล (${rewards.length})`, rewardText, false);

  const dependencyText = dependencies.length
    ? dependencies.map(formatDependency).join('\n\n')
    : 'ยังไม่มี dependency ของเควสนี้';
  addChunkedField(embed, `🔓 เงื่อนไขปลดล็อก (${dependencies.length})`, dependencyText, false);

  if (steps.length) {
    const stepText = steps.map(formatStep).join('\n\n');
    addChunkedField(embed, `🪜 Steps (${steps.length})`, stepText, false);
  }

  const imageText = images.length
    ? images.map(formatImage).join('\n\n')
    : 'ยังไม่มีรูปตัวอย่างของเควสนี้';
  addChunkedField(embed, `🖼️ รูปตัวอย่าง (${images.length})`, imageText, false);

  if (images[0]?.media_url) {
    embed.setImage(images[0].media_url);
  }

  return embed;
}

function buildPanelStatusEmbed(rows) {
  const description = rows.length
    ? rows.map((row, index) => {
        const channelText = row.panel_channel_id ? `ช่อง: ${row.panel_channel_id}` : 'ช่อง: ยังไม่ได้ตั้ง';
        const messageText = row.panel_message_id ? `ข้อความ: ${row.panel_message_id}` : 'ข้อความ: ยังไม่ได้ตั้ง';
        return `${index + 1}. ${row.profession_code}\n   ${channelText}\n   ${messageText}`;
      }).join('\n\n')
    : 'ยังไม่พบข้อมูลสถานะพาเนล';

  return withBase(
    new EmbedBuilder()
      .setTitle('📡 สถานะพาเนลผู้เล่น')
      .setDescription(description)
  );
}

function buildSearchResultEmbed(query, rows) {
  const description = rows.length
    ? rows.map((row, index) => `${index + 1}. ${row.quest_name}\n   ${row.quest_code} • ${row.profession_name_th || row.profession_code} • Lv.${row.quest_level}`).join('\n\n')
    : 'ไม่พบเควสที่ตรงกับคำค้น';

  return withBase(
    new EmbedBuilder()
      .setTitle(`🔎 ผลการค้นหาเควส: ${query}`)
      .setDescription(description)
  );
}

function buildPlaceholderEditEmbed(quest) {
  return withBase(
    new EmbedBuilder()
      .setTitle(`🛠️ เมนูแก้ไข • ${quest.quest_name}`)
      .setDescription([
        'หน้านี้ใช้สำหรับจัดการการแก้ไขเควส',
        'ตอนนี้หน้า Quest Detail แสดงข้อมูลครบในหน้าเดียวแล้ว',
        '',
        'ปุ่มที่ควรเหลือในรอบถัดไปคือ',
        '• แก้คำอธิบาย',
        '• แก้ของที่ต้องส่ง',
        '• แก้รางวัล',
        '• แก้ Dependency',
        '• เพิ่มของที่ต้องส่ง',
        '• เพิ่มรางวัล',
        '• เพิ่มรูปตัวอย่าง',
        '• เปิด/ปิดเควส'
      ].join('\n'))
  );
}

module.exports = {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseProfessionEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestEmbed,
  buildQuestDetailEmbed,
  buildPanelStatusEmbed,
  buildSearchResultEmbed,
  buildPlaceholderEditEmbed
};
