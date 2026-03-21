const { withTransaction } = require('../../db/pool');
const { findRequirementById, updateRequirement } = require('../../db/queries/adminPanel.repo');
const { logAdminAudit } = require('../../services/adminAudit.service');

function parseModal(customId) {
  const parts = customId.split(':');
  return { requirementId: parts[4] || null };
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function handleAdminEditRequirementModal(interaction) {
  const { requirementId } = parseModal(interaction.customId);

  const payload = {
    item_name: interaction.fields.getTextInputValue('item_name')?.trim(),
    required_quantity: toInt(interaction.fields.getTextInputValue('required_quantity'), 0),
    display_text: interaction.fields.getTextInputValue('display_text')?.trim(),
    admin_display_text: interaction.fields.getTextInputValue('admin_display_text')?.trim(),
    sort_order: toInt(interaction.fields.getTextInputValue('sort_order'), 1)
  };

  let before;
  let after;

  await withTransaction(async (client) => {
    before = await findRequirementById(requirementId, client);
    after = await updateRequirement(requirementId, payload, client);
    await logAdminAudit({
      action_type: 'QUEST_REQUIREMENT_UPDATED',
      actor_discord_id: interaction.user.id,
      actor_discord_tag: interaction.user.tag,
      quest_id: before?.quest_id,
      requirement_id: requirementId,
      target_table: 'tb_quest_master_requirement',
      target_id: requirementId,
      before_json: before,
      after_json: after
    }, client);
  });

  await interaction.reply({ content: '✅ บันทึกของที่ต้องส่งเรียบร้อยแล้ว', ephemeral: true });
}

module.exports = {
  handleAdminEditRequirementModal
};
