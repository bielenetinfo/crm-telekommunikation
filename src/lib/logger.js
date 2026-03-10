const LOG_STORAGE_KEY = 'bielenet_error_log';
const MAX_LOG_ITEMS = 200;

const readLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const persistLogs = (entries) => {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries.slice(-MAX_LOG_ITEMS)));
};

const normalizeError = (error) => ({
  name: error?.name || 'Error',
  message: error?.message || String(error),
  stack: error?.stack || null
});

export const logError = ({ source = 'app', error, context = {} }) => {
  const payload = {
    id: crypto.randomUUID(),
    type: 'error',
    source,
    timestamp: new Date().toISOString(),
    error: normalizeError(error),
    context
  };

  const logs = readLogs();
  logs.push(payload);
  persistLogs(logs);

  console.error(`[${source}]`, payload.error.message, payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/client-error', blob);
  }

  return payload;
};

export const getErrorLogs = () => readLogs();
