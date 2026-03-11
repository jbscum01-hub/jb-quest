const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

async function renderAdminHome(target) {
  const payload = {
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  };

  if (target && typeof target.edit === 'function' && !target.isButton?.()) {
    return target.edit(payload);
  }

  if (target && typeof target.editReply === 'function') {
    if (!target.deferred && !target.replied) {
      await target.deferReply({ ephemeral: true });
    }
    return target.editReply(payload);
  }

  if (target && typeof target.reply === 'function') {
    return target.reply({
      ...payload,
      ephemeral: true
    });
  }

  throw new Error('renderAdminHome target is not supported');
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome
};
