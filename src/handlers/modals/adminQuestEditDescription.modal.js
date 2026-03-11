const { updateQuestDescriptionWithAudit } = require('../../services/adminQuestEdit.service');

async function handleAdminQuestEditDescriptionModal(interaction) {
  const { customId } = interaction;

  // quest:admin:modal:edit_description:{questId}
  const parts = customId.split(':');
  const questId = parts[5];

  const questName = interaction.fields.getTextInputValue('quest_name').trim();
  const questDescription = interaction.fields.getTextInputValue('quest_description').trim();
  const panelTitle = interaction.fields.getTextInputValue('panel_title').trim();
  const panelDescription = interaction.fields.getTextInputValue('panel_description').trim();
  const buttonLabel = interaction.fields.getTextInputValue('button_label').trim();

  const result = await updateQuestDescriptionWithAudit({
    questId,
    actorDiscordId: interaction.user.id,
    actorDiscordTag: interaction.user.tag,
    payload: {
      questName,
      questDescription,
      panelTitle,
      panelDescription,
      buttonLabel
    }
  });

  await interaction.reply({
    content: `✅ แก้ไขคำอธิบายเควสเรียบร้อยแล้ว\nเควส: ${result.after.quest_name}`,
    ephemeral: true
  });
}

module.exports = {
  handleAdminQuestEditDescriptionModal
};
