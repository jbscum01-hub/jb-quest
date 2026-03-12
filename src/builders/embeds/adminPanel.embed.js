const { EmbedBuilder } = require('discord.js');

function withBase(embed) {
  return embed.setColor(0x2b2d31).setFooter({ text: 'SCUM Quest Admin' }).setTimestamp();
}

function buildAdminHomeEmbed() {
  return withBase(
    new EmbedBuilder()
      .setTitle('⚙️ หน้าหลักแอดมินเควส')
      .setDescription([
        'ใช้หน้านี้เป็นศูนย์กลางสำหรับดูแลระบบเควส',
        '',
        'ปุ่มที่มีตอนนี้',
        '• จัดการพาเนล — ส่ง / รีเฟรช / เช็กสถานะพาเนลผู้เล่น',
        '• จัดการข้อมูลเควส — เลือกเควสก่อน แล้วค่อยดูรายละเอียดของเควสนั้น',
        '',
        'หมายเหตุ: เวอร์ชันนี้เน้นให้แอดมินไม่หลง โดยบังคับให้เลือกเควสก่อนเสมอ'
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
        'วิธีใช้ปุ่ม',
        '• ส่งพาเนลผู้เล่นใหม่ — สร้างหรืออัปเดตพาเนลตาม config ปัจจุบัน',
        '• รีเฟรชพาเนลผู้เล่น — แก้ข้อความ/ปุ่มของพาเนลเดิมโดยไม่ส่งใหม่ซ้ำ',
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
        'วิธีเข้าใช้งาน',
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

function buildQuestDetailEmbed(quest, counts = {}) {
  const lines = [
    `สาย: ${quest.profession_name_th || quest.profession_code || '-'}`,
    `เลเวล: ${quest.quest_level ?? '-'}`,
    `โค้ดเควส: ${quest.quest_code || '-'}`,
    `สถานะ: ${quest.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}`,
    `ประเภท: ${quest.is_repeatable ? 'เควสซ้ำได้' : 'เควสหลัก'}`,
    `Step Quest: ${quest.is_step_quest ? 'ใช่' : 'ไม่ใช่'}`,
    `ต้องใช้ Ticket: ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
    '',
    `คำอธิบาย: ${quest.quest_description || quest.panel_description || '-'}`,
    '',
    `ของที่ต้องส่ง: ${counts.requirementCount || 0}`,
    `รางวัล: ${counts.rewardCount || 0}`,
    `Dependency: ${counts.dependencyCount || 0}`,
    `รูปตัวอย่าง: ${counts.imageCount || 0}`
  ];

  return withBase(
    new EmbedBuilder()
      .setTitle(`🧾 ${quest.quest_name || 'ไม่ทราบชื่อเควส'}`)
      .setDescription(lines.join('\n'))
  );
}

function buildRequirementsEmbed(quest, requirements) {
  const description = requirements.length
    ? requirements.map((row, index) => {
        const label = row.item_name || row.input_label || row.requirement_type;
        const qty = row.required_quantity ? ` x${row.required_quantity}` : '';
        const text = row.display_text || row.admin_display_text || '-';
        return `${index + 1}. ${label}${qty}\n   ${text}`;
      }).join('\n\n')
    : 'ยังไม่มีข้อมูลของที่ต้องส่ง';

  return withBase(
    new EmbedBuilder()
      .setTitle(`📦 ของที่ต้องส่ง • ${quest.quest_name}`)
      .setDescription(description)
  );
}

function buildRewardsEmbed(quest, rewards) {
  const description = rewards.length
    ? rewards.map((row, index) => {
        const label = row.reward_item_name || row.discord_role_name || row.reward_type;
        const qty = row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` = ${row.reward_value_number}` : '';
        const text = row.reward_display_text || row.reward_value_text || '-';
        return `${index + 1}. ${label}${qty}\n   ${text}`;
      }).join('\n\n')
    : 'ยังไม่มีข้อมูลรางวัล';

  return withBase(
    new EmbedBuilder()
      .setTitle(`🎁 รางวัล • ${quest.quest_name}`)
      .setDescription(description)
  );
}

function buildDependenciesEmbed(quest, dependencies) {
  const description = dependencies.length
    ? dependencies.map((row, index) => {
        const reqName = row.required_quest_name || row.required_quest_code || row.required_level || row.required_role_id || '-';
        return `${index + 1}. ${row.dependency_type} → ${reqName}`;
      }).join('\n')
    : 'ยังไม่มี dependency ของเควสนี้';

  return withBase(
    new EmbedBuilder()
      .setTitle(`🔓 เงื่อนไขปลดล็อก • ${quest.quest_name}`)
      .setDescription(description)
  );
}

function buildImagesEmbed(quest, images) {
  const description = images.length
    ? images.map((row, index) => `${index + 1}. ${row.media_title || 'รูปตัวอย่าง'}\n   ${row.media_url}`).join('\n\n')
    : 'ยังไม่มีรูปตัวอย่างของเควสนี้';

  return withBase(
    new EmbedBuilder()
      .setTitle(`🖼️ รูปตัวอย่าง • ${quest.quest_name}`)
      .setDescription(description)
      .setImage(images[0]?.media_url || null)
  );
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
        'เวอร์ชันนี้ทำหน้าแอดมินใหม่ให้ทางเดินนิ่งก่อน',
        'เมนูแก้ไขจริง เช่น แก้คำอธิบาย / ของที่ต้องส่ง / รางวัล / รูปตัวอย่าง จะต่อในรอบถัดไป',
        '',
        'ตอนนี้ใช้หน้านี้เพื่อยืนยันว่าแอดมินกำลังอยู่ที่เควสไหน'
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
  buildRequirementsEmbed,
  buildRewardsEmbed,
  buildDependenciesEmbed,
  buildImagesEmbed,
  buildPanelStatusEmbed,
  buildSearchResultEmbed,
  buildPlaceholderEditEmbed
};
