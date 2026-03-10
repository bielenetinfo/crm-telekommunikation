const metrics = {
  frontendErrors: 0,
  apiCalls: 0,
  apiErrors: 0,
  apiLatencyMs: [],
  webVitals: {}
};

function saveSnapshot() {
  localStorage.setItem('bielenet_monitoring_metrics', JSON.stringify({
    ...metrics,
    apiErrorRate: metrics.apiCalls ? metrics.apiErrors / metrics.apiCalls : 0,
    updatedAt: new Date().toISOString()
  }));
}

export function recordFrontendError(source, error) {
  metrics.frontendErrors += 1;
  console.error(`[monitoring][${source}]`, error);
  saveSnapshot();
}

export function trackApiResult(path, startedAt, hasError = false) {
  metrics.apiCalls += 1;
  if (hasError) {
    metrics.apiErrors += 1;
  }
  metrics.apiLatencyMs.push(Date.now() - startedAt);
  if (metrics.apiLatencyMs.length > 250) {
    metrics.apiLatencyMs.shift();
  }

  console.info('[monitoring][api]', {
    path,
    hasError,
    latencyMs: Date.now() - startedAt,
    errorRate: metrics.apiCalls ? metrics.apiErrors / metrics.apiCalls : 0
  });

  saveSnapshot();
}

export function createMonitoredClient(client) {
  const wrap = (obj, path = 'base44') => new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      const nextPath = `${path}.${String(prop)}`;

      if (typeof value === 'function') {
        return async (...args) => {
          const startedAt = Date.now();
          try {
            const result = await value.apply(target, args);
            trackApiResult(nextPath, startedAt, false);
            return result;
          } catch (error) {
            trackApiResult(nextPath, startedAt, true);
            throw error;
          }
        };
      }

      if (value && typeof value === 'object') {
        return wrap(value, nextPath);
      }

      return value;
    }
  });

  return wrap(client);
}

export function initMonitoring() {
  window.addEventListener('error', (event) => {
    recordFrontendError('window.error', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    recordFrontendError('window.unhandledrejection', event.reason);
  });

  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.webVitals[entry.name] = entry.value || entry.duration;
      }
      saveSnapshot();
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('[monitoring] PerformanceObserver partial support', error);
    }
  }
}
