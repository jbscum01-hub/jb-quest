function formatNow() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  const method = level === 'info' ? 'log' : level;

  if (meta) {
    console[method](`[${formatNow()}] [${level.toUpperCase()}] ${message}`, meta);
    return;
  }

  console[method](`[${formatNow()}] [${level.toUpperCase()}] ${message}`);
}

const logger = {
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  }
};

module.exports = {
  logger
};
