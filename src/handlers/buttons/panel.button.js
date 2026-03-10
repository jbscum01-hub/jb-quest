const { getCurrentQuestSummary } = require('../../services/panel.service');

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    const summary = await getCurrentQuestSummary(professionCode);

    await interaction.reply({
      content: summary.text,
      ephemeral: true
    });
    return;
  }

  if (action === 'submit_main') {
    await interaction.reply({
      content: `กำลังเปิดระบบส่งเควสหลักของสาย ${professionCode} (stub)`,
      ephemeral: true
    });
    return;
  }

  if (action === 'submit_repeatable') {
    await interaction.reply({
      content: `กำลังเปิดระบบส่งเควสซ้ำของสาย ${professionCode} (stub)`,
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: 'ไม่พบ action ของ panel นี้',
    ephemeral: true
  });
}

module.exports = {
  handlePanelButton
};
