const { EmbedBuilder } = require('discord.js');

function baseEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'SCUM Quest Admin' })
    .setTimestamp();
}

function buildAdminHomeEmbed() {
  return baseEmbed(
    '🛠️ หน้าหลักแอดมินเควส',
    [
      'ศูนย์ควบคุมระบบ Quest Bot',
      '',
      '**เมนูที่มีในหน้านี้**',
      '• จัดการพาเนล — ส่ง/รีเฟรช/ตรวจสถานะพาเนลผู้เล่น',
      '• จัดการข้อมูลเควส — เลือกเควสแล้วดูหรือแก้ข้อมูลของเควสนั้น',
      '',
      'แนะนำ: ถ้าจะแก้ข้อมูล ให้เข้า `จัดการข้อมูลเควส` แล้วเลือกเควสก่อนทุกครั้ง'
    ].join('\n')
  );
}

function buildPanelManagementEmbed() {
  return baseEmbed(
    '🧩 จัดการพาเนล',
    [
      'เมนูนี้ใช้สำหรับจัดการพาเนลฝั่งผู้เล่น',
      '',
      '• ส่งพาเนลผู้เล่นใหม่ — สร้างหรือแทนที่พาเนลตาม config ปัจจุบัน',
      '• รีเฟรชพาเนลผู้เล่น — อัปเดตข้อความและปุ่มของพาเนลเดิม',
      '• ซ่อมพาเนลที่หาย — ใช้เมื่อบางสายโดนลบข้อความ',
      '• รีเฟรชหน้าดูเควสปัจจุบัน — ใช้หลังแก้ logic หรือแก้ master',
      '• สถานะพาเนล — ใช้ตรวจสอบ config และสถานะการตั้งค่า'
    ].join('\n')
  );
}

function buildMasterHomeEmbed() {
  return baseEmbed(
    '📚 จัดการข้อมูลเควส',
    [
      'หลักการของหน้านี้คือ **เลือกเควสก่อน แล้วค่อยแก้**',
      '',
      '• เลือกเควสเพื่อจัดการ — ไล่ตามสายอาชีพและเลเวล',
      '• ค้นหาเควส — เหมาะเวลารู้ชื่อหรือโค้ดอยู่แล้ว',
      '• สร้างเควสใหม่ — ปุ่มเตรียมไว้สำหรับ phase ถัดไป'
    ].join('\n')
  );
}

function buildProfessionPickerEmbed(professions) {
  return baseEmbed(
    '🧭 เลือกสายอาชีพ',
    [
      `พบสายอาชีพที่เปิดใช้งาน ${professions.length} สาย`,
      '',
      'เลือกสายที่ต้องการ แล้วระบบจะพาไปเลือกเลเวล'
    ].join('\n')
  );
}

function buildLevelPickerEmbed(profession, levels) {
  return baseEmbed(
    `🎚️ เลือกเลเวลของสาย ${profession.profession_name_th || profession.profession_code}`,
    [
      `สาย: ${profession.profession_code}`,
      `มีเลเวลที่พบในระบบ: ${levels.join(', ') || '-'}`,
      '',
      'เลือกเลเวลเพื่อดูรายการเควส'
    ].join('\n')
  );
}

function buildQuestPickerEmbed(profession, level, quests) {
  return baseEmbed(
    `📜 เลือกเควส • ${profession.profession_name_th || profession.profession_code} • Lv${level}`,
    [
      `พบเควสทั้งหมด ${quests.length} รายการ`,
      '',
      'เลือกเควสที่ต้องการจัดการ แล้วระบบจะพาไปหน้า Quest Detail'
    ].join('\n')
  );
}

