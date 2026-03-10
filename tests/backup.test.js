import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackupPayload, parseBackupPayload, serializeBackupPayload } from '../src/lib/backup.js';

test('create + parse backup payload roundtrip', () => {
  const payload = createBackupPayload({ customers: [{ id: 'c1' }] }, { actor: 'test' });
  const serialized = serializeBackupPayload(payload);
  const parsed = parseBackupPayload(serialized);

  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.metadata.actor, 'test');
  assert.equal(parsed.db.customers[0].id, 'c1');
});

test('parse rejects unsupported schema', () => {
  assert.throws(() => parseBackupPayload(JSON.stringify({ schemaVersion: 999, db: {} })), /Nicht unterstützte Backup-Version/);
});
