async function handleReviewButton(interaction, parsed) {

  const { action, extra } = parsed;

  const submissionId = extra;

  if (action === "inspect") {

    await interaction.reply({
      content: `🔎 กำลังตรวจสอบ Submission ${submissionId}`,
      flags: 64
    });

    return;
  }

  if (action === "approve") {

    await interaction.update({
      content: `✅ Submission ${submissionId} อนุมัติแล้ว`,
      components: []
    });

    return;
  }

  if (action === "revision") {

    await interaction.update({
      content: `📝 Submission ${submissionId} ขอแก้ไข`,
      components: []
    });

    return;
  }

  if (action === "reject") {

    await interaction.update({
      content: `❌ Submission ${submissionId} ถูกปฏิเสธ`,
      components: []
    });

    return;
  }

  if (action === "reward") {

    await interaction.reply({
      content: `🎁 ดูรางวัลของ Submission ${submissionId}`,
      flags: 64
    });

    return;
  }

}

module.exports = {
  handleReviewButton
};
