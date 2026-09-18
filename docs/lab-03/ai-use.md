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

## 3. Reflection & Lessons Learned

1. **Spec-Driven & Test-Driven Discipline:**  
   Writing detailed specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) before writing backend endpoints prevented security oversights such as accidental leaking of Internal Notes or allowing non-Admins to manage users.
2. **Server-Side Security Over UI Hiding:**  
   As emphasized in CPE 334 guidelines, hiding buttons in React components is only user feedback, not security. Enforcing JWT authentication and role checks in Express middleware guaranteed robust authorization.
3. **Data Migration Safety:**  
   Evolving existing schema from Lab 2 Requesters to the unified `User` model ensured that Lab 2 tickets remained intact while enabling new IT Staff and Admin capabilities.
