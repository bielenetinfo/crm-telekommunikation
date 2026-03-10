import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appFile = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const loginPageFile = readFileSync(new URL('../src/pages/LoginPage.jsx', import.meta.url), 'utf8');
const customersPageFile = readFileSync(new URL('../src/pages/Customers.jsx', import.meta.url), 'utf8');
const customerDetailPageFile = readFileSync(new URL('../src/pages/CustomerDetail.jsx', import.meta.url), 'utf8');

test('smoke: login flow is reachable and redirects to dashboard', () => {
  assert.match(appFile, /<Route path="\/login" element={<LoginPage \/>} \/>/);
  assert.match(loginPageFile, /const \{ login, verify2FA \} = useAuth\(\);/);
  assert.match(loginPageFile, /navigate\('\/'\)/);
});

test('smoke: customer list route exists', () => {
  assert.match(appFile, /<Route path="customers" element={<Customers \/>} \/>/);
  assert.match(customersPageFile, /h1 className="app-page-title">\s*\n\s*Kunden/);
});

test('smoke: customer detail navigation from list exists', () => {
  assert.match(customersPageFile, /navigate\(`\$\{createPageUrl\('CustomerDetail'\)\}\?id=\$\{customer.id\}`\)/);
});

test('smoke: contract detail navigation from customer detail exists', () => {
  assert.match(customerDetailPageFile, /navigate\(`\$\{createPageUrl\('ContractDetail'\)\}\?id=\$\{contract.id\}`\)/);
});
