const { logger } = require('../config/logger');
const {
  ensureViewSessionTable,
  claimExpiredViewSessions,
  markViewSessionClosed,
  markViewSessionFailed
} = require('../db/queries/viewSession.repo');

const VIEW_SESSION_SWEEP_MS = 30 * 1000;
let expiryInterval = null;
let isSweeping = false;

async function editOriginalInteractionResponse({ applicationId, interactionToken, body }) {
  const response = await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discord API ${response.status}: ${text || response.statusText}`);
  }
}

async function closeExpiredSession(session) {
  await editOriginalInteractionResponse({
    applicationId: session.application_id,
    interactionToken: session.interaction_token,
    body: {
      content: '⌛ รายละเอียดเควสนี้หมดเวลาแล้ว กรุณากดดูเควสอีกครั้ง',
      embeds: [],
      components: []
    }
  });

  await markViewSessionClosed(session.session_id);
}

async function sweepExpiredViewSessions() {
  if (isSweeping) {
    return;
  }

  isSweeping = true;

  try {
    const sessions = await claimExpiredViewSessions(20);

    for (const session of sessions) {
      try {
        await closeExpiredSession(session);
      } catch (error) {
        await markViewSessionFailed(session.session_id, error?.message || String(error));
        logger.warn(`Failed to close quest view session ${session.session_id}`, error?.message || error);
      }
    }
  } catch (error) {
    logger.error('Quest view expiry sweep failed', error);
  } finally {
    isSweeping = false;
  }
}

async function startViewSessionExpiryWorker() {
  await ensureViewSessionTable();

  if (expiryInterval) {
    return;
  }

  expiryInterval = setInterval(() => {
    sweepExpiredViewSessions().catch((error) => {
      logger.error('Quest view expiry interval failed', error);
    });
  }, VIEW_SESSION_SWEEP_MS);

  if (typeof expiryInterval.unref === 'function') {
    expiryInterval.unref();
  }

  sweepExpiredViewSessions().catch((error) => {
    logger.error('Quest view initial expiry sweep failed', error);
  });

  logger.info(`Quest view expiry worker started (${VIEW_SESSION_SWEEP_MS / 1000}s interval)`);
}

module.exports = {
  startViewSessionExpiryWorker
};
