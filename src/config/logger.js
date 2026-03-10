function formatNow() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  if (meta) {
    console[level](`[${formatNow()}] [${level.toUpperCase()}] ${message}`, meta);
    return;
  }

  console[level](`[${formatNow()}] [${level.toUpperCase()}] ${message}`);
}

const logger = {
  info(message, meta) {
    log('log', message, meta);
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
