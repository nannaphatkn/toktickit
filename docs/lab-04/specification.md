# Lab 04 Specification — TokTickIT Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal

Deliver the final TokTickIT increment by introducing Actions Taken under each Ticket so IT Staff can plan and record real work, adding role-appropriate Dashboards for Requesters and IT Staff that summarise operational data and link to detailed views, enforcing the complete Ticket status-transition workflow, and hardening all authentication, authorisation, Requester, IT Staff, and Administrator behaviour from Labs 1–3 under the Zen Green design language.

---

## 2. Stakeholder Request

The service desk already handles ticket creation, communication, and user management, but IT Staff have no formal way to record what work was actually done. Lab 4 adds an **Actions Taken** sub-record per Ticket so each person working on a Ticket can log their action, result, and follow-up intent. Role-appropriate **Dashboards** give Requesters a status summary of their own tickets and give IT Staff an operational overview with drill-down into the queue. The full Ticket lifecycle must now be locked down with enforced status transitions, and the complete application must be polished, regression-tested, and ready for final demonstration.

---

## 3. Scope

### 3.1 Included Scope
- **Actions Taken model**: create and update sub-records per Ticket by IT Staff and Administrators.
- **Requester Dashboard**: summary of the authenticated Requester's own tickets (open, waiting, recently updated, recently resolved).
- **IT Staff Dashboard**: operational metrics (unassigned, owned by me, by status/priority, recently updated).
- **Administrator Dashboard**: reuses IT Staff dashboard; optionally shows user-account counts.
- **Complete Ticket status-transition matrix**: fully documented and enforced server-side.
- **Final hardening and regression**: all Lab 1–3 screens, APIs, and business rules remain correct.
- **Zen Green UI consistency**: all new and existing screens align with the established design language.
- **Seed data, migration, and responsive/accessibility** requirements.

### 3.2 Explicitly Excluded Scope
- Automatic SLA clocks, escalation engines, breach notifications.
- Email, SMS, LINE, push, or any external notification services.
- Inventory, spare-parts management, or cost accounting.
- Time-sheet billing or labour-cost calculation.
- Multi-level approval workflows and electronic signatures.
- Advanced BI tools, custom report builders, or data-warehouse exports.
- Multi-tenant organisations and production-scale cloud operations.
- New features not approved in this Sprint 4 engineering contract.

---

## 4. Functional Requirements

- **FR-01 (Actions Taken — Create):** IT Staff and Administrators shall create an Actions Taken record under any accessible Ticket, supplying Action Date/Time, Action Description, Result, Follow-Up Required flag, Follow-Up Note (required when flag is true), and Attachment Notes.
- **FR-02 (Actions Taken — Update):** IT Staff and Administrators shall update an existing Actions Taken record they created, subject to business rules.
- **FR-03 (Actions Taken — View):** Requesters, IT Staff, and Administrators shall view all Actions Taken records for a Ticket they are authorised to access.
- **FR-04 (Performed-By Auto-Assignment):** The `performedById` of an Actions Taken record shall be set automatically from the authenticated JWT identity; the client shall never supply this value.
- **FR-05 (Requester Dashboard):** An authenticated Requester shall retrieve a dashboard showing: total open tickets, tickets waiting for the Requester, recently updated tickets (last 7 days), and recently resolved tickets (last 7 days) — scoped to tickets the Requester owns.
- **FR-06 (IT Staff Dashboard):** An authenticated IT Staff member or Administrator shall retrieve a dashboard showing: unassigned ticket count, tickets assigned to the current user, ticket counts grouped by status, ticket counts grouped by IT Priority, and a list of recently updated tickets (last 7 days).
- **FR-07 (Administrator Dashboard):** An Administrator shall access the IT Staff Dashboard and optionally view active/inactive user account counts.
- **FR-08 (Dashboard Drill-Down):** Every dashboard metric card shall provide a link or query parameter that opens the relevant filtered Ticket Queue or list view.
- **FR-09 (Status Transition Enforcement):** The server shall reject any status update that violates the approved Ticket status-transition matrix, regardless of client input.
- **FR-10 (Requester Resolution Advisory):** A Requester shall set `isRequesterResolved = true` on their own ticket as an advisory signal; this does not change the ticket status to RESOLVED.
- **FR-11 (Final Regression):** All Requester, IT Staff, and Administrator features from Labs 1–3 shall continue to function correctly after Lab 4 changes.
- **FR-12 (Hardening):** Duplicate submissions from repeated clicking, stale-update conflicts, form data loss on recoverable failures, and console errors shall be eliminated.

---

## 5. Business Rules

