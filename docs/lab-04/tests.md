# Lab 04 Test Plan & Traceability Matrix — Test DD

## 1. Test Strategy & Overview

Lab 4 testing covers full end-to-end verification across API, Component UI, Authorization, and E2E flows:

- **Server API Tests (`server/tests/lab-04/*.test.ts`)**: Direct HTTP integration tests for Actions Taken CRUD, Dashboard metrics, status-transition enforcement, stale-update conflict detection, and authorization.
- **Client Component Tests (`client/src/pages/__tests__/*.test.tsx`)**: React Testing Library unit & component tests verifying dashboard rendering, Actions Taken form validation, role-based visibility, and error/empty states.
- **Playwright E2E Tests (`e2e/lab-04/*.spec.ts`)**: Full browser end-to-end tests validating IT Staff Dashboard, Requester Dashboard, Actions Taken create/edit flow, Ticket resolution workflow, and final regression across all Lab 1–3 features.

---

## 2. Acceptance Criterion to Test Case Traceability Matrix

| AC ID | Acceptance Criterion | Test ID | Type | Test Description | Test File | Expected Result | Status |
|-------|---------------------|---------|------|-----------------|-----------|-----------------|--------|
| AC-01 | Action Taken created with correct performer | API-01 | API | Create valid Action Taken as IT Staff | `server/tests/lab-04/actions-taken.api.test.ts` | 201 Created + performedById = current user | Pass |
| AC-01 | performedById cannot be overridden by client | API-02 | API | Send arbitrary performedById in body | `server/tests/lab-04/actions-taken.api.test.ts` | 201 Created + performedById = JWT user (ignored) | Pass |
| AC-02 | Requester dashboard scoped to own tickets | API-03 | API | GET /api/dashboard/requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | 200 + metrics for own tickets only | Pass |
| AC-03 | IT Staff dashboard returns correct metrics | API-04 | API | GET /api/dashboard/staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | 200 + unassigned, myTickets, byStatus, byPriority, recentTickets | Pass |
| AC-04 | Requester blocked from creating Actions Taken | API-05 | API | POST /api/tickets/:id/actions as Requester | `server/tests/lab-04/actions-taken.api.test.ts` | 403 Forbidden | Pass |
| AC-05 | Valid status transition accepted | API-06 | API | IN_PROGRESS → RESOLVED by IT Staff | `server/tests/lab-04/ticket-workflow.api.test.ts` | 200 OK + status updated | Pass |
| AC-06 | Invalid status transition rejected | API-07 | API | RESOLVED → IN_PROGRESS by IT Staff | `server/tests/lab-04/ticket-workflow.api.test.ts` | 400 Bad Request + InvalidStatusTransition | Pass |
| AC-07 | followUpNote required when followUpRequired=true | API-08 | API | POST action with followUpRequired=true, no note | `server/tests/lab-04/actions-taken.api.test.ts` | 400 Bad Request | Pass |
| AC-08 | Stale update returns 409 | API-09 | API | PATCH action with outdated updatedAt | `server/tests/lab-04/actions-taken.api.test.ts` | 409 Conflict | Pass |
| AC-09 | Lab 1–3 regression: authentication still works | API-10 | API | Login, change password, logout flow | `server/tests/lab-03/auth.api.test.ts` (regression) | All pass | Pass |
| AC-09 | Lab 1–3 regression: requester ticket flow | API-11 | API | Create ticket, view ticket, add comment | `server/tests/lab-02/ticket.api.test.ts` (regression) | All pass | Pass |
| AC-10 | No horizontal overflow on mobile | E2E-01 | E2E | Dashboard at 375px viewport | `e2e/lab-04/dashboards.spec.ts` | No horizontal scroll | Pass |
| AC-01 | Action Taken UI — create form validation | UI-01 | UI Component | Submit empty form on ActionsTaken component | `client/src/pages/__tests__/ActionsTaken.test.tsx` | Inline field errors shown | Pass |
| AC-04 | Requester sees read-only Actions Taken | UI-02 | UI Component | Render ActionsTaken as Requester role | `client/src/pages/__tests__/ActionsTaken.test.tsx` | No Add/Edit buttons rendered | Pass |
| AC-02 | Requester Dashboard renders metric cards | UI-03 | UI Component | Render RequesterDashboard component | `client/src/pages/__tests__/RequesterDashboard.test.tsx` | 4 metric cards with correct labels | Pass |
| AC-03 | IT Staff Dashboard renders all sections | UI-04 | UI Component | Render StaffDashboard component | `client/src/pages/__tests__/StaffDashboard.test.tsx` | Metric cards + status breakdown + recent list | Pass |
| AC-09 | Full E2E regression: IT Staff workflow | E2E-02 | E2E | Login as IT Staff → Queue → Detail → Assign → Status change | `e2e/lab-04/actions-taken-flow.spec.ts` | All assertions pass | Pass |
| AC-05, AC-06 | Ticket resolution E2E | E2E-03 | E2E | IT Staff resolves ticket through full flow | `e2e/lab-04/ticket-resolution.spec.ts` | Ticket reaches RESOLVED/CLOSED | Pass |
| AC-02, AC-03 | Dashboard E2E for both roles | E2E-04 | E2E | Requester and IT Staff dashboard metrics match database | `e2e/lab-04/dashboards.spec.ts` | Counts match expected seed data | Pass |

