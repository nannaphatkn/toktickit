import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Lab 04 Actions Taken Flow E2E', () => {
  test('E2E-01: IT Staff can record and edit Actions Taken on ticket detail', async ({ page }) => {
    // 1. Login as IT Staff (Michael Brown)
    await page.goto('/login');
    await page.fill('#email', 'michael.brown@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/staff\/queue/);

    // 2. Open Ticket Detail for Ticket #1
    await page.goto('/staff/tickets/1');
    await expect(page.getByText(/Description & System Metadata/i)).toBeVisible();
    await expect(page.getByText(/Actions Taken/i)).toBeVisible();

    // 3. Click "Record Action"
    await page.getByRole('button', { name: /Record Action/i }).click();
    await expect(page.getByText(/Record New Action Taken/i)).toBeVisible();

    // 4. Fill form with follow-up required
    const testActionDesc = 'E2E Diagnostic: Cleaned heatsink and tested fan speeds.';
    const testResult = 'All fans operating at normal 2200 RPM.';
    const testFollowUpNote = 'Check temperature sensor in 48 hours.';

    await page.getByPlaceholder(/Detail the technical actions/i).fill(testActionDesc);
    await page.getByPlaceholder(/Observed result/i).fill(testResult);

    // Toggle follow-up
    await page.locator('input[type="checkbox"]').check();
    await expect(page.getByText(/Follow-Up Note/i)).toBeVisible();
    await page.getByPlaceholder(/Specify timeline, owner, or condition/i).fill(testFollowUpNote);

    // 5. Submit form
    await page.getByRole('button', { name: /Save Action/i }).click();

    // Verify success banner and action entry in list
    await expect(page.getByText(/New Action Taken recorded/i)).toBeVisible();
    await expect(page.getByText(testActionDesc)).toBeVisible();
    await expect(page.getByText(testResult)).toBeVisible();
    await expect(page.getByText(/Follow-Up Required/i).first()).toBeVisible();

    // 6. Edit Action
    await page.getByRole('button', { name: /Edit/i }).first().click();
    await expect(page.getByText(/Edit Action Taken/i)).toBeVisible();

    const updatedDesc = 'E2E Diagnostic: Cleaned heatsink, tested fans, and replaced thermal paste.';
    await page.getByPlaceholder(/Detail the technical actions/i).fill(updatedDesc);
    await page.getByRole('button', { name: /Update Action/i }).click();

    await expect(page.getByText(/Action Taken updated successfully/i)).toBeVisible();
    await expect(page.getByText(updatedDesc)).toBeVisible();
  });

  test('E2E-02: Requester sees Actions Taken in read-only mode without create/edit controls', async ({ page }) => {
    // 1. Login as Requester (Jennifer Anderson)
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Open Ticket #1 detail as Requester
    await page.goto('/tickets/1');
    await expect(page.getByText(/Ticket detail/i)).toBeVisible();

    // 3. Actions Taken section is visible in read-only mode
    await expect(page.getByText(/Actions Taken/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Record Action/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Edit/i })).not.toBeVisible();
  });
});
