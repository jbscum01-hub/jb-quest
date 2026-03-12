const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function boolString(value, fallback = true) {
  if (value === undefined || value === null) return fallback ? 'yes' : 'no';
  return value ? 'yes' : 'no';
}

function buildStepModal({ questId = null, step = null, mode = 'add' }) {
  const customId = mode === 'add'
    ? `quest:admin_modal:stpa:${questId}`
    : `quest:admin_modal:stpe:${step.step_id}`;

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(mode === 'add' ? 'เพิ่ม Step' : `แก้ Step ${step.step_no}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('step_no').setLabel('หมายเลข Step').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10).setValue(String(step?.step_no || 1))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('step_title').setLabel('ชื่อ Step').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(255).setValue(step?.step_title || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('step_description').setLabel('คำอธิบาย Step').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000).setValue(step?.step_description || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('flags').setLabel('TEXT,ATTACH,APPROVAL,RESUBMIT').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100).setValue([
          step ? (step.requires_text_input ? 'TEXT' : null) : 'TEXT',
          step ? (step.requires_attachment ? 'ATTACH' : null) : 'ATTACH',
          step ? (step.requires_admin_approval ? 'APPROVAL' : null) : 'APPROVAL',
          step ? (step.allow_resubmit ? 'RESUBMIT' : null) : 'RESUBMIT'
        ].filter(Boolean).join(','))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('success_failure').setLabel('ข้อความสำเร็จ | ไม่ผ่าน').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(1000).setValue(`${step?.success_message || ''}|${step?.failure_message || ''}`)
      )
    );
}

module.exports = { buildStepModal };
