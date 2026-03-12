const { withTransaction } = require('../../db/pool');
const { insertQuestGuideImage } = require('../../db/queries/adminPanel.repo');
const { logAdminAudit } = require('../../services/adminAudit.service');

function parseModal(customId) {
  const parts = customId.split(':');
  return { questId: parts[4] || null };
}

function toInt(value, fallback = 1) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function handleAdminAddQuestImageModal(interaction) {
  const { questId } = parseModal(interaction.customId);

  const payload = {
    media_url: interaction.fields.getTextInputValue('media_url')?.trim(),
    media_title: interaction.fields.getTextInputValue('media_title')?.trim(),
    media_description: interaction.fields.getTextInputValue('media_description')?.trim(),
    display_order: toInt(interaction.fields.getTextInputValue('display_order'), 1)
  };

  let media;
  await withTransaction(async (client) => {
    media = await insertQuestGuideImage(questId, payload, client);
    await logAdminAudit({
      action_type: 'QUEST_MEDIA_ADDED',
      actor_discord_id: interaction.user.id,
      actor_discord_tag: interaction.user.tag,
      quest_id: questId,
      media_id: media?.media_id,
      target_table: 'tb_quest_master_media',
      target_id: media?.media_id,
      after_json: media
    }, client);
  });

  await interaction.reply({ content: '✅ เพิ่มรูปตัวอย่างเควสเรียบร้อยแล้ว', ephemeral: true });
}

module.exports = {
  handleAdminAddQuestImageModal
};
