# AI Usage Log & Reflection — Lab 2

- **Course:** Software Engineering
- **Student Name:** Janinee (nannaphatkn)
- **Repository:** [https://github.com/nannaphatkn/toktickit](https://github.com/nannaphatkn/toktickit)
- **Lab:** Lab 2 — Requester Ticketing MVP
- **Date:** September 2026

---

## 1. Key AI Prompts Log

### Prompt 1: Draft Specification & Business Rules
- **Intent:** Create comprehensive `specification.md` and `ui-spec.md` following Zen Green Theme guidelines before writing code.
- **Prompt:**  
  *"Read Lab 2 Labsheet requirements and draft docs/lab-02/specification.md covering functional requirements, business rules BR-01 through BR-11, data models for RequesterUser, Ticket, Attachment, Category, and System, and Acceptance Criteria."*
- **Model Used:** Gemini 3.6 Flash / Agentic Coding Assistant
- **Output & Verification:** Produced `docs/lab-02/specification.md` and `docs/lab-02/ui-spec.md`. Verified acceptance criteria match labsheet requirements.

### Prompt 2: Design REST API Contract
- **Intent:** Define request/response shapes, validation constraints, and HTTP status codes for all backend routes.
- **Prompt:**  
  *"Draft docs/lab-02/api-spec.md detailing REST API endpoints for GET /api/requesters, GET /api/categories, GET /api/related-systems, POST /api/tickets, GET /api/tickets, GET /api/tickets/:id, and DELETE /api/tickets/:id/attachments/:attachmentId with X-Requester-Id header requirements."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Produced `docs/lab-02/api-spec.md`. Validated all JSON schemas.

### Prompt 3: Write TDD Test Suite First
- **Intent:** Practice Test-Driven Development (TDD) by writing API tests before controller code.
- **Prompt:**  
  *"Read docs/lab-02/specification.md and tests.md. Implement Supertest API tests for POST /api/tickets verifying summary length validation, missing required fields, and file upload limits. Confirm tests fail initially."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Created test files under `server/tests/`. Confirmed test suite failed as expected before implementation.

### Prompt 4: Implement Development Requester Context & Header
- **Intent:** Create `RequesterContext` in React to manage active requester and propagate `X-Requester-Id` header across all `apiFetch` calls.
- **Prompt:**  
  *"Implement RequesterContext and RequesterSelector dropdown in Navbar. Ensure apiFetch utility automatically appends X-Requester-Id header to all server requests."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Built `RequesterContext.tsx` and `Navbar.tsx`. Verified dropdown updates state dynamically.

### Prompt 5: Implement Create Ticket Form with File Attachments
- **Intent:** Build ticket creation UI with live validation and file uploader.
- **Prompt:**  
  *"Build CreateTicket page with live validation for summary (10-150 chars), category dropdown, system dropdown, priority selector, and drag-and-drop file upload supporting up to 5MB files (JPG, PNG, PDF)."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Implemented `CreateTicket.tsx` and `FileUpload.tsx`. Confirmed form submission creates tickets in database.

### Prompt 6: Implement My Tickets List with Search, Filter & Pagination
- **Intent:** Build requester-isolated ticket list with query filters.
- **Prompt:**  
  *"Implement MyTickets page fetching tickets for active requester with search keyword filter, category dropdown, status pills (All, Open, In Progress, Resolved, Closed), sorting, and 10-item pagination."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Created `MyTickets.tsx`. Verified Jennifer Anderson sees only her tickets and David Kim sees only his tickets.

### Prompt 7: Implement Ticket Detail View Mode & Soft Delete
- **Intent:** Display ticket details and allow soft deletion of attachments.
- **Prompt:**  
  *"Implement TicketDetail page displaying full ticket status, metadata, description, and attached files list. Implement soft deletion confirmation modal updating isRemoved to true without deleting disk files."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Built `TicketDetail.tsx`. Verified soft removal sets `isRemoved: true` in PostgreSQL.

### Prompt 8: Playwright Screenshot Automation & Submission PDF Generation
- **Intent:** Automate capturing 15 high-res UI screenshots across viewports and generate PDF report.
- **Prompt:**  
  *"Write capture-screenshots.mjs using Playwright to capture screenshots 01 through 15 covering Desktop, Tablet (768px), and Mobile (375px) viewports. Convert Lab2_Submission.md to Lab2_Submission.pdf with Base64 embedded images."*
- **Model Used:** Agentic Coding Assistant
- **Output & Verification:** Generated 15 screenshots and compiled `Lab2_Submission.pdf` (2.5 MB).

---

## 2. Personal Reflection & AI Pair Programming Lessons

1. **Spec-Driven Development (SDD) Discipline:**  
   Writing detailed specifications (`specification.md`, `api-spec.md`, `ui-spec.md`) before writing any frontend or backend code saved substantial debugging time. Having a clear contract ensured seamless frontend-backend integration.

2. **Test-Driven Development (TDD) Confidence:**  
   Writing test suites (`Vitest` + `Supertest`) before building API controllers forced exact error status code design (400 for validation error, 401/403 for missing requester context). Running 82 automated tests gave complete confidence in refactoring.

3. **Agentic Coding Efficiency:**  
   AI agents excel at generating boilerplate code, type definitions, seed scripts, and Playwright screenshot automation. Human oversight remains essential for architecture decisions, reviewing edge cases, and verifying UI aesthetics.

4. **Mistakes Found & Lessons Learned:**  
   During code review, a ticket number format inconsistency was discovered: the seed data (`seed.ts`) used the format `TCK-YYYY-XXXX` (4-digit, different prefix), while the actual backend generator in `ticketRoutes.ts` correctly uses `TKT-YYYY-XXXXXX` (6-digit, TKT prefix per `specification.md` BR-01). The submission document also repeated the wrong `TCK-` prefix.

   **Root cause:** The seed data was written early in the sprint based on a placeholder format before the final API generator was finalized. The AI assistant generated both independently without cross-checking consistency, and the human reviewer missed the discrepancy.

   **What AI did well:** Generated comprehensive test suites, middleware, and Prisma queries with correct logic. The auth middleware and soft-delete were implemented correctly from the start.

   **What required human judgment:** Cross-file consistency (e.g., seed format vs. generator format), final aesthetic review of UI screenshots, and confirming that all acceptance criteria mapped back to actual running tests — not just stated intentions.

   **Going forward:** I will add a cross-reference checklist step before finalizing any submission to verify that constants and formats defined in specs match exactly in: (1) seed data, (2) API generators, (3) test fixtures, and (4) documentation.

