const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildCreateQuestModal({ professionCode = null, level = null, categoryCode = null } = {}) {
  const isGlobal = ['TIMED', 'LEGENDARY'].includes(categoryCode);
  const titleLabel = isGlobal
    ? (categoryCode === 'TIMED' ? 'สร้างเควสพิเศษ' : 'สร้างเควสตำนาน')
    : `สร้างเควสใหม่ · ${professionCode} Lv${level}`;
  const modalKey = isGlobal ? `GLOBAL|${categoryCode}` : `${professionCode}|${level}`;
  const codePlaceholder = isGlobal
    ? (categoryCode === 'TIMED' ? 'SPECIAL_EVENT_001' : 'LEGENDARY_001')
    : `${professionCode}_LV${level}_001`;
  const flagPlaceholder = isGlobal ? 'STEP,TICKET' : 'STEP,TICKET,REPEATABLE';

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:cq:${modalKey}`)
    .setTitle(titleLabel)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_code').setLabel('Quest Code').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50).setPlaceholder(codePlaceholder)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(255)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_description').setLabel('คำอธิบายเควส').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('flags').setLabel('ตัวเลือกพิเศษ').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100).setPlaceholder(flagPlaceholder)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('dependency_code').setLabel('Quest Code ก่อนหน้า (ยังไม่ใช้)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
      )
    );
}

module.exports = { buildCreateQuestModal };
