const BACKUP_SCHEMA_VERSION = 1;

export const createBackupPayload = (dbJson, metadata = {}) => ({
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  source: 'bielenet-crm',
  metadata,
  db: dbJson
});

export const serializeBackupPayload = (payload) => JSON.stringify(payload, null, 2);

export const parseBackupPayload = (text) => {
  const payload = JSON.parse(text);

  if (!payload || payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('Nicht unterstützte Backup-Version.');
  }

  if (!payload.db || typeof payload.db !== 'object') {
    throw new Error('Backup enthält keine gültige Datenbank.');
  }

  return payload;
};

export const downloadBackupFile = (payload) => {
  const blob = new Blob([serializeBackupPayload(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bielenet_backup_${new Date().toISOString().slice(0, 16).replace(':', '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const restoreBackupPayload = (payload) => {
  localStorage.setItem('bielenet_db', JSON.stringify(payload.db));
  localStorage.setItem('bielenet_backup_last_restore', new Date().toISOString());
};
