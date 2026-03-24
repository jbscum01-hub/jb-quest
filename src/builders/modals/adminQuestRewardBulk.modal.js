const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function rewardLine(item) {
  if (item.reward_type === 'SCUM_ITEM') {
    return [
      'SCUM_ITEM',
      item.reward_item_name || '',
      item.reward_quantity || '',
      item.reward_spawn_command_template || '',
      item.reward_display_text || ''
    ].join('|');
  }
  if (item.reward_type === 'SCUM_MONEY') {
    return ['SCUM_MONEY', 'เงิน', item.reward_value_number || '', '', item.reward_display_text || ''].join('|');
  }
  if (item.reward_type === 'FAME_POINT') {
    return ['FAME_POINT', 'FP', item.reward_value_number || '', '', item.reward_display_text || ''].join('|');
  }
  if (item.reward_type === 'DISCORD_ROLE') {
    return ['DISCORD_ROLE', item.discord_role_id || '', item.discord_role_name || '', '', item.reward_display_text || ''].join('|');
  }
  return [item.reward_type || '', item.reward_display_text || ''].join('|');
}

function buildQuestRewardBulkModal(bundle) {
  const quest = bundle.quest;
  const lines = (bundle.rewards || []).map(rewardLine).join('\n');

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:rewbulk:${quest.quest_id}`)
    .setTitle('แก้รางวัล (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_reward_lines')
          .setLabel('รูปแบบ: TYPE|ชื่อ|จำนวน|คำสั่ง|แสดงผล')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('SCUM_ITEM|Medkit|2|#spawnitem Medkit 2|Medkit x2')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestRewardBulkModal };
