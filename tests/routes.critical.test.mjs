import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routesSource = fs.readFileSync(new URL('../src/utils/routes.ts', import.meta.url), 'utf8');

const getRoute = (name) => {
  const match = routesSource.match(new RegExp(`${name}:\\s*'([^']+)'`));
  return match?.[1];
};

test('critical routes are mapped correctly', () => {
  assert.equal(getRoute('UserDetail'), '/users/detail');
  assert.equal(getRoute('BranchDetail'), '/branches/detail');
  assert.equal(getRoute('VVL'), '/vvl');
});
