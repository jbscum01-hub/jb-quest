const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getConfig(key) {

  const result = await pool.query(
    `
    SELECT config_value
    FROM tb_quest_master_discord_config
    WHERE config_key = $1
    LIMIT 1
    `,
    [key]
  );

  if (result.rows.length === 0) return null;

  return result.rows[0].config_value;
}

module.exports = {
  getConfig
};
