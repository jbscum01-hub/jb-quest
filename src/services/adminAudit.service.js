const { logger } = require('../config/logger');
const { insertAdminAudit } = require('../db/queries/adminPanel.repo');

async function logAdminAudit(payload, client = null) {
  try {
    await insertAdminAudit(payload, client);
  } catch (error) {
    logger.warn('Admin audit skipped', error.message);
  }
}

module.exports = {
  logAdminAudit
};