- **BR-01:** An Actions Taken record belongs to exactly one Ticket and cannot be moved to another Ticket.
- **BR-02:** The Ticket Owner coordinates the Ticket as a whole; an Actions Taken may be performed by a different active IT Staff or Administrator.
- **BR-03:** Only users with role `IT_STAFF` or `ADMINISTRATOR` may create or update Actions Taken. Requesters receive `403 Forbidden` on any write attempt.
- **BR-04:** `performedById` is always derived from the authenticated JWT. Clients must not supply this field; if supplied, it is ignored.
- **BR-05:** `followUpNote` is required (non-empty, non-whitespace) when `followUpRequired = true`; it is optional when `followUpRequired = false`.
- **BR-06:** `attachmentNotes` is optional. If supplied, it must be non-whitespace.
- **BR-07:** `actionDateTime` must be a valid ISO-8601 date-time and must not be in the future beyond the current server timestamp.
- **BR-08:** Actions Taken records are not deleted; they may only be updated by the original performer or by an Administrator.
- **BR-09 (Status Transition Matrix):**

  | From \ To | NEW | OPEN | IN_PROGRESS | WAITING_FOR_REQUESTER | RESOLVED | CLOSED | REOPENED | CANCELLED |
  |-----------|-----|------|-------------|-----------------------|----------|--------|----------|-----------|
  | NEW       | —   | IT/A | IT/A        | —                     | —        | —      | —        | R/IT/A    |
  | OPEN      | —   | —    | IT/A        | IT/A                  | —        | —      | —        | R/IT/A    |
  | IN_PROGRESS | — | —    | —           | IT/A                  | IT/A     | —      | —        | IT/A      |
  | WAITING_FOR_REQUESTER | — | — | IT/A    | —                     | IT/A     | —      | R        | R/IT/A    |
  | RESOLVED  | —   | —    | —           | —                     | —        | IT/A   | R        | —         |
  | CLOSED    | —   | —    | —           | —                     | —        | —      | —        | —         |
  | REOPENED  | —   | IT/A | IT/A        | —                     | —        | —      | —        | R/IT/A    |
  | CANCELLED | —   | —    | —           | —                     | —        | —      | —        | —         |

  *(R = Requester, IT = IT Staff, A = Administrator)*

- **BR-10:** A Ticket in CLOSED or CANCELLED status cannot be modified further (except by Administrator in special cases documented in api-spec.md).
- **BR-11:** Dashboard metrics are calculated exclusively by the backend from authoritative database data. The frontend must not compute or cache metrics independently.
- **BR-12:** Dashboard results for a Requester must be scoped to only that Requester's own tickets (ownership enforced by JWT identity).
- **BR-13:** All existing business rules from Labs 2 and 3 (BR-01 through BR-20 in lab-03/specification.md) remain in effect.
- **BR-14:** Concurrent or stale updates to Ticket status or Actions Taken are detected using `updatedAt` timestamp comparison; the server returns `409 Conflict` when a stale update is detected.

---

## 6. UI Specification Summary

See [`docs/lab-04/ui-spec.md`](./ui-spec.md) for the full design system, component states, and responsive rules.

- **IT Staff Dashboard** (`/staff/dashboard`): metric cards (unassigned, my tickets, by status, by priority), recent tickets list, drill-down links to `/staff/queue` with pre-set filters. Loading skeleton, empty, forbidden, and safe-failure states required.
- **Requester Dashboard** (`/requester/dashboard` or `/my-dashboard`): metric cards (open, waiting, recently updated, recently resolved), recent ticket list with drill-down to ticket detail. Ownership-protected — only shows data for the authenticated Requester.
- **Actions Taken on IT Staff Ticket Detail**: appended below the existing tab section. Shows list/table of all Actions Taken; IT Staff see "Add Action" button and can edit their own entries; Requesters see the list in read-only mode.
- **Ticket Workflow Controls**: status-change controls show only permitted next states. Disallowed options are hidden or disabled. Backend enforces the real constraint.
- **Navigation Bar**: updated to include Dashboard link per role. Active-page indicator maintained.
- **Responsive**: Desktop ≥ 1024 px, Tablet 768–1023 px, Mobile < 768 px. No horizontal overflow on any breakpoint.
- **Accessibility**: Keyboard navigable, visible focus rings, semantic HTML, ARIA labels on interactive controls, colour not the only status cue.

---

## 7. Data Model Changes

### 7.1 New Model: `ActionTaken`

```prisma
model ActionTaken {
  id               Int       @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedById    Int
  performedBy      User      @relation("ActionTakenPerformer", fields: [performedById], references: [id])
  actionDateTime   DateTime
  actionDescription String
  result           String
  followUpRequired Boolean   @default(false)
  followUpNote     String?
  attachmentNotes  String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([ticketId])
  @@index([performedById])
}
```

### 7.2 Updates to Existing Models
- **`User`**: add `actionsTaken ActionTaken[] @relation("ActionTakenPerformer")` reverse relation.
- **`Ticket`**: add `actionsTaken ActionTaken[]` reverse relation.
- No existing fields removed; no existing data discarded.

### 7.3 Migration Strategy
- A new Prisma migration adds the `ActionTaken` table with foreign keys and indexes.
- All existing Tickets default to zero Actions Taken — no backfill required.
- Rollback: drop the `ActionTaken` table and remove the reverse relations.

