const { ensureAdmin } = require('../buttons/admin.button');
const {
  buildBrowseLevelPayload,
  buildBrowseQuestPayload,
  buildQuestDetailPayload
} = require('../../services/adminPanel.service');

async function handleAdminSelect(interaction) {
  if (!(await ensureAdmin(interaction))) return;

  const { customId, values } = interaction;
  const selectedValue = values?.[0];

  if (customId === 'quest:admin:select_profession') {
    await interaction.update(await buildBrowseLevelPayload(selectedValue));
    return;
  }

  if (customId.startsWith('quest:admin:select_level:')) {
    const professionId = customId.split(':')[3];
    await interaction.update(await buildBrowseQuestPayload(professionId, selectedValue));
    return;
  }

  if (customId.startsWith('quest:admin:select_quest:')) {
    await interaction.update(await buildQuestDetailPayload(selectedValue));
    return;
  }

  await interaction.reply({ content: 'ยังไม่รองรับ select menu นี้', flags: 64 });
}

module.exports = {
  handleAdminSelect
};
