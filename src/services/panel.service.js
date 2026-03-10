const {
  findCurrentMainQuestByProfession,
  findRepeatableQuestsByProfession
} = require('../db/queries/questMaster.repo');

function pickQuestName(row) {
  return row?.quest_name_th || row?.quest_name || row?.quest_code || 'ไม่ระบุชื่อเควส';
}

function pickQuestDescription(row) {
  return row?.quest_description_th || row?.quest_description || '-';
}

function buildCurrentQuestText(mainQuest, repeatableQuests = []) {
  if (!mainQuest) {
    return [
      'ไม่พบเควสหลักปัจจุบันของสายนี้',
      '',
      'ตรวจสอบได้ว่า:',
      '• profession_code ใน tb_quest_master ตรงกับ config',
      '• quest_category = MAIN',
      '• is_active = TRUE'
    ].join('\n');
  }

  const lines = [];

  lines.push(`📌 สายอาชีพ: ${mainQuest.profession_code}`);
  lines.push(`📖 เควสปัจจุบัน: ${pickQuestName(mainQuest)}`);
  lines.push(`🏷️ รหัสเควส: ${mainQuest.quest_code || '-'}`);
  lines.push(`⭐ เลเวล: ${mainQuest.level_no ?? '-'}`);
  lines.push(`📝 รายละเอียด: ${pickQuestDescription(mainQuest)}`);

  if (mainQuest.fame_required_display) {
    lines.push(`🔥 Fame ที่แสดง: ${mainQuest.fame_required_display}`);
  }

  if (mainQuest.fame_note) {
    lines.push(`📎 หมายเหตุ Fame: ${mainQuest.fame_note}`);
  }

  lines.push(`🎫 ใช้ Ticket: ${mainQuest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`);
  lines.push(`🧩 เป็น Step Quest: ${mainQuest.is_step_quest ? 'ใช่' : 'ไม่ใช่'}`);
  lines.push(`✅ ต้องแอดมินอนุมัติ: ${mainQuest.requires_admin_approval ? 'ใช่' : 'ไม่ใช่'}`);

  if (repeatableQuests.length > 0) {
    lines.push('');
    lines.push('♻️ เควสซ้ำที่มีในสายนี้:');
    for (const quest of repeatableQuests.slice(0, 5)) {
      lines.push(`• ${pickQuestName(quest)} (${quest.quest_code || '-'})`);
    }

    if (repeatableQuests.length > 5) {
      lines.push(`• และอีก ${repeatableQuests.length - 5} เควส`);
    }
  }

  return lines.join('\n');
}

async function getCurrentQuestSummary(professionCode) {
  const [mainQuest, repeatableQuests] = await Promise.all([
    findCurrentMainQuestByProfession(professionCode),
    findRepeatableQuestsByProfession(professionCode)
  ]);

  return {
    professionCode,
    mainQuest,
    repeatableQuests,
    text: buildCurrentQuestText(mainQuest, repeatableQuests)
  };
}

module.exports = {
  getCurrentQuestSummary
};
