const { createBot } = require('../bot');
const { autoDeployAdminPanel } = require('../services/adminPanelAutoDeploy.service');

async function run() {
  const client = await createBot();

  client.once('clientReady', async () => {
    await autoDeployAdminPanel(client);
    process.exit(0);
  });

  await client.login(process.env.BOT_TOKEN);
}

run();