---

## 3. Planned Automated Test Files

### Backend Unit & Integration Tests (`server/tests/lab-04/`)

#### `actions-taken.api.test.ts`
- `POST /api/tickets/:id/actions` — valid create by IT Staff (201)
- `POST /api/tickets/:id/actions` — `performedById` in body is ignored (201, set from JWT)
- `POST /api/tickets/:id/actions` — Requester receives 403
- `POST /api/tickets/:id/actions` — `followUpRequired=true` without `followUpNote` → 400
- `POST /api/tickets/:id/actions` — future `actionDateTime` → 400
- `POST /api/tickets/:id/actions` — empty `actionDescription` → 400
- `GET /api/tickets/:id/actions` — IT Staff sees all actions (200)
- `GET /api/tickets/:id/actions` — Requester sees actions on own ticket (200)
- `GET /api/tickets/:id/actions` — Requester blocked on non-owned ticket (403)
- `PATCH /api/tickets/:id/actions/:actionId` — original performer can update (200)
- `PATCH /api/tickets/:id/actions/:actionId` — other IT Staff cannot update (403)
- `PATCH /api/tickets/:id/actions/:actionId` — Administrator can update any (200)
- `PATCH /api/tickets/:id/actions/:actionId` — stale updatedAt → 409

#### `ticket-workflow.api.test.ts`
- Valid transition: `NEW → OPEN` (IT Staff → 200)
- Valid transition: `IN_PROGRESS → RESOLVED` (IT Staff → 200)
- Valid transition: `RESOLVED → REOPENED` (Requester → 200)
- Valid transition: `RESOLVED → CLOSED` (IT Staff → 200)
- Invalid transition: `RESOLVED → IN_PROGRESS` → 400 InvalidStatusTransition
- Invalid transition: `CLOSED → OPEN` → 400 InvalidStatusTransition
- Invalid transition: `CANCELLED → OPEN` → 400 InvalidStatusTransition
- Requester cannot set status to `RESOLVED` directly → 403

#### `requester-dashboard.api.test.ts`
- `GET /api/dashboard/requester` — returns correct `openTickets` count
- `GET /api/dashboard/requester` — returns correct `waitingForRequester` count
- `GET /api/dashboard/requester` — returns correct `recentlyUpdated` count (7-day window)
- `GET /api/dashboard/requester` — returns correct `recentlyResolved` count
- `GET /api/dashboard/requester` — only shows current Requester's tickets
- `GET /api/dashboard/requester` — IT Staff receives 403
- `GET /api/dashboard/requester` — empty state returns all zeros

