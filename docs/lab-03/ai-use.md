# Lab 03 AI Pair Programming Log & Reflection

## 1. Primary AI Tools Used
- **AI Coding Agent:** Antigravity AI Assistant (Gemini 3.6 Flash / Claude Sonnet 4.6)
- **Role:** Specification Design, Test DD Traceability, Schema Migration, Server & Client Fullstack Development, Automated Testing.

## 2. Prompts & Pair Programming Logs

### Prompt 1: Read Lab 3 Handout & Analyze Increment Requirements
> "ช่วยอ่านไฟล์แลป 03 ให้หน่อยว่าต้องทำอะไรบ้าง"
- **AI Output:** Extracted and summarized key requirements from `Lab_3_sheet.pdf`: real authentication, mandatory first-login password change, 3 roles (`Requester`, `IT_STAFF`, `ADMINISTRATOR`), IT Staff Queue & Detail operations, Public Comments vs Internal Notes, Admin User Management, and Spec DD/Test DD deliverables.

### Prompt 2: Generate Lab 3 Implementation Plan
> "start with lab03"
- **AI Output:** Formulated comprehensive implementation plan covering Prisma schema migrations (`User`, `Role`, `PublicComment`, `InternalNote`), server RBAC middleware, endpoints, frontend Zen Green pages, test suites, and documentation.

### Prompt 3: Spec DD & Authorization Matrix Construction
> "Create specification, ui-spec, api-spec, and tests documentation for Lab 03"
- **AI Output:** Designed complete specification with 15 Functional Requirements (FR-01..FR-15), 20 Business Rules (BR-01..BR-20), complete Authorization Matrix, UI design system rules, REST API contracts, and BR-to-TC traceability matrix.

### Prompt 4: Schema Migration & Seed Data Preparation
> "ทำ database migration และ seed ข้อมูล user role ต่างๆ"
- **AI Output:** Extended Prisma schema with unified `User` model, `Role` enum, `PublicComment`, `InternalNote`, relations to `Ticket`, and seeded 10 realistic users (5 Requesters, 4 IT Staff, 1 Administrator) with bcrypt-hashed passwords.

### Prompt 5: Backend Auth Middleware & Server API Implementation
> "implement server api สำหรับ auth, staff queue, comments/notes และ user management"
- **AI Output:** Implemented JWT authentication and authorization middleware (`authenticateUser`, `requirePasswordChanged`, `requireRole`), along with `/api/auth`, `/api/staff/tickets`, `/api/tickets/:id/comments|notes`, and `/api/admin/users` routes backed by comprehensive unit and integration tests.

### Prompt 6: Frontend Pages & Role-Based Navigation
> "ทำหน้า frontend ของ lab 3 ทั้งหมด ทั้ง login, change password, staff queue, staff ticket detail, และ admin user management"
- **AI Output:** Implemented all 5 frontend screens adhering to the Zen Green design system (`#006B3C`), responsive layouts, protected route guards, role-based navigation bar, and form validation states.

### Prompt 7: Debugging & Requester Session Synchronization
> "แล้ว data ในครั้งก่อน ๆหายไปไหน / หน้า my tickets ขึ้น please select a requester"
- **AI Output:** Identified the root cause: Lab 2 `RequesterContext` was decoupled from Lab 3 JWT `AuthContext`. Updated `RequesterContext` and `AuthContext` to auto-synchronize the authenticated identity and restored Bootstrap styling imports for clean responsive grids.

### Prompt 8: End-to-End Testing & Main Release Integration
> "run test ทั้งหมดและ merge เข้า main"
- **AI Output:** Verified all 34 client tests, 71 server tests, and 19 Playwright E2E tests passing clean. Merged PR #33 into `lab3-staging` and executed release PR #34 to `main`.

## 3. Reflection & Lessons Learned

1. **Spec-Driven & Test-Driven Discipline:**  
   Writing detailed specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) before writing backend endpoints prevented security oversights such as accidental leaking of Internal Notes or allowing non-Admins to manage users.
2. **Server-Side Security Over UI Hiding:**  
   As emphasized in CPE 334 guidelines, hiding buttons in React components is only user feedback, not security. Enforcing JWT authentication and role checks in Express middleware guaranteed robust authorization across all operations.
3. **Data Migration Safety:**  
   Evolving the existing database schema from Lab 2 Requesters to the unified `User` model ensured that Lab 2 tickets remained intact while enabling new IT Staff and Admin capabilities.
4. **Context Synchronization in Hybrid Evolutions:**  
   When modernizing an MVP with real JWT authentication, legacy mock states (like development requester selectors) must be intentionally synced with the session store to avoid visual anomalies or phantom data loss.
