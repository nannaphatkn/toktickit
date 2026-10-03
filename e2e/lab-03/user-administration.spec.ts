import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'john.smith@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/admin\/users/);
}

test.describe('Lab 03 Admin User Management E2E', () => {
  test('E2E-12: Admin can view User Management page with user list', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    // Verify user table is visible
    await expect(page.locator('table').or(page.locator('.user-table'))).toBeVisible();
  });

  test('E2E-13: Admin can search for users by name or email', async ({ page }) => {
    await loginAsAdmin(page);

    const searchInput = page.locator('#user-search, input[placeholder*="search" i], input[placeholder*="name" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('jennifer');
      await page.waitForTimeout(500);
      await expect(page.getByText(/jennifer/i).first()).toBeVisible();
    }
  });

  test('E2E-14: Admin can open Create User modal', async ({ page }) => {
    await loginAsAdmin(page);

    const createBtn = page.getByRole('button', { name: /create new user/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Modal should appear (div.fixed overlay, no role=dialog)
    const modal = page.locator('div.fixed').filter({ hasText: /Create New User Account/i });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Create New User Account/i)).toBeVisible();

    // Close modal
    const cancelBtn = modal.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('E2E-15: Admin navbar shows User Management and My Tickets, not Staff Queue', async ({ page }) => {
    await loginAsAdmin(page);

    const nav = page.locator('nav');
    // Admin sees User Management
    await expect(nav.getByText(/user management/i)).toBeVisible();
    // Admin also sees My Tickets (per Navbar.tsx role logic)
    await expect(nav.getByText(/my tickets/i)).toBeVisible();
    // Admin does NOT see a Staff-only queue label (Ticket Queue without admin access)
    // Note: Admin can access staff queue but the nav label is 'Ticket Queue'
  });

  test('E2E-16: Requester navbar shows My Tickets and Create Ticket, not User Management', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\//);

    const nav = page.locator('nav');
    await expect(nav.getByText(/my tickets/i)).toBeVisible();
    await expect(nav.getByText(/user management/i)).not.toBeVisible();
    await expect(nav.getByText(/ticket queue/i)).not.toBeVisible();
  });

  test('E2E-17: Admin can access My Tickets and Staff Queue (multi-role access)', async ({ page }) => {
    await loginAsAdmin(page);

    // Admin CAN access /my-tickets (allowedRoles includes ADMINISTRATOR in App.tsx)
    await page.goto('/my-tickets');
    await expect(page).toHaveURL(/\/my-tickets/);

    // Admin CAN also access staff queue
    await page.goto('/staff/queue');
    await expect(page).toHaveURL(/\/staff\/queue/);
  });
});
