const { withTransaction } = require('../../db/pool');
const { findQuestDetailById, updateQuestDescription } = require('../../db/queries/adminPanel.repo');
const { logAdminAudit } = require('../../services/adminAudit.service');
const { buildQuestDetailPayload } = require('../../services/adminPanel.service');

function parseModal(customId) {
  const parts = customId.split(':');
  return { questId: parts[4] || null };
}

async function handleAdminEditQuestDescriptionModal(interaction) {
  const { questId } = parseModal(interaction.customId);

  const payload = {
    quest_name: interaction.fields.getTextInputValue('quest_name')?.trim(),
    quest_description: interaction.fields.getTextInputValue('quest_description')?.trim(),
    panel_title: interaction.fields.getTextInputValue('panel_title')?.trim(),
    button_label: interaction.fields.getTextInputValue('button_label')?.trim(),
    admin_note: interaction.fields.getTextInputValue('admin_note')?.trim()
  };

  let before;
  let after;

  await withTransaction(async (client) => {
    before = await findQuestDetailById(questId, client);
    after = await updateQuestDescription(questId, payload, client);
    await logAdminAudit({
      action_type: 'QUEST_DESCRIPTION_UPDATED',
      actor_discord_id: interaction.user.id,
      actor_discord_tag: interaction.user.tag,
      quest_id: questId,
      target_table: 'tb_quest_master',
      target_id: questId,
      before_json: before,
      after_json: after
    }, client);
  });

  await interaction.reply({ content: '✅ บันทึกคำอธิบายเควสเรียบร้อยแล้ว', ephemeral: true });
}

module.exports = {
  handleAdminEditQuestDescriptionModal
};
