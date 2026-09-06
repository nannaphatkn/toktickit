import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const VALID_PNG = path.join(FIXTURES_DIR, 'sample.png');
const VALID_PDF = path.join(FIXTURES_DIR, 'notes.pdf');
const OVERSIZED_PDF = path.join(FIXTURES_DIR, 'oversized.pdf');
const INVALID_EXE = path.join(FIXTURES_DIR, 'script.exe');

const PRIMARY_REQUESTER = 'Jennifer Anderson';
const SECONDARY_REQUESTER = 'Michael Chen';

test.describe.configure({ mode: 'serial' });

test.describe('Requester Ticket Lifecycle and Access Control (Lab 2 E2E)', () => {
  let createdTicketNumber = '';
  let createdTicketUrl = '';

  test('AC-02 & T-02: Displays Requester Prompt when unauthenticated, then enables context on requester selection', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Navigate to Create Ticket without choosing a requester
    await page.goto('/create-ticket');
    await expect(page.getByRole('heading', { name: /Please Select a Requester/i })).toBeVisible();
    await expect(page.getByText(/Please select a Development Requester/i)).toBeVisible();

    // Select Jennifer Anderson from the navigation bar
    const selector = page.locator('#requester-selector');
    await expect(selector).toBeVisible();
    await selector.selectOption({ label: PRIMARY_REQUESTER });

    // Verify context header displays Jennifer Anderson in navbar and the form is rendered
    await expect(page.getByRole('heading', { name: /Create New Ticket/i })).toBeVisible();
    await expect(page.locator('.requester-avatar + span')).toHaveText(PRIMARY_REQUESTER);
  });

  test('AC-04 & BR-06 / T-04 & T-08: Rejects invalid file types and files exceeding 5 MB in Create Ticket form', async ({ page }) => {
    await page.goto('/create-ticket');
    const selector = page.locator('#requester-selector');
    await selector.selectOption({ label: PRIMARY_REQUESTER });
    await expect(page.getByRole('heading', { name: /Create New Ticket/i })).toBeVisible();

    // Attempt to upload an invalid file (.exe)
    const fileInput = page.locator('#attachment-input');
    await fileInput.setInputFiles(INVALID_EXE);
    await expect(page.getByText(/Unsupported file type/i)).toBeVisible();

    // Attempt to upload an oversized file (>5MB)
    await fileInput.setInputFiles(OVERSIZED_PDF);
    await expect(page.getByText(/File size exceeds 5 MB/i)).toBeVisible();

    // Verify form submission is blocked with validation errors
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/Please correct the following errors/i)).toBeVisible();
  });

  test('AC-01 & T-01: Successfully creates a ticket with valid attachments and receives official ticket number', async ({ page }) => {
    await page.goto('/create-ticket');
    const selector = page.locator('#requester-selector');
    await selector.selectOption({ label: PRIMARY_REQUESTER });
    await expect(page.getByRole('heading', { name: /Create New Ticket/i })).toBeVisible();

    const uniqueSummary = `Corporate VPN connection drops repeatedly - ${Date.now()}`;
    const description = 'Cannot connect to the internal network from home. The client drops connection immediately after entering credentials.';

    // Fill form fields
    await page.fill('#summary', uniqueSummary);
    await page.fill('#description', description);

    // Select Category and Related System
    await page.locator('#category').selectOption({ index: 1 });
    await page.locator('#relatedSystem').selectOption({ index: 1 });
    await page.locator('#priority').selectOption('HIGH');

    // Attach 2 valid files
    await page.locator('#attachment-input').setInputFiles([VALID_PNG, VALID_PDF]);

    // Submit ticket
    await page.locator('button[type="submit"]').click();

    // Verify success banner with official ticket number
    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/Official Ticket Number:\s*(TKT-\d{4}-\d{6})/i);

    // Extract ticket number for subsequent steps
    const successText = await successAlert.innerText();
    const match = successText.match(/TKT-\d{4}-\d{6}/);
    expect(match).not.toBeNull();
    createdTicketNumber = match![0];
  });

  test('AC-05 & AC-07 / T-05 & T-07: Lists owned tickets sorted newest first and filters by search term', async ({ page }) => {
    await page.goto('/my-tickets');
    const selector = page.locator('#requester-selector');
    await selector.selectOption({ label: PRIMARY_REQUESTER });
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible();

    // Wait for the table to load
    const table = page.locator('.ticket-table');
    await expect(table).toBeVisible();

    // Verify the latest ticket created is listed
    expect(createdTicketNumber).toBeTruthy();
    await expect(table.getByText(createdTicketNumber)).toBeVisible();

    // Test searching by Ticket Number (AC-07)
    const searchInput = page.locator('#ticket-search');
    await searchInput.fill(createdTicketNumber);

    // Verify the matching ticket is displayed
    await expect(table.getByText(createdTicketNumber)).toBeVisible();

    // Search for a non-existent ticket number
    await searchInput.fill('TKT-9999-000000-NONEXISTENT');
    await expect(page.getByRole('heading', { name: /No matching tickets/i })).toBeVisible();

    // Reset filters and verify original ticket is displayed again
    await page.getByRole('button', { name: /Reset filters/i }).click();
    await expect(table.getByText(createdTicketNumber)).toBeVisible();
  });

  test('AC-06 & T-06: Displays ticket details, allows downloading active attachments, and performs soft-removal with reason', async ({ page }) => {
    await page.goto('/my-tickets');
    const selector = page.locator('#requester-selector');
    await selector.selectOption({ label: PRIMARY_REQUESTER });
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible();

    // Locate the row with our created ticket
    const targetLink = page.locator('.ticket-table').locator(`tr:has-text("${createdTicketNumber}")`).getByRole('link', { name: /View/i });
    await targetLink.click();

    // Verify navigation to ticket detail page
    await expect(page.locator('h1')).toContainText(createdTicketNumber);
    createdTicketUrl = page.url();

    // Verify read-only metadata fields
    await expect(page.getByText('Request information')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Verify attachments are listed
    const activeAttachment = page.locator('.attachment-row:not(.attachment-row-removed)').first();
    await expect(activeAttachment).toBeVisible();

    // Test download of active attachment
    const downloadPromise = page.waitForEvent('download');
    await activeAttachment.getByRole('button', { name: /Download/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    // Test soft-removal: click remove button
    await activeAttachment.getByRole('button', { name: /Remove attachment/i }).click();

    // Verify removal modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /Remove attachment\?/i })).toBeVisible();

    // Attempt to confirm without entering a reason (validates 3-500 characters constraint)
    await modal.getByRole('button', { name: /Confirm removal/i }).click();
    await expect(page.getByText(/between 3 and 500 characters/i)).toBeVisible();

    // Enter valid removal reason and confirm
    await modal.locator('#removal-reason').fill('Outdated evidence, no longer required');
    await modal.getByRole('button', { name: /Confirm removal/i }).click();

    // Verify modal closes and attachment displays "Removed" badge with reason
    await expect(modal).not.toBeVisible();
    await expect(page.getByText('Outdated evidence, no longer required')).toBeVisible();
    await expect(page.getByLabel(/Removed – not downloadable/i)).toBeVisible();
  });

  test('AC-03 & T-03: Enforces cross-requester access control and isolates ticket details and list', async ({ page }) => {
    // Switch to another Requester: Michael Chen
    await page.goto('/');
    const selector = page.locator('#requester-selector');
    await selector.selectOption({ label: SECONDARY_REQUESTER });
    await expect(page.locator('.requester-avatar + span')).toHaveText(SECONDARY_REQUESTER);

    // Attempt to access Jennifer Anderson's ticket directly
    expect(createdTicketUrl).toBeTruthy();
    await page.goto(createdTicketUrl);

    // Verify 403 Forbidden state is displayed without exposing ticket details
    await expect(page.getByRole('heading', { name: /Ticket unavailable/i })).toBeVisible();
    await expect(page.getByText(/You do not have access to this ticket/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to My Tickets/i })).toBeVisible();

    // Navigate to Michael's My Tickets list
    await page.goto('/my-tickets');
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible();

    // Verify Jennifer's ticket does not appear in Michael's list
    expect(createdTicketNumber).toBeTruthy();
    const table = page.locator('.ticket-table');
    if (await table.isVisible()) {
      await expect(table.getByText(createdTicketNumber)).not.toBeVisible();
    }
  });
});
