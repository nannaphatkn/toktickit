
// artifacts/lab-04/capture-screenshots.mjs
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('artifacts/lab-04/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('📸 Capturing Lab 04 UI screenshots for submission PDF...');
  const browser = await chromium.launch({ headless: true });

  // Context 1: Desktop Context (1280x800)
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await desktop.newPage();

  // Helper login
  async function loginAs(email, password = 'Password123!') {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
  }

  // 1. IT Staff Dashboard Desktop
  console.log('--- IT Staff Dashboard ---');
  await loginAs('michael.brown@toktickit.com');
  await page.goto(`${BASE_URL}/staff/dashboard`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-itstaff-dashboard-desktop.png') });
  console.log('  ✅ 01-itstaff-dashboard-desktop.png');

  // Drill-down from Staff Dashboard
  await page.getByText('Unassigned', { exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '17-drilldown-staff-queue.png') });
  console.log('  ✅ 17-drilldown-staff-queue.png');

  // 2. Requester Dashboard Desktop
  console.log('--- Requester Dashboard ---');
  await loginAs('jennifer.anderson@toktickit.com');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-requester-dashboard-desktop.png') });
  console.log('  ✅ 04-requester-dashboard-desktop.png');

  // 3. Actions Taken on Ticket Detail (IT Staff View)
  console.log('--- Actions Taken UI ---');
  await loginAs('michael.brown@toktickit.com');
  await page.goto(`${BASE_URL}/staff/tickets/1`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-actions-taken-list.png') });
  console.log('  ✅ 07-actions-taken-list.png');

  // Status & Priority Selectors
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '11-ticket-status-workflow.png'),
  });
  console.log('  ✅ 11-ticket-status-workflow.png');

  // Open "Record Action" Form
  const recordBtn = page.getByRole('button', { name: /Record Action/i });
  if (await recordBtn.isVisible()) {
    await recordBtn.click();
    await page.waitForTimeout(400);
    // Fill sample and check follow-up to show all fields
    await page.getByPlaceholder(/Detail the technical actions/i).fill('Inspected power delivery subsystem and measured capacitor load under synthetic stress.');
    await page.getByPlaceholder(/Observed result/i).fill('Transient voltage ripple within nominal range. Battery wear indicator confirms 62% state of health.');
    await page.locator('input[type="checkbox"]').check({ force: true });
    await page.waitForTimeout(300);
    await page.getByPlaceholder(/Specify timeline, owner, or condition/i).fill('Coordinate with warehouse for OEM replacement pack delivery.');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-actions-taken-create-modal.png') });
    console.log('  ✅ 08-actions-taken-create-modal.png');
    // Save to create an action
    await page.getByRole('button', { name: /Save Action/i }).click();
    await page.waitForTimeout(800);
  }

  // Open "Edit Action" Form on the newly created or first action
  const editBtn = page.getByRole('button', { name: /Edit/i }).first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-actions-taken-edit-modal.png') });
    console.log('  ✅ 09-actions-taken-edit-modal.png');
    await page.getByRole('button', { name: /Cancel/i }).first().click();
    await page.waitForTimeout(300);
  }

  // 4. Requester View of Ticket Detail (Read-Only Actions Taken)
  console.log('--- Requester Read-Only Actions Taken ---');
  await loginAs('jennifer.anderson@toktickit.com');
  await page.goto(`${BASE_URL}/tickets/1`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-actions-taken-requester-readonly.png') });
  console.log('  ✅ 10-actions-taken-requester-readonly.png');

  // 5. Tablet Context (768x1024)
  console.log('--- Tablet Views ---');
  const tablet = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tablet.newPage();

  // IT Staff Tablet
  await tabletPage.goto(`${BASE_URL}/login`);
  await tabletPage.fill('#email', 'michael.brown@toktickit.com');
  await tabletPage.fill('#password', 'Password123!');
  await tabletPage.click('button[type="submit"]');
  await tabletPage.waitForTimeout(600);
  await tabletPage.goto(`${BASE_URL}/staff/dashboard`);
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '02-itstaff-dashboard-tablet.png') });
  console.log('  ✅ 02-itstaff-dashboard-tablet.png');

  // Requester Tablet
  await tabletPage.goto(`${BASE_URL}/login`);
  await tabletPage.evaluate(() => localStorage.clear());
  await tabletPage.fill('#email', 'jennifer.anderson@toktickit.com');
  await tabletPage.fill('#password', 'Password123!');
  await tabletPage.click('button[type="submit"]');
  await tabletPage.waitForTimeout(600);
  await tabletPage.goto(`${BASE_URL}/dashboard`);
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '05-requester-dashboard-tablet.png') });
  console.log('  ✅ 05-requester-dashboard-tablet.png');

  // 6. Mobile Context (375x667)
  console.log('--- Mobile Views ---');
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobile.newPage();

  // IT Staff Mobile
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.fill('#email', 'michael.brown@toktickit.com');
  await mobilePage.fill('#password', 'Password123!');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForTimeout(600);
  await mobilePage.goto(`${BASE_URL}/staff/dashboard`);
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '03-itstaff-dashboard-mobile.png') });
  console.log('  ✅ 03-itstaff-dashboard-mobile.png');

  // Requester Mobile
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.evaluate(() => localStorage.clear());
  await mobilePage.fill('#email', 'jennifer.anderson@toktickit.com');
  await mobilePage.fill('#password', 'Password123!');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForTimeout(600);
  await mobilePage.goto(`${BASE_URL}/dashboard`);
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '06-requester-dashboard-mobile.png') });
  console.log('  ✅ 06-requester-dashboard-mobile.png');

  // 7. Regression Evidence Screens
  console.log('--- Regression Evidence Screens ---');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13-regression-login.png') });
  console.log('  ✅ 13-regression-login.png');

  // My Tickets
  await loginAs('jennifer.anderson@toktickit.com');
  await page.goto(`${BASE_URL}/my-tickets`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14-regression-my-tickets.png') });
  console.log('  ✅ 14-regression-my-tickets.png');

  // Staff Queue
  await loginAs('michael.brown@toktickit.com');
  await page.goto(`${BASE_URL}/staff/queue`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15-regression-staff-queue.png') });
  console.log('  ✅ 15-regression-staff-queue.png');

  // Admin User Management
  await loginAs('admin@toktickit.com');
  await page.goto(`${BASE_URL}/admin/users`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16-regression-admin-users.png') });
  console.log('  ✅ 16-regression-admin-users.png');

  await browser.close();
  console.log('🎉 All Lab 04 screenshots successfully captured in:', OUTPUT_DIR);
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
