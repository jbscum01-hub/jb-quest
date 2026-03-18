const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function getTypeLabel(categoryCode) {
  const value = String(categoryCode || 'MAIN').toUpperCase();
  if (value === 'TIMED') return 'เควสพิเศษ';
  if (value === 'LEGENDARY') return 'เควสตำนาน';
  if (value === 'REPEATABLE') return 'เควสซ้ำ';
  return 'เควสหลัก';
}

function buildCreateQuestModal(professionCode, level, categoryCode = 'MAIN') {
  const normalizedCategory = String(categoryCode || 'MAIN').toUpperCase();
  const typeLabel = getTypeLabel(normalizedCategory);

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:cq:${professionCode}|${level}|${normalizedCategory}`)
    .setTitle(`สร้าง${typeLabel} · ${professionCode} Lv${level}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quest_code')
          .setLabel('Quest Code')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50)
          .setPlaceholder(`${professionCode}_${normalizedCategory}_LV${level}_001`)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quest_name')
          .setLabel('ชื่อเควส')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(255)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quest_description')
          .setLabel('คำอธิบายเควส')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(1000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('flags')
          .setLabel('ตัวเลือกพิเศษ')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
          .setPlaceholder('STEP,TICKET,REPEATABLE')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('dependency_code')
          .setLabel('Quest Code ก่อนหน้า (ถ้ามี)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(50)
      )
    );
}

module.exports = { buildCreateQuestModal };