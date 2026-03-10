import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessRoute, canAccessAction, ACTION_PERMISSIONS, ROLES } from './security.js';

test('admin has route + delete/export permissions', () => {
  const admin = { role: ROLES.ADMIN };
  assert.equal(canAccessRoute(admin, '/users'), true);
  assert.equal(canAccessRoute(admin, '/backup'), true);
  assert.equal(canAccessAction(admin, ACTION_PERMISSIONS.delete), true);
  assert.equal(canAccessAction(admin, ACTION_PERMISSIONS.export), true);
});

test('agent has customer route access but no delete/export/user-management', () => {
  const agent = { role: ROLES.AGENT };
  assert.equal(canAccessRoute(agent, '/customers'), true);
  assert.equal(canAccessRoute(agent, '/users'), false);
  assert.equal(canAccessAction(agent, ACTION_PERMISSIONS.delete), false);
  assert.equal(canAccessAction(agent, ACTION_PERMISSIONS.export), false);
  assert.equal(canAccessAction(agent, ACTION_PERMISSIONS.userManagement), false);
});

test('viewer can open read routes but cannot change contract status', () => {
  const viewer = { role: ROLES.VIEWER };
  assert.equal(canAccessRoute(viewer, '/contracts'), true);
  assert.equal(canAccessRoute(viewer, '/providers'), false);
  assert.equal(canAccessAction(viewer, ACTION_PERMISSIONS.contractStatusChange), false);
});
