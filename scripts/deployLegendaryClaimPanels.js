const { createBot } = require('../bot');
const { deployAllLegendaryClaimPanels } = require('../services/legendaryClaimPanel.service');

async function run() {
  const client = await createBot();

  client.once('clientReady', async () => {
    await deployAllLegendaryClaimPanels(client);
    process.exit(0);
  });

  await client.login(process.env.BOT_TOKEN);
}

run();
