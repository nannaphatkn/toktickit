# Issue Tracking & Kanban Backlog — Lab 2

- **Course:** Software Engineering
- **Student Name:** Janinee (nannaphatkn)
- **Repository:** [https://github.com/nannaphatkn/toktickit](https://github.com/nannaphatkn/toktickit)
- **Lab:** Lab 2 — Requester Ticketing MVP
- **Board:** GitHub Projects Kanban (Backlog ➔ Specified ➔ Started ➔ PR Review ➔ Fixing ➔ Done)

---

## Lab 2 GitHub Issues Summary

| Issue # | Title | Branch | Target PR | Status |
|---------|-------|--------|-----------|--------|
| **#1** | Lab 2 Architecture & Specifications Setup | `feature/docs-spec-plan` | [PR #12](https://github.com/nannaphatkn/toktickit/pull/12) | Done ✅ |
| **#2** | Development Requester Selection & Context Header | `feature/requester-selection` | [PR #17](https://github.com/nannaphatkn/toktickit/pull/17) | Done ✅ |
| **#3** | Create Ticket with File Attachments | `feature/create-ticket` | [PR #18](https://github.com/nannaphatkn/toktickit/pull/18) | Done ✅ |
| **#4** | My Tickets List with Search, Filter & Pagination | `feature/my-tickets` | [PR #19](https://github.com/nannaphatkn/toktickit/pull/19) | Done ✅ |
| **#5** | Ticket Detail View Mode & Attachment Soft Delete | `feature/ticket-detail-and-attachments` | [PR #20](https://github.com/nannaphatkn/toktickit/pull/20) | Done ✅ |

---

## Detailed Issue Breakdown

### Issue #1: Lab 2 Architecture & Specifications Setup
- **Goal:** Draft core specification documents (`specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`) before implementation.
- **Acceptance Criteria:**
  - [x] All 4 specification documents committed to `docs/lab-02/`.
  - [x] Zen Green theme design system defined.
  - [x] Initial database schema designed in Prisma.

### Issue #2: Development Requester Selection & Context Header
- **Goal:** Implement simulated authentication via dropdown header selector.
- **Acceptance Criteria:**
  - [x] Dropdown selector in navbar displaying active requesters from `RequesterUser` DB table.
  - [x] Access Guard blocks feature access when no requester is selected.
  - [x] `RequesterContext` propagates `X-Requester-Id` header to all API requests.
  - [x] Navbar displays selected requester name with clear button.

### Issue #3: Create Ticket with File Attachments
- **Goal:** Allow requesters to submit support tickets with file uploads.
- **Acceptance Criteria:**
  - [x] Form fields: Summary (10-150 chars), Description (20-1000 chars), Category dropdown, Related System dropdown, Priority selector.
  - [x] Drag & Drop file uploader supporting up to 5 files, 5MB max each (JPG, PNG, PDF).
  - [x] Form validation with live feedback and error banners.
  - [x] Direct database insertion linked to active `requesterId`.

### Issue #4: My Tickets List with Search, Filter & Pagination
- **Goal:** Display support tickets requested by the current user identity.
- **Acceptance Criteria:**
  - [x] Requester context isolation (only tickets matching active requester ID are displayed).
  - [x] Search input filtering by ticket number and summary.
  - [x] Category dropdown filter and Status filter pills (All, Open, In Progress, Resolved, Closed).
  - [x] Sort by date (Newest First, Oldest First).
  - [x] Pagination control (10 items per page) and empty state banner.

### Issue #5: Ticket Detail View Mode & Attachment Soft Delete
- **Goal:** Detailed ticket view and safe attachment removal.
- **Acceptance Criteria:**
  - [x] Full ticket summary, status badge, priority badge, category, system, and description.
  - [x] List of attachments with preview and download links.
  - [x] Soft removal confirmation modal setting `isRemoved: true` while preserving disk files.
  - [x] Requester context guard preventing access to other users' tickets.
