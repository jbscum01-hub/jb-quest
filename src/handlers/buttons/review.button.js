const { EmbedBuilder } = require('discord.js');

async function handleReviewButton(interaction, parsed) {

  const { action, extra } = parsed;
  const userId = extra;

  if (action === 'approve') {

    await interaction.update({
      content: '✅ เควสนี้ได้รับการอนุมัติแล้ว',
      components: []
    });

    const user = await interaction.client.users.fetch(userId);

    await user.send('🎉 เควสของคุณได้รับการอนุมัติแล้ว');

    return;
  }

  if (action === 'reject') {

    await interaction.update({
      content: '❌ เควสนี้ถูกปฏิเสธ',
      components: []
    });

    const user = await interaction.client.users.fetch(userId);

    await user.send('❌ เควสของคุณไม่ผ่านการตรวจสอบ');

  }

}

module.exports = {
  handleReviewButton
};
