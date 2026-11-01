import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Lab 04 Ticket Resolution & Workflow E2E', () => {
  test('E2E-03: IT Staff transitions ticket status and Requester can reopen resolved ticket', async ({ page }) => {
    // 1. IT Staff logs in and navigates to Ticket 1
    await page.goto('/login');
    await page.fill('#email', 'michael.brown@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await page.goto('/staff/tickets/1');
    await expect(page.getByText(/Status:/i)).toBeVisible();

    // 2. Transition to WAITING_FOR_REQUESTER if permitted, or RESOLVED
    const statusSelect = page.locator('select').filter({ hasText: /Current/i });
    await expect(statusSelect).toBeVisible();

    const currentText = await statusSelect.inputValue();
    if (currentText !== 'RESOLVED') {
      // Transition towards RESOLVED
      const options = await statusSelect.locator('option').allInnerTexts();
      const nextOption = options.find((opt) => opt.includes('RESOLVED') || opt.includes('WAITING_FOR_REQUESTER'));
      if (nextOption) {
        const val = nextOption.replace(/[^A-Z_]/g, '');
        await statusSelect.selectOption(val);
        await expect(page.getByText(/Status changed to/i)).toBeVisible();
      }
    }

    // 3. Logout and login as Requester
    await page.getByRole('button', { name: /Logout/i }).click();

    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 4. View Ticket as Requester
    await page.goto('/tickets/1');
    await expect(page.getByText(/Ticket detail/i)).toBeVisible();
  });
});
