const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildCreateQuestModal(professionCode, level) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:cq:${professionCode}|${level}`)
    .setTitle(`สร้างเควสใหม่ · ${professionCode} Lv${level}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_code').setLabel('Quest Code').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50).setPlaceholder(`${professionCode}_LV${level}_001`)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(255)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_description').setLabel('คำอธิบายเควส').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('flags').setLabel('ตัวเลือกพิเศษ').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100).setPlaceholder('STEP,TICKET,REPEATABLE')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('dependency_code').setLabel('Quest Code ก่อนหน้า (ถ้ามี)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
      )
    );
}

module.exports = { buildCreateQuestModal };
