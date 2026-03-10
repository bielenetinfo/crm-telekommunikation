import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function assertIncludes(file, content, needle, description) {
  if (!content.includes(needle)) {
    throw new Error(`[FAIL] ${description} (${file})\\nMissing: ${needle}`);
  }
  console.log(`[PASS] ${description}`);
}

console.log('Running smoke tests...');

const app = read('src/App.jsx');
assertIncludes('src/App.jsx', app, 'path="users/detail"', 'Route /users/detail is configured');
assertIncludes('src/App.jsx', app, 'path="branches/detail"', 'Route /branches/detail is configured');
assertIncludes('src/App.jsx', app, 'if (!isAuthenticated)', 'PrivateRoute checks unauthenticated access');
assertIncludes('src/App.jsx', app, 'to="/login"', 'PrivateRoute redirects to /login');

const customerForm = read('src/components/customers/CustomerForm.jsx');
assertIncludes(
  'src/components/customers/CustomerForm.jsx',
  customerForm,
  'onSubmit(formData);',
  'Customer creation form submits payload via onSubmit'
);
assertIncludes(
  'src/components/customers/CustomerForm.jsx',
  customerForm,
  '{customer ? "Speichern" : "Kunde anlegen"}',
  'Customer creation CTA is present'
);

const contractForm = read('src/components/contracts/ContractForm.jsx');
assertIncludes(
  'src/components/contracts/ContractForm.jsx',
  contractForm,
  'onSubmit({',
  'Contract creation form submits payload via onSubmit'
);
assertIncludes(
  'src/components/contracts/ContractForm.jsx',
  contractForm,
  '{contract ? "Speichern" : "Vertrag anlegen"}',
  'Contract creation CTA is present'
);

console.log('All smoke tests passed.');
