const { EmbedBuilder } = require('discord.js');

function buildAdminHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ ศูนย์ควบคุม Quest Admin')
    .setDescription([
      'เลือกหมวดที่ต้องการใช้งานด้านล่าง',
      '',
      '🧩 **จัดการพาเนล**',
      'ใช้สำหรับสร้าง / รีเฟรช / ตรวจสอบพาเนลของแต่ละสายอาชีพ',
      '',
      '📘 **จัดการข้อมูลเควส**',
      'ใช้สำหรับเลือกเควสก่อน แล้วค่อยดูหรือแก้ไขรายละเอียดของเควสนั้น',
      '',
      'หมายเหตุ: ปุ่มทุกปุ่มในหน้านี้ตั้งชื่อภาษาไทยแล้ว เพื่อลดการกดผิดและลดความสับสน'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest Admin' })
    .setTimestamp();
}

function buildPanelManagementEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧩 จัดการพาเนล')
    .setDescription([
      'ปุ่มแต่ละอันใช้ดังนี้',
      '',
      '• **สร้างพาเนลใหม่** — ใช้ตอนพาเนลยังไม่มี หรืออยากให้บอทส่งข้อความพาเนลใหม่อีกครั้ง',
      '• **รีเฟรชพาเนล** — ใช้ตอนแก้ข้อความ/ปุ่ม แล้วต้องการอัปเดตพาเนลเดิม',
      '• **ซ่อมพาเนลที่หาย** — ใช้ตอนบางห้องโดนลบข้อความพาเนล',
      '• **รีเฟรชมุมมองเควสปัจจุบัน** — ใช้หลังแก้ข้อมูลเควสหรือ progress logic',
      '• **สถานะพาเนล** — ใช้ตรวจว่าแต่ละสายมี channel/message พร้อมหรือไม่'
    ].join('\n'))
    .setFooter({ text: 'Panel Management' })
    .setTimestamp();
}

function buildMasterHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📘 จัดการข้อมูลเควส')
    .setDescription([
      'ระบบนี้จะ **เลือกเควสก่อนเสมอ** เพื่อให้แอดมินไม่หลงว่ากำลังแก้เควสไหน',
      '',
      'วิธีใช้งาน:',
      '1. กด **เลือกเควสเพื่อดู/แก้ไข**',
      '2. เลือกสายอาชีพ',
      '3. เลือกระดับเควส',
      '4. เลือกเควส',
      '5. เข้าไปดูหรือกดแก้ในหน้า Quest Detail',
      '',
      'ปุ่ม **สร้างเควสใหม่** จะเตรียมไว้ก่อน และค่อยต่อ modal/create flow รอบถัดไป'
    ].join('\n'))
    .setFooter({ text: 'Master Data / Configuration' })
    .setTimestamp();
}

function buildProfessionBrowseEmbed(professions) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🗂️ เลือกสายอาชีพ')
    .setDescription('เลือกสายอาชีพด้านล่าง แล้วระบบจะพาไปเลือกระดับเควสต่อ')
    .addFields({
      name: 'สายที่ใช้งานได้',
      value: professions.map((item) => `• ${item.profession_name_th} (${item.profession_code})`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();
}

function buildLevelBrowseEmbed(profession, levels) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🧭 เลือกระดับเควส · ${profession.profession_name_th}`)
    .setDescription('เลือกระดับที่ต้องการ แล้วระบบจะแสดงรายการเควสในระดับนั้น')
    .addFields({
      name: 'ระดับที่พบ',
      value: levels.map((item) => `• Lv.${item.quest_level} (${item.quest_count} เควส)`).join('\n') || '-'
    })
    .setTimestamp();
}

function buildQuestBrowseEmbed(profession, level, quests) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 เลือกเควส · ${profession.profession_name_th} · Lv.${level}`)
    .setDescription('เมื่อเลือกเควสแล้ว ระบบจะพาไปหน้า Quest Detail ของเควสนั้นทันที')
    .addFields({
      name: 'รายการเควส',
      value: quests.map((quest) => `• ${quest.quest_code} — ${quest.quest_name}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();
}

function buildQuestDetailEmbed({ quest, dependencies = [], requirements = [], rewards = [], images = [], steps = [] }) {
  const dependencyText = dependencies.length
    ? dependencies.map((dep) => {
        if (dep.dependency_type === 'PREVIOUS_QUEST') {
          return `• ผ่านเควสก่อนหน้า: ${dep.required_quest_code || dep.required_quest_id}`;
        }
        if (dep.dependency_type === 'MAIN_LEVEL') {
          return `• ต้องมี Main Level อย่างน้อย Lv.${dep.required_level}`;
        }
        if (dep.dependency_type === 'ROLE') {
          return `• ต้องมี Role: ${dep.required_role_name || dep.required_role_id}`;
        }
        return `• ${dep.dependency_type}`;
      }).join('\n')
    : 'ไม่มี';

  return new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(`📘 ${quest.quest_name}`)
    .setDescription([
      `**รหัสเควส:** ${quest.quest_code}`,
      `**สายอาชีพ:** ${quest.profession_name_th || '-'} (${quest.profession_code || '-'})`,
      `**ระดับ:** Lv.${quest.quest_level ?? '-'}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${quest.is_step_quest ? 'Step Quest' : 'Quest ปกติ'}${quest.requires_ticket ? ' • ใช้ Ticket' : ''}${quest.is_repeatable ? ' • ทำซ้ำได้' : ''}`,
      '',
      `**คำอธิบาย:** ${quest.quest_description || quest.panel_description || '-'}`,
      '',
      'จากหน้านี้แอดมินจะเห็นชัดว่า “กำลังแก้เควสไหนอยู่” แล้วค่อยเลือกปุ่มที่เกี่ยวข้องด้านล่าง'
    ].join('\n'))
    .addFields(
      { name: 'เงื่อนไขปลดล็อก', value: dependencyText.slice(0, 1024) || 'ไม่มี', inline: false },
      { name: 'ของที่ต้องส่ง', value: String(requirements.length), inline: true },
      { name: 'รางวัล', value: String(rewards.length), inline: true },
      { name: 'รูปตัวอย่าง', value: String(images.length), inline: true },
      { name: 'ขั้นตอน', value: String(steps.length), inline: true }
    )
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();
}

function buildSimpleListEmbed({ title, color = 0x2b2d31, description, lines }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields({
      name: 'รายละเอียด',
      value: lines.length ? lines.join('\n').slice(0, 1024) : 'ไม่มีข้อมูล'
    })
    .setTimestamp();
}

function buildPanelStatusEmbed(rows) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📡 สถานะพาเนล')
    .setDescription('ใช้หน้านี้ตรวจว่าพาเนลของแต่ละสายยังอยู่ครบหรือไม่')
    .addFields({
      name: 'ผลการตรวจสอบ',
      value: rows.map((row) => `• ${row.professionCode} → ${row.status}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();
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
  buildPanelStatusEmbed
};
