# Lab 2 Test Plan and Results

## 1. Test Strategy
The testing strategy for Lab 2 follows a Test-Driven Development (TDD) approach, focusing on multiple layers to ensure robust functionality:
- **Unit Tests:** Verify individual functions (e.g., ticket number generation format).
- **API (Integration) Tests:** Verify REST endpoints, database interactions, request validation, and error handling using Supertest.
- **UI Component Tests:** Verify React component rendering, form states, input validation, and user interactions using React Testing Library.
- **E2E Tests:** Verify complete end-user workflows (e.g., creating a ticket and seeing it in the list) using Playwright.

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-01 | Ticket Number Generator | Returns string in format `TKT-YYYY-XXXXXX` | `server/src/utils/ticket-number.test.ts` | Pass |
| API-01 | API | AC-01, FR-03 | Create valid ticket | 201; one saved Ticket; number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-02 | API | AC-04, BR-06 | Create ticket with >5MB file | 400 Bad Request; validation error message | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-03 | API | AC-03, FR-10 | Get ticket not owned | 403 or 404; no data returned | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-04 | API | AC-05, FR-05 | Get paginated tickets | 200; list of tickets matching owner | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-05 | API | AC-06, FR-09 | Soft-remove attachment | 200; `isRemoved` true; file inaccessible | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| UI-01 | UI | AC-01, FR-03 | Submit valid form | Busy state on button; then success confirmation | `client/src/.../CreateTicket.test.tsx` | Pass |
| UI-02 | UI | AC-02, FR-01 | Access app without Requester | Redirect/show Requester Selection screen | `client/src/.../App.test.tsx` | Pass |
| UI-03 | UI | BR-04, FR-03 | Submit without Summary | Field message; API not called | `client/src/.../CreateTicket.test.tsx` | Pass |
| UI-04 | UI | AC-07, FR-06 | Search tickets by Summary | Table updates to show only matching tickets | `client/src/.../MyTickets.test.tsx` | Pass |
| UI-05 | UI | AC-06, FR-09 | Click remove on attachment | Confirmation dialog; then visual indication of removal | `client/src/.../RequesterTicketDetail.test.tsx` | Pass |
| E2E-01 | E2E | AC-01, AC-05 | Complete submission flow | Confirmation shows official number, appears in My Tickets | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |
| E2E-02 | E2E | FR-02, FR-05 | Switch Requester | My Tickets updates to show the new Requester's tickets | `e2e/lab-02/requester-switch.spec.ts` | Pass |

## 3. Acceptance-Criterion Traceability

| AC ID | Description | Covered by Tests |
|---|---|---|
| AC-01 | Valid ticket submission saves data and shows number | API-01, UI-01, E2E-01 |
| AC-02 | No Requester selected shows Selection screen | UI-02 |
| AC-03 | Accessing other's ticket is rejected | API-03 |
| AC-04 | >5MB file rejected | API-02 |
| AC-05 | My Tickets loads paginated owned tickets | API-04, E2E-01 |
| AC-06 | Soft-remove attachment works and blocks download | API-05, UI-05 |
| AC-07 | Search My Tickets by summary | UI-04 |

## 4. Responsive and Visual Checklist

- [ ] **Desktop (≥ 992px):** Multi-column form layouts, full table view for My Tickets.
- [ ] **Tablet (768-991px):** Two-column layouts where practical.
- [ ] **Mobile (< 768px):** Fields stack vertically, buttons are touch-friendly, list becomes card view, no horizontal scrolling.
- [ ] **Zen Green Theme:** Colors match `ui-spec.md` (Primary green `#006B3C`, Secondary `#0B7A46`, etc.).
- [ ] **Accessibility:** Focus indicators visible, labels on all inputs, appropriate aria-attributes for dynamic states.

## 5. Test Commands
- **Unit & API Tests:** `npm run test:api` (or `npm run test` in server directory)
- **UI Tests:** `npm run test:ui` (or `npm run test` in client directory)
- **E2E Tests:** `npx playwright test`

## 6. Final Results
*(To be filled during implementation phase after tests are executed)*

## 7. Known Limitations or Deferred Tests
- E2E testing of file uploads might require mock files in the testing environment.
- Responsive testing in Playwright will cover standard viewports, but manual visual inspection is still required for edge cases.