function buildQuestDetailEmbed(payload) {
  const { quest, requirements = [], rewards = [], dependencies = [], images = [] } = payload;

  return baseEmbed(
    `🗂️ ${quest.quest_code || 'ไม่มีโค้ด'} • ${quest.quest_name || 'ไม่มีชื่อเควส'}`,
    [
      `**สายอาชีพ:** ${quest.profession_name_th || quest.profession_code || '-'}`,
      `**เลเวล:** ${quest.quest_level ?? '-'}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${quest.is_repeatable ? 'เควสซ้ำ' : 'เควสหลัก'}${quest.is_step_quest ? ' • Step Quest' : ''}${quest.requires_ticket ? ' • ใช้ Ticket' : ''}`,
      '',
      `**ชื่อพาเนล:** ${quest.panel_title || '-'}`,
      `**ปุ่ม:** ${quest.button_label || '-'}`,
      `**คำอธิบาย:** ${quest.quest_description || quest.panel_description || '-'}`,
      `**โน้ตแอดมิน:** ${quest.admin_note || '-'}`,
      '',
      `**ของที่ต้องส่ง:** ${requirements.length} รายการ`,
      `**รางวัล:** ${rewards.length} รายการ`,
      `**Dependency:** ${dependencies.length} รายการ`,
      `**รูปตัวอย่าง:** ${images.length} รูป`,
      '',
      'ใช้ปุ่มด้านล่างเพื่อดูหรือแก้ข้อมูลของเควสนี้'
    ].join('\n')
  );
}

function buildQuestRequirementsEmbed(quest, requirements) {
  const lines = requirements.length
    ? requirements.map((r, i) => `${i + 1}. **${r.item_name || r.requirement_type || 'Requirement'}** x${r.required_quantity || 0}\n   - ${r.display_text || r.admin_display_text || '-'}`)
    : ['ไม่พบ requirement ของเควสนี้'];

  return baseEmbed(`📦 ของที่ต้องส่ง • ${quest.quest_code || ''}`, lines.join('\n\n'));
}

function buildQuestRewardsEmbed(quest, rewards) {
  const lines = rewards.length
    ? rewards.map((r, i) => `${i + 1}. **${r.reward_item_name || r.reward_type || 'Reward'}** x${r.reward_quantity || 0}\n   - ${r.reward_display_text || '-'}`)
    : ['ไม่พบ reward ของเควสนี้'];

  return baseEmbed(`🎁 รางวัล • ${quest.quest_code || ''}`, lines.join('\n\n'));
}

function buildQuestDependenciesEmbed(quest, dependencies) {
  const lines = dependencies.length
    ? dependencies.map((d, i) => `${i + 1}. ${d.dependency_type || 'QUEST'} -> ${d.required_quest_code || d.required_quest_id || d.required_level || d.required_role_id || '-'}`)
    : ['ไม่มี dependency ของเควสนี้'];

  return baseEmbed(`🔗 Dependency • ${quest.quest_code || ''}`, lines.join('\n\n'));
}

function buildQuestImagesEmbed(quest, images, index = 0) {
  if (!images.length) {
    return baseEmbed(`🖼️ รูปตัวอย่าง • ${quest.quest_code || ''}`, 'ยังไม่มีรูปตัวอย่างของเควสนี้');
  }

  const item = images[index];
  return baseEmbed(
    `🖼️ รูปตัวอย่าง • ${quest.quest_code || ''} (${index + 1}/${images.length})`,
    [
      `**ชื่อรูป:** ${item.media_title || '-'}`,
      `**คำอธิบาย:** ${item.media_description || '-'}`,
      `**ลำดับ:** ${item.display_order || 0}`,
      `**ประเภท:** ${item.media_type || '-'}`,
      '',
      item.media_url || '-'
    ].join('\n')
  ).setImage(item.media_url || null);
}

function buildPanelStatusEmbed(rows) {
  const lines = rows.length
    ? rows.map((row) => `• ${row.profession_code}: channel=${row.panel_channel_id || '-'} / message=${row.panel_message_id || '-'}`)
    : ['ไม่พบข้อมูล panel config'];

  return baseEmbed('📡 สถานะพาเนล', lines.join('\n'));
}

function buildSearchResultsEmbed(query, quests) {
  return baseEmbed(
    `🔎 ผลการค้นหา: ${query}`,
    quests.length
      ? `พบ ${quests.length} รายการ กรุณาเลือกเควสที่ต้องการ`
      : 'ไม่พบเควสที่ตรงกับคำค้น'
  );
}

module.exports = {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildProfessionPickerEmbed,
  buildLevelPickerEmbed,
  buildQuestPickerEmbed,
  buildQuestDetailEmbed,
  buildQuestRequirementsEmbed,
  buildQuestRewardsEmbed,
  buildQuestDependenciesEmbed,
  buildQuestImagesEmbed,
  buildPanelStatusEmbed,
  buildSearchResultsEmbed
};
