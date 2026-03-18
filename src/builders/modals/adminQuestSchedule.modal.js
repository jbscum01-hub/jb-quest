const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function safeValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function formatTimestampForInput(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?$/);
    if (m) return `${m[1]} ${m[2] || '00:00'}`;
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const hh = String(value.getHours()).padStart(2, '0');
    const mi = String(value.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }
  return String(value);
}

function buildQuestScheduleModal(quest) {
  const isTimed = quest.category_code === 'TIMED';
  const isLegendary = quest.category_code === 'LEGENDARY';

  const modal = new ModalBuilder()
    .setCustomId(`quest:admin_modal:qsched:${quest.quest_id}`)
    .setTitle(isTimed ? 'แก้เวลา/ลิมิตเควสพิเศษ' : isLegendary ? 'แก้ลิมิตเควสตำนาน' : 'แก้เวลา/ลิมิตเควส');

  if (isTimed) {
    const startAt = new TextInputBuilder()
      .setCustomId('start_at')
      .setLabel('วันเริ่ม (YYYY-MM-DD หรือ YYYY-MM-DD HH:mm)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(safeValue(formatTimestampForInput(quest.start_at)));

    const durationDays = new TextInputBuilder()
      .setCustomId('duration_days')
      .setLabel('ระยะเวลาเควส (วัน)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(safeValue(quest.duration_days));

    const limitCount = new TextInputBuilder()
      .setCustomId('submission_limit_count')
      .setLabel('ส่งได้กี่ครั้ง')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(safeValue(quest.submission_limit_count));

    const limitPeriod = new TextInputBuilder()
      .setCustomId('submission_limit_period_days')
      .setLabel('จำกัดการส่ง (วัน)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(safeValue(quest.submission_limit_period_days));

    modal.addComponents(
      new ActionRowBuilder().addComponents(startAt),
      new ActionRowBuilder().addComponents(durationDays),
      new ActionRowBuilder().addComponents(limitCount),
      new ActionRowBuilder().addComponents(limitPeriod)
    );

    return modal;
  }

  const weeklyClaimLimit = new TextInputBuilder()
    .setCustomId('weekly_claim_limit')
    .setLabel('รับรางวัลได้กี่ครั้งต่อสัปดาห์')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(quest.weekly_claim_limit || 1));

  modal.addComponents(new ActionRowBuilder().addComponents(weeklyClaimLimit));
  return modal;
}

module.exports = { buildQuestScheduleModal };
