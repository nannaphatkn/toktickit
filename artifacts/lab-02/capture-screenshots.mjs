// artifacts/lab-02/capture-screenshots.mjs
// Playwright script to capture ALL Lab 2 UI screenshots for submission PDF
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('artifacts/lab-02/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('📸 Capturing Lab 2 screenshots for submission PDF...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  // Part 5: Access Guard (No Requester)
  console.log('--- Part 5: Access Guard ---');
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-welcome-access-guard.png') });
  console.log('  ✅ 01-welcome-access-guard.png');

  // Select Jennifer Anderson (ID: 1)
  await page.selectOption('select', '1');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-dashboard-jennifer.png') });
  console.log('  ✅ 02-dashboard-jennifer.png');

  // Switch to Michael Chen (ID: 2)
  await page.selectOption('select', '2');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-dashboard-michael.png') });
  console.log('  ✅ 03-dashboard-michael.png');

  // Navbar close-up
  const navbar = await page.$('header, nav, div.bg-emerald-900, div:has-text("TokTickIT")');
  if (navbar) {
    await navbar.screenshot({ path: path.join(OUTPUT_DIR, '04-navbar-requester-context.png') });
    console.log('  ✅ 04-navbar-requester-context.png');
  }

  // Part 5-6: Create Ticket
  console.log('--- Part 5-6: Create Ticket ---');
  await page.selectOption('select', '1'); // Back to Jennifer
  await page.click('text=Create Ticket');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-create-ticket-empty.png') });
  console.log('  ✅ 05-create-ticket-empty.png');

  // Trigger Validation errors
  const submitBtn = await page.$('button[type="submit"], button:has-text("Submit Ticket")');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(500);
  }
  await page.fill('input[placeholder*="summary"], input[name="summary"]', 'Short');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-create-ticket-validation.png') });
  console.log('  ✅ 06-create-ticket-validation.png');

  // Part 7: My Tickets
  console.log('--- Part 7: My Tickets ---');
  await page.click('text=My Tickets');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-my-tickets-jennifer.png') });
  console.log('  ✅ 07-my-tickets-jennifer.png');

  // Switch to David Kim (ID: 4)
  await page.selectOption('select', '4');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08-my-tickets-david.png') });
  console.log('  ✅ 08-my-tickets-david.png');

  // Search & Filter in My Tickets
  const searchInput = await page.$('#ticket-search');
  if (searchInput) {
    await searchInput.fill('VPN');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-my-tickets-search-filter.png') });
    console.log('  ✅ 09-my-tickets-search-filter.png');
  }

  // Part 8: Ticket Detail
  console.log('--- Part 8: Ticket Detail ---');
  await page.goto(`${BASE_URL}/tickets/1`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-ticket-detail.png') });
  console.log('  ✅ 10-ticket-detail.png');

  // Part 9: Tablet Context (768x1024)
  console.log('--- Part 9: Tablet Views ---');
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(BASE_URL);
  await tabletPage.selectOption('select', '1');
  await tabletPage.waitForTimeout(500);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '11-responsive-tablet-dashboard.png') });
  console.log('  ✅ 11-responsive-tablet-dashboard.png');

  await tabletPage.click('text=My Tickets');
  await tabletPage.waitForTimeout(500);
  await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, '12-responsive-tablet-my-tickets.png') });
  console.log('  ✅ 12-responsive-tablet-my-tickets.png');

  // Mobile Context (375x812)
  console.log('--- Part 9: Mobile Views ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL);
  await mobilePage.selectOption('select', '1');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '13-responsive-mobile-dashboard.png') });
  console.log('  ✅ 13-responsive-mobile-dashboard.png');

  await mobilePage.click('text=My Tickets');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '14-responsive-mobile-my-tickets.png') });
  console.log('  ✅ 14-responsive-mobile-my-tickets.png');

  await mobilePage.click('text=Create Ticket');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '15-responsive-mobile-create-ticket.png') });
  console.log('  ✅ 15-responsive-mobile-create-ticket.png');

  await browser.close();
  console.log('🎉 All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
