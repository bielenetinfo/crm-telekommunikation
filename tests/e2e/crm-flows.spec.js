import { test, expect } from 'playwright/test';

const seedDatabase = async (page) => {
  const seed = {
    users: [
      {
        id: 'u1',
        email: 'admin@bielenet.de',
        password: '$2b$10$Ymo2R2w8hEtB0aNTDhYhXu0GYxLe7fRA6fQ0RhM4jQoTP0TOxR2xG',
        role: 'admin',
        name: 'Can Arslan',
        twoFactorSecret: null,
      },
    ],
    customers: [],
    contracts: [],
    vvlRecords: [],
    reminders: [],
    followups: [],
    activities: [],
    customerHistory: [],
    tasks: [],
    branches: [{ id: 'branch-e2e', name: 'E2E Filiale' }],
    providers: [{ id: 'provider-e2e', name: 'Telekom E2E' }],
    hardware: [],
  };

  await page.addInitScript((db) => {
    localStorage.setItem('bielenet_db_version', '2');
    localStorage.setItem('bielenet_db', JSON.stringify(db));
    localStorage.removeItem('bielenet_auth');
  }, seed);
};

const login = async (page) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page).toHaveURL('/');
};

test('Login, Kunde anlegen und Vertrag erstellen', async ({ page }) => {
  await seedDatabase(page);
  await login(page);

  const runId = Date.now();
  const firstName = `E2E${runId}`;
  const lastName = 'Kunde';
  const customerDisplayName = `${firstName} ${lastName}`;
  const contractNumber = `E2E-${runId}`;

  await page.goto('/customers/detail?new=true');
  await page.getByRole('heading', { name: 'Privatkunde' }).click();

  await page.locator('input[name="first_name"]').fill(firstName);
  await page.locator('input[name="last_name"]').fill(lastName);
  await page.locator('input[name="phone"]').fill('017612345678');
  await page.getByRole('button', { name: 'Weiter' }).click();

  await expect(page).toHaveURL(/\/customers\/detail\?id=.*step=dsgvo/);

  await page.goto('/contracts/detail?new=true');

  await page.locator('#customer_id').click();
  await page.getByRole('option', { name: customerDisplayName }).click();

  await page.getByText('Provider wählen...').click();
  await page.getByRole('option', { name: 'Telekom E2E' }).click();

  await page.locator('input[name="start_date"]').fill('2026-01-01');
  await page.locator('input[name="contract_number"]').fill(contractNumber);

  await page.getByRole('button', { name: 'Erstellen' }).click();

  await expect(page).toHaveURL(/\/contracts\/detail\?id=.*/);

  await page.goto('/contracts');
  await expect(page.getByText(contractNumber)).toBeVisible();
});
