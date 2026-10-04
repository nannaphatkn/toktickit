import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function loginAsStaff(page: any) {
  await page.goto('/login');
  await page.fill('#email', 'michael.brown@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/staff\/queue/);
}

test.describe('Lab 03 IT Staff Ticket Flow E2E', () => {
  test('E2E-07: IT Staff can view Ticket Queue with search and filters', async ({ page }) => {
    await loginAsStaff(page);

    await expect(page.getByRole('heading', { name: /ticket queue/i })).toBeVisible();

    // Search by keyword
    const searchInput = page.locator('#queue-search');
    if (await searchInput.isVisible()) {
      await searchInput.fill('battery');
      await page.waitForTimeout(500);
    }

    // Check filter dropdowns exist using label text
    await expect(page.getByLabel(/Status/i).first().or(page.locator('select').nth(1))).toBeVisible();
  });

  test('E2E-08: IT Staff can open a ticket detail from queue', async ({ page }) => {
    await loginAsStaff(page);

    // Click first ticket row or view button
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    await expect(page).toHaveURL(/\/staff\/tickets\/\d+/);
  });

  test('E2E-09: IT Staff can view Public Comments tab on ticket detail', async ({ page }) => {
    await loginAsStaff(page);

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/staff\/tickets\/\d+/);

    // Click Public Comments tab
    const commentsTab = page.getByRole('tab', { name: /public comments/i })
      .or(page.getByRole('button', { name: /public comments/i }));
    if (await commentsTab.isVisible()) {
      await commentsTab.click();
    }
    await expect(page.getByText(/public comments/i).first()).toBeVisible();
  });

  test('E2E-10: IT Staff can view Internal Notes tab on ticket detail', async ({ page }) => {
    await loginAsStaff(page);

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/staff\/tickets\/\d+/);

    // Click the Internal Notes tab button directly
    await page.getByRole('button', { name: /Internal Notes/i }).click();
    await expect(page.getByText(/internal notes/i).first()).toBeVisible();
    // Verify private operational notes warning text is visible after clicking the tab
    await expect(page.getByText(/Private operational notes visible ONLY/i)).toBeVisible();
  });

  test('E2E-11: Requester cannot access Internal Notes (UI hides the tab)', async ({ page }) => {
    // Login as Requester
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\//);

    // Go to Requester's own ticket detail
    await page.goto('/my-tickets');
    const firstRow = page.locator('table tbody tr').first()
      .or(page.locator('.ticket-table tr').first());
    if (await firstRow.isVisible()) {
      const viewLink = firstRow.getByRole('link', { name: /view/i });
      if (await viewLink.isVisible()) {
        await viewLink.click();
      }
    }

    // Internal Notes tab should NOT be visible for Requester
    const notesTab = page.getByRole('tab', { name: /internal notes/i })
      .or(page.getByRole('button', { name: /internal notes/i }));
    await expect(notesTab).not.toBeVisible();
  });
});
