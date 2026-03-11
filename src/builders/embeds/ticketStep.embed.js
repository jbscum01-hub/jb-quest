const { EmbedBuilder } = require('discord.js');

function buildTicketStepEmbed({
  ticket,
  currentStep,
  totalSteps
}) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎫 ${ticket.quest_name}`)
    .setDescription(
      [
        `ผู้เล่น: <@${ticket.discord_user_id}>`,
        `สายอาชีพ: ${ticket.profession_name_th || ticket.profession_code || '-'}`,
        `เลเวล: ${ticket.quest_level || '-'} Step Quest`,
        `Ticket: ${ticket.ticket_code}`,
        `สถานะ Ticket: ${ticket.ticket_status}`,
        '',
        `ขั้นตอนปัจจุบัน: ${currentStep.step_no}/${totalSteps}`,
        `ชื่อขั้นตอน: ${currentStep.step_title}`,
        `${currentStep.step_description || '-'}`
      ].join('\n')
    )
    .addFields(
      {
        name: 'วิธีดำเนินการ',
        value: [
          currentStep.requires_text_input ? '• ส่งข้อความอธิบายใน Ticket' : '• ไม่บังคับข้อความ',
          currentStep.requires_attachment ? '• แนบรูป/หลักฐานใน Ticket' : '• ไม่บังคับแนบไฟล์',
          currentStep.requires_admin_approval ? '• รอแอดมินตรวจและอนุมัติ' : '• ไม่ต้องรออนุมัติ'
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({ text: 'Step Quest Ticket' })
    .setTimestamp();
}

module.exports = {
  buildTicketStepEmbed
};
