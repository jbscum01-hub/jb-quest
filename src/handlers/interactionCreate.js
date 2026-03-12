const { handleAdminButtons } = require('./buttons/admin.button');
const { handleAdminSelects } = require('./selects/admin.select');
const { handleAdminSearchQuestModal } = require('./modals/adminSearchQuest.modal');

module.exports = (client, logger = console) => {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (await handleAdminButtons(interaction)) return;
      if (await handleAdminSelects(interaction)) return;
      if (await handleAdminSearchQuestModal(interaction)) return;
    } catch (error) {
      logger.error?.('[ADMIN] interactionCreate failed', error);

      const payload = { content: 'เกิดข้อผิดพลาดระหว่างจัดการหน้าแอดมิน', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  });
};
