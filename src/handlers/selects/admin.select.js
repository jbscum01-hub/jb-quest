const {
  renderLevelPicker,
  renderQuestList,
  renderQuestDetail,
  showEditRequirementModal,
  showEditRewardModal
} = require('../../services/adminPanel.service');

async function handleAdminSelect(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;

  if (action === 'profession') {
    return renderLevelPicker(interaction, interaction.values[0]);
  }

  if (action === 'level') {
    return renderQuestList(interaction, extra, Number(interaction.values[0]));
  }

  if (action === 'quest') {
    const questId = interaction.values[0];
    if (questId === 'NO_QUEST') {
      await interaction.reply({ content: 'ไม่พบเควสให้เปิดรายละเอียด', ephemeral: true });
      return;
    }
    return renderQuestDetail(interaction, questId);
  }

  if (action === 'edit_requirement') {
    const requirementId = interaction.values[0];
    if (requirementId === 'NO_REQUIREMENT') {
      await interaction.reply({ content: 'ไม่พบรายการของที่ต้องส่ง', ephemeral: true });
      return;
    }
    return showEditRequirementModal(interaction, extra, requirementId);
  }

  if (action === 'edit_reward') {
    const rewardId = interaction.values[0];
    if (rewardId === 'NO_REWARD') {
      await interaction.reply({ content: 'ไม่พบรางวัล', ephemeral: true });
      return;
    }
    return showEditRewardModal(interaction, extra, rewardId);
  }
}

module.exports = {
  handleAdminSelect
};
