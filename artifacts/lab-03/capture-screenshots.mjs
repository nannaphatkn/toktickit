// artifacts/lab-03/capture-screenshots.mjs
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('artifacts/lab-03/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('📸 Capturing Lab 03 UI screenshots for submission PDF...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  // Part 5: Login & Password Change Flow
  console.log('--- Part 5: Login & Authentication ---');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login-screen.png') });
  console.log('  ✅ 01-login-screen.png');

  // Trigger login error
  await page.fill('#email', 'invalid@toktickit.com');
  await page.fill('#password', 'WrongPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Invalid email or password');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login-error.png') });
  console.log('  ✅ 02-login-error.png');

  // Login as Emily Davis (requires password change)
  console.log('--- Part 5: Mandatory Change Password ---');
  await page.fill('#email', 'emily.davis@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/change-password');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-change-password-screen.png') });
  console.log('  ✅ 03-change-password-screen.png');

  // Show weak password validation error
  await page.fill('#newPassword', 'short');
  await page.fill('#confirmPassword', 'short');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-change-password-validation.png') });
  console.log('  ✅ 04-change-password-validation.png');

  // Part 8: Requester Flow (Jennifer Anderson)
  console.log('--- Part 8: Requester Authenticated Identity ---');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.fill('#email', 'jennifer.anderson@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-requester-dashboard.png') });
  console.log('  ✅ 05-requester-dashboard.png');

  await page.goto(`${BASE_URL}/my-tickets`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-requester-my-tickets.png') });
  console.log('  ✅ 06-requester-my-tickets.png');

  await page.goto(`${BASE_URL}/create-ticket`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-requester-create-ticket.png') });
  console.log('  ✅ 07-requester-create-ticket.png');

  // Part 6: IT Staff Queue & Ticket Operations (Michael Brown)
  console.log('--- Part 6: IT Staff Queue & Detail ---');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.fill('#email', 'michael.brown@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/staff/queue');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08-itstaff-queue.png') });
  console.log('  ✅ 08-itstaff-queue.png');

  // Search in queue
  await page.fill('input[placeholder*="Search"]', 'battery');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09-itstaff-queue-filtered.png') });
  console.log('  ✅ 09-itstaff-queue-filtered.png');

  // Open ticket detail
  await page.goto(`${BASE_URL}/staff/tickets/1`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-itstaff-ticket-detail.png') });
  console.log('  ✅ 10-itstaff-ticket-detail.png');

  // Public comments tab
  const commentsTab = page.locator('button:has-text("Public Comments")');
  if (await commentsTab.isVisible()) {
    await commentsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-staff-public-comments.png') });
    console.log('  ✅ 11-staff-public-comments.png');
  }

  // Internal notes tab
  const notesTab = page.locator('button:has-text("Internal Notes")');
  if (await notesTab.isVisible()) {
    await notesTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12-staff-internal-notes.png') });
    console.log('  ✅ 12-staff-internal-notes.png');
  }

  // Part 7: Administrator User Management (John Smith)
  console.log('--- Part 7: Admin User Management ---');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.fill('#email', 'john.smith@toktickit.com');
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/users');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13-admin-user-management.png') });
  console.log('  ✅ 13-admin-user-management.png');

  // Open create user modal
  const createUserBtn = page.locator('button:has-text("Create New User")');
  if (await createUserBtn.first().isVisible()) {
    await createUserBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14-admin-create-user-modal.png') });
    console.log('  ✅ 14-admin-create-user-modal.png');
    // close modal
    await page.click('button:has-text("✕")');
    await page.waitForTimeout(400);
  }

  // Open reset password modal
  const resetBtn = page.locator('button:has-text("Reset Password")');
  if (await resetBtn.first().isVisible()) {
    await resetBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15-admin-reset-password-modal.png') });
    console.log('  ✅ 15-admin-reset-password-modal.png');
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(400);
  }

  // Part 9: Responsive Design
  console.log('--- Part 9: Responsive Viewports ---');
  await page.goto(`${BASE_URL}/staff/queue`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16-responsive-desktop-staff-queue.png') });
  console.log('  ✅ 16-responsive-desktop-staff-queue.png');

  // Tablet Viewport (768x1024)
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();
  // Transfer auth
  await tabletPage.goto(`${BASE_URL}/login`);
  await tabletPage.fill('#email', 'michael.brown@toktickit.com');
  await tabletPage.fill('#password', 'Password123!');
  await tabletPage.click('button[type="submit"]');
  await tabletPage.waitForURL('**/staff/queue');
  await tabletPage.waitForTimeout(600);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '17-responsive-tablet-staff-queue.png') });
  console.log('  ✅ 17-responsive-tablet-staff-queue.png');

  // Mobile Viewport (375x812)
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  // Transfer auth
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.fill('#email', 'michael.brown@toktickit.com');
  await mobilePage.fill('#password', 'Password123!');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/staff/queue');
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '18-responsive-mobile-staff-queue.png') });
  console.log('  ✅ 18-responsive-mobile-staff-queue.png');

  // Mobile Login
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.evaluate(() => localStorage.clear());
  await mobilePage.reload();
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '19-responsive-mobile-login.png') });
  console.log('  ✅ 19-responsive-mobile-login.png');

  // Mobile My Tickets
  await mobilePage.fill('#email', 'jennifer.anderson@toktickit.com');
  await mobilePage.fill('#password', 'Password123!');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL(`${BASE_URL}/`);
  await mobilePage.goto(`${BASE_URL}/my-tickets`);
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '20-responsive-mobile-my-tickets.png') });
  console.log('  ✅ 20-responsive-mobile-my-tickets.png');

  await browser.close();
  console.log('🎉 All Lab 03 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
  process.exit(1);
});
