import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Lab 04 Dashboards E2E', () => {
  test('E2E-04a: IT Staff Dashboard displays metric cards, status breakdown, and drills down to queue', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'michael.brown@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/staff\/queue/);

    // Navigate to Staff Dashboard
    await page.goto('/staff/dashboard');
    await expect(page.getByText(/IT Staff Service Operations Dashboard/i)).toBeVisible();

    // Verify 4 metric cards
    await expect(page.getByText('Unassigned', { exact: true })).toBeVisible();
    await expect(page.getByText('My Assigned')).toBeVisible();
    await expect(page.getByText('Open / In Progress')).toBeVisible();
    await expect(page.getByText('Urgent Priority')).toBeVisible();

    // Verify Status Breakdown section
    await expect(page.getByText(/Ticket Status Breakdown/i)).toBeVisible();

    // Drill-down link click: Click Unassigned card
    await page.getByText('Unassigned', { exact: true }).click();
    await expect(page).toHaveURL(/owner=unassigned/);
  });

  test('E2E-04b: Requester Dashboard displays scoped metrics and recent tickets', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/(dashboard)?$/);

    // Navigate to Requester Dashboard
    await page.goto('/dashboard');
    await expect(page.getByText(/My Support Requests Dashboard/i)).toBeVisible();

    // Verify 4 Requester metric cards
    await expect(page.getByText('Open Tickets', { exact: true })).toBeVisible();
    await expect(page.getByText('Waiting for You', { exact: true })).toBeVisible();
    await expect(page.getByText('Recently Updated', { exact: true })).toBeVisible();
    await expect(page.getByText('Recently Resolved', { exact: true })).toBeVisible();

    // Drill down to My Tickets
    await page.getByText('Open Tickets').click();
    await expect(page).toHaveURL(/\/my-tickets/);
  });

  test('E2E-04c: Mobile responsiveness at 375px viewport (no horizontal overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.fill('#email', 'michael.brown@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/staff\/queue/);

    await page.goto('/staff/dashboard');
    await expect(page.getByText(/Service Operations Dashboard/i)).toBeVisible();

    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