### 7.4 Seed Data Requirements
- At least 3 Tickets with zero Actions Taken.
- At least 3 Tickets with exactly one Actions Taken.
- At least 2 Tickets with multiple (≥ 2) Actions Taken.
- At least one Actions Taken with `followUpRequired = true` and a populated `followUpNote`.
- Seed is idempotent (safe to run multiple times without duplicating data).
- Data sufficient for dashboard cards to show non-zero and zero metric examples.

### 7.5 Design Decisions
1. **`performedById` is separate from `Ticket.ownerId`** — this allows any active IT Staff to record an action, not just the Ticket Owner, which matches the stakeholder requirement that the primary owner coordinates while different staff may take action.
2. **`@@index([ticketId])` and `@@index([performedById])`** — optimise the most common queries: listing all Actions Taken for a Ticket, and listing Actions Taken by a specific user for dashboard metrics.

---

## 8. API Contract Summary

See [`docs/lab-04/api-spec.md`](./api-spec.md) for full endpoint definitions, request/response shapes, and error codes.

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/tickets/:id/actions` | List Actions Taken for a Ticket | R(owner), IT, A |
| POST | `/api/tickets/:id/actions` | Create a new Action Taken | IT, A |
| PATCH | `/api/tickets/:id/actions/:actionId` | Update an existing Action Taken | IT(own), A |
| GET | `/api/dashboard/requester` | Requester dashboard metrics | R |
| GET | `/api/dashboard/staff` | IT Staff / Admin dashboard metrics | IT, A |

All existing Lab 2 and Lab 3 endpoints continue to be supported without breaking changes.

---

## 9. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| **AC-01** | Given a permitted IT Staff user and valid data, when an Actions Taken is created, then it is saved under the correct Ticket with `performedById` set to the authenticated user. |
| **AC-02** | Given an authenticated Requester, when Requester Dashboard data is retrieved, then only metrics and recent Tickets owned by that Requester are returned. |
| **AC-03** | Given an authenticated IT Staff member, when IT Staff Dashboard data is retrieved, then unassigned count, my-tickets count, status breakdown, priority breakdown, and recent tickets are returned correctly. |
| **AC-04** | Given a Requester, when a POST to `/api/tickets/:id/actions` is attempted, then the server returns `403 Forbidden` with no Action Taken created. |
| **AC-05** | Given a Ticket in `IN_PROGRESS` status, when IT Staff sends `status = RESOLVED`, then the Ticket status is updated and a 200 OK is returned. |
| **AC-06** | Given a Ticket in `RESOLVED` status, when IT Staff sends `status = IN_PROGRESS`, then the server returns `400 Bad Request` (invalid transition). |
| **AC-07** | Given `followUpRequired = true` and `followUpNote` is empty, when creating or updating an Actions Taken, then the server returns `400 Bad Request`. |
| **AC-08** | Given a stale update (client sends an outdated `updatedAt`), when PATCH is submitted, then the server returns `409 Conflict`. |
| **AC-09** | Given all Lab 1–3 features, when Lab 4 code is deployed, then authentication, My Tickets, Ticket Detail, Attachments, Public Comments, Internal Notes, IT Staff Queue, and Admin User Management continue to operate correctly. |
| **AC-10** | Given any screen at mobile viewport (< 768 px), then no horizontal overflow, overlapping controls, or clipped content is present. |

---

## 10. Definition of Done

1. All Functional Requirements (FR-01 to FR-12) implemented and verified against Acceptance Criteria (AC-01 to AC-10).
2. All Business Rules (BR-01 to BR-14) enforced server-side with passing automated tests.
3. Prisma migration applied without data loss from Labs 1–3; seed data covers all required scenarios.
4. 100% of planned test cases in `docs/lab-04/tests.md` pass on the `main` branch (server API, client component, and Playwright E2E).
5. Zen Green design language applied consistently across all new and existing screens.
6. No console errors, broken links, placeholder text, or unfinished controls in the final build.
7. All code reviewed by peer reviewer and merged into `lab4-staging` then `main` via approved PRs.
8. `docs/lab-04/reviewer.md`, `docs/lab-04/ai-use.md`, `docs/lab-04/ui-spec.md`, and `docs/lab-04/api-spec.md` are complete and accurate.
9. `README.md` setup, seed, migration, test, and demonstration instructions are current.

---

## 11. Assumptions and Decisions

1. **`actionDateTime` is supplied by the client** (not auto-generated) so IT Staff can log an action that occurred in the past (e.g., a phone call earlier that day). The server validates it is not in the future.
2. **Only the original performer or an Administrator may update an Actions Taken** — this enforces audit integrity while allowing correction of errors.
3. **Dashboard time window for "recently updated/resolved"** is defined as the last **7 calendar days** relative to the server's UTC clock.
4. **Stale-update detection** uses the `updatedAt` field already present on Ticket and ActionTaken models; clients must echo the last-known `updatedAt` value in PATCH requests via an `updatedAt` field in the request body.
5. **Administrator Dashboard** reuses the IT Staff dashboard endpoint; the frontend renders the same dashboard component for both roles.
