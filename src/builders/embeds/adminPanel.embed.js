const { EmbedBuilder } = require('discord.js');

function buildBaseEmbed(title) {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(title)
    .setFooter({ text: 'SCUM Quest Bot • Admin Panel ภาษาไทย' })
    .setTimestamp();
}

function buildAdminHomeEmbed() {
  return buildBaseEmbed('⚙️ หน้าหลักแอดมิน')
    .setDescription([
      'ศูนย์ควบคุมระบบ Quest Bot สำหรับแอดมิน',
      '',
      '**เมนูที่มีในหน้านี้**',
      '• จัดการพาเนล — ใช้ส่ง / รีเฟรช / ซ่อมพาเนลผู้เล่น',
      '• จัดการข้อมูลเควส — ใช้เลือกเควสก่อน แล้วค่อยดูหรือแก้ข้อมูลของเควสนั้น',
      '',
      '**แนวทางการใช้งานที่แนะนำ**',
      '1. เลือก “จัดการข้อมูลเควส”',
      '2. เลือกสาย > เลือกเลเวล > เลือกเควส',
      '3. เข้า Quest Detail แล้วค่อยกดดูหรือแก้ข้อมูล',
      '',
      'แบบนี้แอดมินจะไม่หลงว่าอยู่เควสไหน'
    ].join('\n'));
}

function buildPanelManagementEmbed() {
  return buildBaseEmbed('🧩 จัดการพาเนล')
    .setDescription([
      'เมนูนี้ใช้สำหรับจัดการพาเนลฝั่งผู้เล่นและตรวจสถานะข้อความพาเนล',
      '',
      '**คำอธิบายปุ่ม**',
      '• ส่งพาเนลผู้เล่นใหม่ — ใช้ตอนเริ่มระบบหรือต้องการส่งพาเนลใหม่ทั้งชุด',
      '• รีเฟรชพาเนลผู้เล่น — ใช้ตอนแก้ข้อความ / ปุ่ม / layout แล้วอยากอัปเดตของเดิม',
      '• ซ่อมพาเนลที่หาย — ใช้เมื่อบางสายโดนลบหรือ message id ไม่ตรง',
      '• รีเฟรช Current Quest — ใช้เมื่อ logic progress เปลี่ยนหรือ panel แสดงไม่ตรง',
      '• สถานะพาเนล — ใช้เช็กสุขภาพระบบว่าพาเนลสายไหนหายหรือยังอยู่'
    ].join('\n'));
}

function buildMasterHomeEmbed() {
  return buildBaseEmbed('📚 จัดการข้อมูลเควส')
    .setDescription([
      'เมนูนี้ใช้สำหรับดูและแก้ข้อมูล Quest Master',
      '',
      '**หลักการสำคัญ**',
      'เลือกเควสก่อนเสมอ แล้วค่อยดูหรือแก้ข้อมูลของเควสนั้น',
      '',
      '**คำอธิบายปุ่ม**',
      '• เลือกเควสตามสาย — เข้าแบบเรียงตามสายอาชีพและระดับ',
      '• ค้นหาเควส — พิมพ์ quest code หรือชื่อเควสเพื่อค้นหาเร็ว',
      '• สร้างเควสใหม่ — ปุ่มเตรียมไว้สำหรับ flow สร้างเควสในรอบถัดไป'
    ].join('\n'));
}

function buildProfessionBrowseEmbed(professions) {
  return buildBaseEmbed('🗂️ เลือกสายอาชีพ')
    .setDescription([
      'เลือกสายอาชีพที่ต้องการจัดการก่อน',
      '',
      `ตอนนี้พบทั้งหมด **${professions.length} สาย**`,
      'เมื่อเลือกแล้ว ระบบจะพาไปเลือกระดับเควส'
    ].join('\n'));
}

function buildLevelBrowseEmbed(profession, levels) {
  return buildBaseEmbed(`📌 เลือกระดับเควส • ${profession.icon_emoji || '📘'} ${profession.profession_name_th}`)
    .setDescription([
      `สาย: **${profession.profession_name_th}** (${profession.profession_code})`,
      '',
      `พบระดับเควสทั้งหมด **${levels.length} ระดับ**`,
      'เลือกเลเวลก่อน แล้วค่อยเลือกเควสที่ต้องการดูหรือแก้ไข'
    ].join('\n'));
}

