const { withTransaction } = require('../../db/pool');
const { findRewardById, updateReward } = require('../../db/queries/adminPanel.repo');
const { logAdminAudit } = require('../../services/adminAudit.service');

function parseModal(customId) {
  const parts = customId.split(':');
  return { rewardId: parts[4] || null };
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function handleAdminEditRewardModal(interaction) {
  const { rewardId } = parseModal(interaction.customId);

  const payload = {
    reward_item_name: interaction.fields.getTextInputValue('reward_item_name')?.trim(),
    reward_quantity: toInt(interaction.fields.getTextInputValue('reward_quantity'), 0),
    reward_display_text: interaction.fields.getTextInputValue('reward_display_text')?.trim(),
    discord_role_id: interaction.fields.getTextInputValue('discord_role_id')?.trim(),
    sort_order: toInt(interaction.fields.getTextInputValue('sort_order'), 1)
  };

  let before;
  let after;

  await withTransaction(async (client) => {
    before = await findRewardById(rewardId, client);
    after = await updateReward(rewardId, payload, client);
    await logAdminAudit({
      action_type: 'QUEST_REWARD_UPDATED',
      actor_discord_id: interaction.user.id,
      actor_discord_tag: interaction.user.tag,
      quest_id: before?.quest_id,
      reward_id: rewardId,
      target_table: 'tb_quest_master_reward',
      target_id: rewardId,
      before_json: before,
      after_json: after
    }, client);
  });

  await interaction.reply({ content: '✅ บันทึกรางวัลเรียบร้อยแล้ว', ephemeral: true });
}

module.exports = {
  handleAdminEditRewardModal
};
