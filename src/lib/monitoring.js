const MONITORING_KEY = 'crm_monitoring_events';
const MAX_EVENTS = 200;

const appendEvent = (payload) => {
  try {
    const existing = JSON.parse(localStorage.getItem(MONITORING_KEY) || '[]');
    existing.push(payload);
    const trimmed = existing.slice(-MAX_EVENTS);
    localStorage.setItem(MONITORING_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[monitoring] Could not persist event', error);
  }
};

export const logMonitoringEvent = (type, data = {}) => {
  const event = {
    type,
    data,
    timestamp: new Date().toISOString(),
    path: window.location.pathname + window.location.search
  };

  console.info('[monitoring]', event);
  appendEvent(event);
};

export const setupMonitoring = () => {
  window.addEventListener('error', (event) => {
    logMonitoringEvent('window.error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logMonitoringEvent('window.unhandledrejection', {
      reason: String(event.reason)
    });
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      logMonitoringEvent('session.resume');
    }
  });

  logMonitoringEvent('app.boot');
};