function buildQuestBrowseEmbed(profession, questLevel, quests) {
  return buildBaseEmbed(`📖 รายการเควส • ${profession.profession_name_th} • Lv.${questLevel}`)
    .setDescription([
      `สาย: **${profession.profession_name_th}**`,
      `ระดับ: **Lv.${questLevel}**`,
      '',
      `พบทั้งหมด **${quests.length} เควส**`,
      'เลือกเควสด้านล่างเพื่อเข้า Quest Detail'
    ].join('\n'));
}

function buildQuestDetailEmbed(quest, extras = {}) {
  const requirementCount = extras.requirementCount || 0;
  const rewardCount = extras.rewardCount || 0;
  const dependencyCount = extras.dependencyCount || 0;
  const imageCount = extras.imageCount || 0;
  const stepCount = extras.stepCount || 0;

  return buildBaseEmbed(`🎯 ${quest.quest_name}`)
    .setDescription([
      `**สาย:** ${quest.icon_emoji || '📘'} ${quest.profession_name_th || '-'}`,
      `**Quest Code:** ${quest.quest_code}`,
      `**เลเวล:** ${quest.quest_level ?? '-'}`,
      `**สถานะ:** ${quest.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${quest.is_repeatable ? 'Repeatable' : 'Main Quest'}`,
      `**Step Quest:** ${quest.is_step_quest ? 'ใช่' : 'ไม่ใช่'}`,
      `**ต้องเปิด Ticket:** ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
      '',
      '**คำอธิบายเควส**',
      quest.quest_description || '- ไม่มีคำอธิบาย -',
      '',
      '**สรุปข้อมูลในเควสนี้**',
      `• ของที่ต้องส่ง: ${requirementCount} รายการ`,
      `• รางวัล: ${rewardCount} รายการ`,
      `• Dependency: ${dependencyCount} รายการ`,
      `• รูปตัวอย่าง: ${imageCount} รายการ`,
      `• Step: ${stepCount} รายการ`
    ].join('\n'));
}

function buildSimpleListEmbed(title, quest, rows, formatter) {
  const lines = rows.length
    ? rows.map((row, index) => formatter(row, index + 1))
    : ['- ไม่พบข้อมูล -'];

  return buildBaseEmbed(title)
    .setDescription([
      `**Quest:** ${quest.quest_code} • ${quest.quest_name}`,
      `**สาย:** ${quest.profession_name_th || '-'}`,
      `**เลเวล:** ${quest.quest_level ?? '-'}`,
      '',
      ...lines
    ].join('\n'));
}

function buildPanelStatusEmbed(items) {
  const lines = items.length
    ? items.map((item, index) => {
        const status = item.status === 'OK' ? '✅' : item.status === 'MISSING_MESSAGE' ? '⚠️' : '❌';
        return `${index + 1}. ${status} **${item.professionCode}**\n   ห้อง: ${item.channelId || '-'}\n   ข้อความ: ${item.messageId || '-'}\n   สถานะ: ${item.status}`;
      })
    : ['- ไม่พบข้อมูลพาเนล -'];

  return buildBaseEmbed('📡 สถานะพาเนล')
    .setDescription(lines.join('\n\n'));
}

function buildStubActionEmbed(title, questId = null) {
  return buildBaseEmbed(`🛠️ ${title}`)
    .setDescription([
      questId ? `Quest ID: **${questId}**` : null,
      'ปุ่มนี้เตรียม flow ภาษาไทยไว้แล้ว',
      'แต่ logic แก้ฐานข้อมูลจริงจะทำต่อในรอบถัดไป',
      '',
      'ตอนนี้ใช้หน้า Admin Panel ชุดนี้เพื่อเทสเส้นทางการใช้งานก่อน'
    ].filter(Boolean).join('\n'));
}

module.exports = {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildProfessionBrowseEmbed,
  buildLevelBrowseEmbed,
  buildQuestBrowseEmbed,
  buildQuestDetailEmbed,
  buildSimpleListEmbed,
  buildPanelStatusEmbed,
  buildStubActionEmbed
};
