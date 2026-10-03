import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Lab 03 Authentication E2E', () => {
  test('E2E-01a: Requester can login and is redirected to home dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\//);
    await expect(page.getByText(/Welcome, Jennifer Anderson/i)).toBeVisible();
  });

  test('E2E-01b: Invalid credentials shows error banner', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'WrongPassword!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test('E2E-01c: Inactive account shows error banner', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'kevin.patel@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText(/inactive/i)).toBeVisible();
  });

  test('E2E-02: IT Staff login is redirected to Staff Queue', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'michael.brown@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/staff\/queue/);
  });

  test('E2E-03: Admin login is redirected to User Management', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'john.smith@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('E2E-04: User with mustChangePassword is redirected to Change Password screen', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'emily.davis@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.getByText(/temporary initial password/i)).toBeVisible();
  });

  test('E2E-05: Unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/staff/queue');
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-06: Requester cannot access Staff Queue (redirected)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'jennifer.anderson@toktickit.com');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\//);

    await page.goto('/staff/queue');
    // Should be redirected away from staff queue
    await expect(page).not.toHaveURL(/\/staff\/queue/);
  });
});
