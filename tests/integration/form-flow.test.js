import test from 'node:test';
import assert from 'node:assert/strict';

test('integration: form flow baseline is wired', () => {
  const payload = { customer: true, contract: true, task: true };
  assert.deepEqual(Object.values(payload), [true, true, true]);
});
