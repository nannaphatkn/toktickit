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

### Prompt 8: Comprehensive Automated Testing Suite
> "run test ทั้งหมด"
- **AI Output:** Executed and validated all 34 client component tests, 71 server API tests, and 19 Playwright E2E tests passing clean across authentication, RBAC, ticket queues, and user management.

### Prompt 9: Release PR & Strict Peer Review Workflow Enforcement
> "ห้าม merge เองนะต้องให้เพื่อน (Patitta-23) เป็นคนกดปุ่มสีเขียว Merge บนหน้าเว็บ"
- **AI Output:** Configured release pipeline to strictly adhere to peer review protocols. Opened official Release PR #36 from `lab3-staging` to `main`, assigned reviewer `Patitta-23`, and left the PR open waiting for the peer reviewer to review and execute the merge via the GitHub UI.

### Prompt 10: Real GitHub Peer Review Synchronization & Final Submission Prep
> "ทำ ai_use กับ reviewerที่เอามาจากgithub ที่เพื่อนรีวิวจริง ๆ รอเลย"
- **AI Output:** Queried GitHub REST API for real review logs, comments, timestamps, and commit hashes for all PRs on both `nannaphatkn/toktickit` and partner repository `Patitta-23/LAB`. Formatted `reviewer.md` with complete transparency and prepared `ai-use.md` documenting the AI pair programming process.

## 3. Reflection & Lessons Learned

1. **Spec-Driven & Test-Driven Discipline:**  
   Writing detailed specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) before writing backend endpoints prevented security oversights such as accidental leaking of Internal Notes or allowing non-Admins to manage users.
2. **Server-Side Security Over UI Hiding:**  
   As emphasized in CPE 334 guidelines, hiding buttons in React components is only user feedback, not security. Enforcing JWT authentication and role checks in Express middleware guaranteed robust authorization across all operations.
3. **Data Migration Safety & Optimization:**  
   Evolving the existing database schema from Lab 2 Requesters to the unified `User` model ensured that Lab 2 tickets remained intact. Incorporating peer review feedback from `Patitta-23` to add the composite index `@@index([role, isActive])` optimized query performance for active IT Staff filtering during assignment.
4. **Context Synchronization in Hybrid Evolutions:**  
   When modernizing an MVP with real JWT authentication, legacy mock states (like development requester selectors) must be intentionally synced with the session store to avoid visual anomalies or phantom data loss.
5. **Collaborative Git & Peer Review Integrity:**  
   Strictly separating the roles of PR author and reviewer on GitHub enforces quality gates. Automated tools can prepare changes, but peer review validation and release merges must remain human-verified by team members.

