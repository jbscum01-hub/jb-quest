const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildTicketStepComponents(ticketId, stepNo) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'submit_step', `${ticketId}:${stepNo}`))
        .setLabel('📨 ส่ง Step')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'approve_step', ticketId))
        .setLabel('✅ อนุมัติ')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'revision_step', ticketId))
        .setLabel('📝 ขอแก้ไข')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildTicketStepComponents
};
