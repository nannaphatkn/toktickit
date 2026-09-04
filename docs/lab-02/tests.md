# Lab 2 Phase 1 – Test Plan (`tests.md`)

## 1️⃣ Test Strategy Overview
- **Unit Tests** – Isolate each service / Prisma model function (e.g., `createTicket`, `listMyTickets`). Use **Vitest** with mocking of Prisma client.
- **API Integration Tests** – Use **Supertest** against the Express server. Verify request validation, response shape, status codes and soft‑delete behaviour.
- **UI Component Tests** – Use **React Testing Library** + **Vitest** for individual components (Requester selector, Ticket form, Ticket list, Ticket detail).
- **End‑to‑End (E2E) Tests** – Use **Playwright** (or Cypress) to exercise the full flow: select requester → create ticket with attachments → view ticket list → soft‑remove attachment → verify access control.

## 2️⃣ Test‑to‑Acceptance‑Criteria Traceability Matrix
| Test ID | Acceptance Criteria | Description | Expected Result |
|--------|----------------------|-------------|-----------------|
| **T‑01** | AC‑01 | POST `/api/tickets` with valid payload & 2 attachments | Returns **201** and `ticketNumber`; ticket persisted with 2 active attachments |
| **T‑02** | AC‑02 | Open Create Ticket page without selecting a requester | UI redirects to **Requester Selection** screen |
| **T‑03** | AC‑03 | GET `/api/tickets/:id` as Requester B for a ticket owned by Requester A | Returns **403 Forbidden** (or **404**) – ticket data not accessible |
| **T‑04** | AC‑04 | Upload attachment > 5 MB via form | UI shows validation error **"File size exceeds 5 MB"**; request rejected with **400** |
| **T‑05** | AC‑05 | GET `/api/tickets?page=1&size=10` for Requester A | Returns ≤ 10 tickets owned by A, sorted newest‑first |
| **T‑06** | AC‑06 | Click **Remove** on an active attachment in Ticket Detail | Attachment record `isRemoved=true`; subsequent download returns **404** |
| **T‑07** | AC‑07 | Search My Tickets with term matching ticket summary | API returns only tickets whose `summary` or `ticketNumber` contains the term |
| **T‑08** | BR‑06 (file‑type validation) | Try to upload a `.exe` file | UI shows **"Unsupported file type"**; API returns **415** |
| **T‑09** | UI – Loading / Empty states | Navigate to My Tickets when none exist | UI displays friendly empty‑state message with illustration |
| **T‑10** | Accessibility – Keyboard navigation | Tab through Create Ticket form fields | Focus order follows visual order, all controls reachable via keyboard |

## 3️⃣ Planned Test Files
| File | Purpose |
|------|---------|
| `tests/unit/ticket.service.test.ts` | Unit tests for Ticket service (creation, validation, soft‑delete) |
| `tests/api/ticket.routes.test.ts` | API integration tests for all ticket endpoints |
| `tests/ui/RequesterSelect.test.tsx` | Component test for Requester selector UI |
| `tests/ui/CreateTicketForm.test.tsx` | Form validation, attachment handling, error messages |
| `e2e/create‑ticket.spec.ts` | Full flow from Requester selection to ticket creation and verification |

## 4️⃣ Commands to Run Tests
```bash
# Unit + API tests (Vitest)
npm run test

# UI component tests (Vitest with React Testing Library)
npm run test:ui

# E2E tests (Playwright)
npm run test:e2e
```

---

*All tests are written **before** implementation (TDD). The failing test cycle will be visible in the CI log before the actual code is merged.*
