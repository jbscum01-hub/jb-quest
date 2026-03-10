const { parseCustomId } = require('../utils/customId');
const { logger } = require('../config/logger');
const { handlePanelButton } = require('./buttons/panel.button');

function registerInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isButton()) {
        return;
      }

      const parsed = parseCustomId(interaction.customId);

      if (!parsed) {
        return;
      }

      if (parsed.scope === 'panel') {
        await handlePanelButton(interaction, parsed);
        return;
      }

      await interaction.reply({
        content: 'ยังไม่รองรับ interaction นี้ในระบบ',
        ephemeral: true
      });
    } catch (error) {
      logger.error('interactionCreate handler failed', error);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: 'เกิดข้อผิดพลาดระหว่างประมวลผล',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: 'เกิดข้อผิดพลาดระหว่างประมวลผล',
        ephemeral: true
      });
    }
  });
}

module.exports = {
  registerInteractionHandler
};
