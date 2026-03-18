const { createBot } = require('../bot');
const { autoDeployAdminPanel } = require('../services/adminPanelAutoDeploy.service');
const { autoDeployPanels } = require('../services/panelAutoDeploy.service');
const { deployAllGlobalQuestPanels } = require('../services/globalPanel.service');

async function run() {
  const client = await createBot();

  client.once('clientReady', async () => {
    await autoDeployAdminPanel(client);
    await autoDeployPanels(client);
    await deployAllGlobalQuestPanels(client);
    process.exit(0);
  });

  await client.login(process.env.BOT_TOKEN);
}

run();