#### `staff-dashboard.api.test.ts`
- `GET /api/dashboard/staff` — returns correct `unassigned` count
- `GET /api/dashboard/staff` — returns correct `myTickets` count
- `GET /api/dashboard/staff` — `byStatus` counts match database
- `GET /api/dashboard/staff` — `byPriority` counts match database
- `GET /api/dashboard/staff` — `recentTickets` returns only tickets updated within 7 days
- `GET /api/dashboard/staff` — Requester receives 403
- `GET /api/dashboard/staff` — Administrator can access (200)

### Frontend Component Tests (`client/src/pages/__tests__/`)

#### `StaffDashboard.test.tsx`
- Renders 4 metric cards with correct labels
- Displays status breakdown section
- Displays recent tickets list
- Shows skeleton loading state while fetching
- Shows empty state when no data
- Shows error state on API failure
- Metric card click navigates to correct drill-down URL
- Administrator can view dashboard (same component)

#### `RequesterDashboard.test.tsx`
- Renders 4 metric cards (open, waiting, recently updated, recently resolved)
- Displays recent tickets list
- Shows loading / empty / error states
- Ownership: metrics visible only for authenticated Requester
- Card click navigates to correct drill-down URL

#### `ActionsTaken.test.tsx`
- IT Staff sees "Add Action" button
- Requester does NOT see "Add Action" button
- Create form validation: empty description → inline error
- Create form validation: followUpRequired=true + empty note → inline error
- Create form validation: future date → inline error
- Successful create: new entry appears in list without page reload
- Edit: only visible to original performer and Administrator
- Read-only list visible to Requester

#### `TicketWorkflow.test.tsx`
- Status dropdown shows only permitted next transitions for current role
- Disallowed transitions not rendered
- Successful status change refreshes status badge
- 409 Conflict shows toast message

### End-to-End Playwright Tests (`e2e/lab-04/`)

#### `actions-taken-flow.spec.ts`
- IT Staff logs in → navigates to Ticket Detail → creates an Actions Taken with follow-up
- IT Staff edits own Actions Taken
- IT Staff cannot edit another user's Actions Taken (Edit button absent)
- Requester logs in → views Actions Taken in read-only mode → no Add/Edit buttons
- Administrator can edit any Actions Taken

#### `ticket-resolution.spec.ts`
- IT Staff walks ticket from `NEW → OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- Requester marks `isRequesterResolved = true` (advisory) — status stays IN_PROGRESS
- Requester reopens a RESOLVED ticket → status = REOPENED
- IT Staff tries invalid transition → error feedback shown

#### `dashboards.spec.ts`
- Requester logs in → visits dashboard → metric counts match seeded data
- IT Staff logs in → visits dashboard → unassigned, myTickets, byStatus match seeded data
- Dashboard cards drill down to correct filtered queue
- Dashboard at 375px viewport → no horizontal scroll

---

## 4. Regression Coverage (Labs 1–3)

The following existing test files must continue to pass after Lab 4 changes:

| Test File | Coverage |
|-----------|----------|
| `server/tests/lab-02/ticket.api.test.ts` | Requester ticket CRUD, attachments |
| `server/tests/lab-02/ticket-detail.api.test.ts` | Ticket detail API |
| `server/tests/lab-03/auth.api.test.ts` | Login, password change, logout |
| `server/tests/lab-03/authorization.api.test.ts` | RBAC enforcement |
| `server/tests/lab-03/staff-queue.api.test.ts` | IT Staff queue queries |
| `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Claim, assign, priority, status |
| `server/tests/lab-03/comments-notes.api.test.ts` | Public comments, internal notes |
| `server/tests/lab-03/users-admin.api.test.ts` | Admin user management |
| `e2e/lab-03/authentication.spec.ts` | Full auth flow |
| `e2e/lab-03/staff-ticket-flow.spec.ts` | IT Staff queue and detail |
| `e2e/lab-03/user-administration.spec.ts` | Admin user management |
