const AUDIT_KEY = 'bielenet_audit_log';
const MAX_AUDIT_LOGS = 1000;

const readAuditLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveAuditLogs = (logs) => {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(-MAX_AUDIT_LOGS)));
};

export const logAuditEvent = ({ action, entityType, entityId, actor = 'system', details = {}, severity = 'medium' }) => {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    actor,
    severity,
    details
  };

  const logs = readAuditLogs();
  logs.push(entry);
  saveAuditLogs(logs);
  return entry;
};

export const getAuditLogs = () => readAuditLogs();
