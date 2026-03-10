const CUSTOM_ID_PREFIX = 'quest';

function buildCustomId(scope, action, extra = '') {
  const parts = [CUSTOM_ID_PREFIX, scope, action];

  if (extra !== undefined && extra !== null && extra !== '') {
    parts.push(String(extra));
  }

  return parts.join(':');
}

function parseCustomId(customId) {
  if (!customId || typeof customId !== 'string') {
    return null;
  }

  const parts = customId.split(':');

  if (parts.length < 3 || parts[0] !== CUSTOM_ID_PREFIX) {
    return null;
  }

  return {
    prefix: parts[0],
    scope: parts[1],
    action: parts[2],
    extra: parts.length > 3 ? parts.slice(3).join(':') : null,
    raw: customId
  };
}

module.exports = {
  CUSTOM_ID_PREFIX,
  buildCustomId,
  parseCustomId
};
