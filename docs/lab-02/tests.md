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
| **T‑04** | AC‑04 | Upload attachment > 5 MB via form | UI shows an inline size validation error; request rejected with **400** |
| **T‑05** | AC‑05 | GET `/api/tickets?page=1&size=10` for Requester A | Returns ≤ 10 tickets owned by A, sorted newest‑first |
| **T‑06** | AC‑06 | Click **Remove** on an active attachment in Ticket Detail | Attachment record `isRemoved=true`; subsequent download returns **410 Gone** |
| **T‑07** | AC‑07 | Search My Tickets with term matching ticket summary | API returns only tickets whose `summary` or `ticketNumber` contains the term |
| **T‑08** | BR‑06 (file‑type validation) | Try to upload a `.exe` file | UI shows an inline unsupported-type error; API returns **400** |
| **T‑09** | UI – Loading / Empty states | Navigate to My Tickets when none exist | UI displays friendly empty‑state message with illustration |
| **T‑10** | Accessibility – Keyboard navigation | Tab through Create Ticket form fields | Focus order follows visual order, all controls reachable via keyboard |

## 2b️⃣ Business Rule → Test Case Traceability Matrix

| Business Rule | Description | Covered By |
|---|---|---|
| **BR-01** | Ticket Number is unique and auto-generated as `TKT-YYYY-XXXXXX` | `tickets.test.ts` (TC: creates ticket with unique number); `e2e/requester-ticket-flow.spec.ts` (AC-01 verifies `TKT-\d{4}-\d{6}` pattern) |
| **BR-02** | New Ticket starts with status `NEW` | `tickets.test.ts` (TC: verifies `currentStatus: NEW` on creation); `my-tickets.api.test.ts` (seed data confirms NEW status) |
| **BR-03** | Lab 2 uses Development Requester selector (not real auth) | `App.test.tsx` (TC: renders RequesterSelector); `e2e/requester-ticket-flow.spec.ts` (AC-02 selects requester from dropdown) |
| **BR-04** | Summary required: 10–150 characters | `tickets.test.ts` (TC: rejects summary < 10 and > 150 chars); `CreateTicket.test.tsx` (inline validation error) |
| **BR-05** | Description required: 20–1000 characters | `tickets.test.ts` (TC: rejects description < 20 and > 1000 chars); `CreateTicket.test.tsx` (inline validation error) |
| **BR-06** | Attachments: JPG/PNG/WEBP/PDF only, ≤ 5 MB per file | `attachments.api.test.ts` (TC: unsupported type → 400, oversized → 400); `e2e` (T-04 & T-08: validates `.exe` and oversized PDF) |
| **BR-07** | Maximum 5 active attachments per Ticket | `attachments.api.test.ts` (TC: 6th upload rejected with 400 ATTACHMENT_LIMIT); `tickets.test.ts` (TC: rollback if over limit) |
| **BR-08** | Attachment removal = soft-remove only (metadata kept, file marked) | `attachments.api.test.ts` (TC: DELETE sets `isRemoved=true`, `removedAt` and `removalReason`); `ticket-detail.api.test.ts` (TC: verifies flags) |
| **BR-09** | Removed files are not downloadable | `attachments.api.test.ts` (TC: GET `/download` on removed attachment → **410 Gone**); `e2e` (T-06 verifies badge shown) |
| **BR-10** | Only active Requesters can be selected | `RequesterSelector.tsx` filters `isActive:true`; `requireActiveRequester.ts` middleware returns 401 for inactive; `requesters.test.ts` |
| **BR-11** | Attachment upload failure must rollback ticket creation | `tickets.test.ts` (TC: simulates write failure → ticket not persisted); transaction logic in `ticketRoutes.ts` |

## 3️⃣ Implemented Test Files
| File | Purpose |
|------|---------|
| `server/tests/tickets.test.ts` | Ticket creation and initial attachment validation/rollback |
| `server/tests/lab-02/my-tickets.api.test.ts` | Owned ticket list, search/filter/pagination, and access isolation |
| `server/tests/lab-02/ticket-detail.api.test.ts` | Ticket detail response, 404/403 ownership protection, and attachment history |
| `server/tests/lab-02/attachments.api.test.ts` | Existing-ticket upload, type/size/limit validation, download, soft-removal, reason, and access control |
| `server/tests/unit/ticket.unit.test.ts` | Unit tests for ticket business rules and pagination calculations |
| `client/src/pages/CreateTicket.test.tsx` | Create Ticket form and attachment handling |
| `client/src/pages/MyTickets.test.tsx` | My Tickets list, filters, pagination, loading/error states |
| `client/src/pages/TicketDetail.test.tsx` | Detail read-only fields, attachment states, upload validation, download, and removal modal |
| `e2e/requester-ticket-flow.spec.ts` | Playwright E2E suite covering the full user flow (select requester → create ticket with attachments → list & search → view detail & soft-remove → cross-requester access control) |

## 4️⃣ Issue #16 Verification

The issue-specific automated suites currently cover:

- `GET /api/tickets/:id`: owned detail response, missing requester, and cross-requester rejection.
- `POST /api/tickets/:id/attachments`: valid upload, unsupported type, oversized file, 5-active limit, ownership, and reuse after soft-removal.
- `GET /api/attachments/:id/download`: active-file headers/body, removed-file `410 Gone`, and cross-requester rejection.
- `DELETE /api/attachments/:id`: trimmed removal reason, persisted soft-removal metadata, missing/short reason, and duplicate-removal rejection.
- Ticket Detail UI rendering, read-only presentation, empty/loading/error states, client-side file validation, download action, and removal confirmation.
- Full E2E Playwright lifecycle test exercising all AC criteria in real browser against backend & frontend servers.

Database migration verification was run locally with `cd server && npx prisma migrate deploy`; migration `20260906183000_add_attachment_removal_reason` applied successfully, followed by `npx prisma generate`.

## 5️⃣ Commands to Run Tests
```bash
# Server API tests (Vitest)
npm run test:server # or cd server && npm test

# Client UI tests (Vitest + React Testing Library)
npm run test:client # or cd client && npm test

# End-to-End E2E tests (Playwright)
npm run test:e2e

# Client lint and builds
cd client && npm run lint && npm run build
cd server && npm run build
```

---

*All tests are written **before** implementation (TDD). The failing test cycle will be visible in the CI log before the actual code is merged.*
