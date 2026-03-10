const dotenv = require('dotenv');

let loaded = false;

function loadEnv() {
  if (loaded) return;

  dotenv.config();

  const requiredVars = [
    'BOT_TOKEN',
    'DATABASE_URL',
    'GUILD_ID'
  ];

  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  loaded = true;
}

module.exports = {
  loadEnv
};
