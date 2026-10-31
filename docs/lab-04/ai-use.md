# Lab 04 AI Pair Programming Log & Reflection

## 1. Primary AI Tools Used
- **AI Coding Agent:** Antigravity AI Assistant (Gemini 3.8 Flash / Claude Sonnet 4.6)
- **Role:** Specification Design, Test DD Traceability, Schema Migration, Server & Client Fullstack Development, Automated E2E Testing.

## 2. Prompts & Pair Programming Logs

### Prompt 1: Read Lab 4 Handout & Extract Requirements
> "Lab 04 ให้ทำอะไรบ้างทำ guide line ให้หน่อย"
- **AI Output:** Extracted and summarized key requirements from `SE+lab+04.pdf`: Actions Taken CRUD under Tickets, Requester Dashboard, IT Staff Dashboard, Administrator Dashboard, full Ticket status-transition matrix enforcement, final hardening, and regression testing across all Lab 1–3 features.

### Prompt 2: Generate Lab 4 Specification & Engineering Contracts (Spec DD)
> "lets start"
- **AI Output:** Produced 4 comprehensive specification documents:
  - `specification.md`: 12 Functional Requirements (FR-01..FR-12), 14 Business Rules (BR-01..BR-14), status transition matrix, acceptance criteria (AC-01..AC-10), and Definition of Done.
  - `ui-spec.md`: Zen Green design system compliance, IT Staff & Requester dashboard layouts, Actions Taken section UX, responsive breakpoints, and accessibility requirements.
  - `api-spec.md`: Full REST API contracts for Actions Taken CRUD, Dashboard endpoints, status transitions, request/response shapes, and error codes.
  - `tests.md`: Test plan with traceability matrix linking FR/BR to test cases across server API, component UI, and E2E test suites.

### Prompt 3: Database Migration & Seed Data (ActionTaken Model)
> "continue" (automated continuation from spec)
- **AI Output:** Extended `schema.prisma` with `ActionTaken` model (all required fields: `actionDateTime`, `actionDescription`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `performedById`). Added reverse relations on `User` and `Ticket`. Created migration SQL. Updated `seed.ts` to include ActionTaken records covering:
  - 3+ tickets with zero actions
  - 3+ tickets with exactly one action
  - 2+ tickets with multiple actions
  - At least one action with `followUpRequired = true`

### Prompt 4: Backend REST API Implementation
> "continue" (automated continuation)
- **AI Output:** Implemented complete server-side routes:
  - `actionsTakenRoutes.ts`: `GET /api/tickets/:id/actions`, `POST /api/tickets/:id/actions`, `PATCH /api/tickets/:id/actions/:actionId` with full validation (future date check, follow-up note requirement, stale update detection via `409 Conflict`, role-based access control).
  - `dashboardRoutes.ts`: `GET /api/dashboard/requester` (scoped to authenticated user's tickets), `GET /api/dashboard/staff` (operational metrics: unassigned count, assigned-to-me, status/priority breakdown, recent tickets).
  - Status transition enforcement integrated into existing ticket update routes with the full transition matrix from BR-09.

### Prompt 5: Frontend UI Pages & Components
> "continue" (automated continuation)
- **AI Output:** Implemented all Lab 4 frontend pages:
  - `StaffDashboard.tsx`: 4 metric cards (Unassigned, My Assigned, Open/In Progress, Urgent), status breakdown chart, recently updated tickets list, drill-down navigation to Staff Queue with pre-set filters.
  - `RequesterDashboard.tsx`: 4 metric cards (Open Tickets, Waiting for You, Recently Updated, Recently Resolved), recent ticket list, drill-down to My Tickets.
  - Actions Taken section integrated into `StaffTicketDetail.tsx` and `TicketDetail.tsx` (read-only for Requesters).
  - Status transition controls showing only valid next states based on the transition matrix.
  - Updated `App.tsx` with role-based routing and navigation.

### Prompt 6: E2E Tests & Regression Verification
> "continue" (automated continuation)
- **AI Output:** Created Playwright E2E test suites:
  - `actions-taken-flow.spec.ts`: E2E-01 (IT Staff creates/edits action), E2E-02 (Requester read-only view).
  - `dashboards.spec.ts`: E2E-04a (Staff dashboard metrics & drill-down), E2E-04b (Requester dashboard metrics), E2E-04c (mobile responsiveness at 375px).
  - `ticket-resolution.spec.ts`: E2E-03 (status transitions & requester reopen flow).
  - Updated `App.tsx` role-based redirects for proper navigation.

### Prompt 7: Strict Git Workflow & No Self-Merge Policy
> "เดี๋ยวก่อนสร้างตาม criteria แต่ห้าม merge หรืออะไรเองเด็ดขาด ทำได้แต่สร้าง branch, issue, kanban"
- **AI Output:** Strictly followed the no-self-merge policy. Created 5 feature branches (`feature/lab4-spec-dd`, `feature/lab4-database-migration`, `feature/lab4-server-api`, `feature/lab4-frontend-ui`, `feature/lab4-e2e-regression`), pushed all to GitHub, created 5 corresponding GitHub Issues (#37–#41). All PRs must be reviewed and merged by peer reviewer `Patitta-23` — no self-merging allowed.

## 3. Reflection & Lessons Learned

1. **Spec-Driven Development Continuity:**  
   Building Lab 4 spec documents before any code implementation ensured that the Actions Taken model, dashboard requirements, and status transition matrix were fully agreed upon before a single line of code was written. This eliminated costly rework and kept the entire sprint on track.

2. **Status Transition Matrix as Server-Side Law:**  
   The status transition matrix (BR-09) is enforced exclusively on the server side. The frontend displays only valid next states, but the real security gate is the server's validation. This defense-in-depth approach matches the CPE 334 principle that "UI hiding is user feedback, not security."

3. **Dashboard Data Integrity:**  
   Dashboard metrics are computed server-side from the authoritative database — the frontend never caches or independently computes metrics (BR-11). This prevents stale data display and ensures consistency across concurrent users.

4. **Stale Update Detection (Optimistic Concurrency):**  
   Implementing `updatedAt`-based stale update detection with `409 Conflict` responses (BR-14) prevents lost updates when multiple staff members edit the same ticket or action simultaneously. This is a practical real-world pattern that students rarely encounter in lab settings.

5. **Regression Safety Net:**  
   Adding E2E tests covering Lab 4 features alongside ensuring all Lab 1–3 features remain functional provides a comprehensive safety net. The E2E suite can be run before any merge to catch regressions early.

6. **Peer Review Integrity:**  
   Maintaining the strict rule that the PR author cannot merge their own PR ensures genuine code review by `Patitta-23`. This collaborative practice reinforces quality assurance and knowledge transfer between team members.
