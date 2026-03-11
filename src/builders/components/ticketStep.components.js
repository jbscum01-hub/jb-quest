const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildTicketStepComponents(ticketId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'submit_step', ticketId))
        .setLabel('📨 ส่งขั้นตอนนี้')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'approve_step', ticketId))
        .setLabel('✅ อนุมัติขั้นตอน')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('ticket', 'revision_step', ticketId))
        .setLabel('📝 ขอแก้ไขขั้นตอน')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildTicketStepComponents
};
