const AUDIT_LOG_KEY = 'bielenet_audit_log';

export function writeAuditLog(entry) {
  const payload = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...entry
  };

  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    logs.unshift(payload);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs.slice(0, 1000)));
  } catch (error) {
    console.error('[audit] failed to persist audit log', error);
  }

  console.info('[audit]', payload);
  return payload;
}

export function getAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}
