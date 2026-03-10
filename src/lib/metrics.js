const METRICS_KEY = 'bielenet_metrics';

const defaultMetrics = {
  api: { total: 0, errors: 0, responseTimes: [] },
  auth: { failedLogins: [] },
  lastUpdatedAt: null
};

const readMetrics = () => {
  try {
    return { ...defaultMetrics, ...JSON.parse(localStorage.getItem(METRICS_KEY) || '{}') };
  } catch {
    return structuredClone(defaultMetrics);
  }
};

const writeMetrics = (metrics) => {
  metrics.lastUpdatedAt = new Date().toISOString();
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
};

export const recordApiMetric = ({ durationMs, ok }) => {
  const metrics = readMetrics();
  metrics.api.total += 1;
  if (!ok) metrics.api.errors += 1;
  metrics.api.responseTimes = [...(metrics.api.responseTimes || []), durationMs].slice(-500);
  writeMetrics(metrics);
};

export const recordFailedLoginMetric = () => {
  const metrics = readMetrics();
  metrics.auth.failedLogins = [...(metrics.auth.failedLogins || []), Date.now()].slice(-500);
  writeMetrics(metrics);
};

export const getHealthSummary = () => {
  const metrics = readMetrics();
  const apiErrorRate = metrics.api.total === 0 ? 0 : metrics.api.errors / metrics.api.total;
  const avgResponseTimeMs = metrics.api.responseTimes.length
    ? Math.round(metrics.api.responseTimes.reduce((a, b) => a + b, 0) / metrics.api.responseTimes.length)
    : 0;
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const failedLogins24h = (metrics.auth.failedLogins || []).filter((ts) => ts >= dayAgo).length;

  const status = apiErrorRate > 0.1 || failedLogins24h > 20 ? 'degraded' : 'ok';

  return {
    status,
    apiErrorRate,
    avgResponseTimeMs,
    failedLogins24h,
    totalApiCalls: metrics.api.total,
    lastUpdatedAt: metrics.lastUpdatedAt
  };
};
