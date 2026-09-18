# Lab 03 Specification — TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Deliver an enterprise-ready ticketing workspace increment by replacing the temporary Development Requester selector with real authentication, role-based authorization, operational IT Staff ticket management workflows, and minimalist Administrator user management.

## 2. Stakeholder Request
"The temporary Requester selector was useful for development, but the system now needs real users. Replace it with secure login. Administrators need a simple User Management screen where they can view users, create an account, assign one role, update basic account information, activate or deactivate an account, and set a new initial password. A user signing in with an initial password must choose a new password before entering the application. Requesters must continue using ticket functions built in Lab 2 using authenticated identity. IT Staff need a professional Ticket Queue and Detail view to claim/reassign tickets, set IT Priority, communicate via Public Comments, write private Internal Notes, and update ticket status through permitted workflow."

## 3. Scope

### 3.1 Included Scope
- Email address & password authentication with bcrypt hashing.
- Mandatory first-login password change for accounts marked with initial password.
- Server-side Role-Based Access Control (RBAC) for 3 roles: `Requester`, `IT Staff`, `Administrator`.
- Role-specific UI navigation bar and application shell.
- Requester ticket management using authenticated user identity (no dev selector).
- IT Staff Ticket Queue: search, category/status/priority filters, sorting, pagination, ownership indicators.
- IT Staff Ticket Operations: claim ticket, reassign ownership, set IT Priority, update ticket status according to permitted workflow.
- Public Comments timeline (visible to Requester, IT Staff, Administrator) and "Problem Appears Resolved" indication by Requester.
- Internal Notes timeline (visible ONLY to IT Staff and Administrator).
- Administrator User Management: list users, search by name/email, filter by role, create user, edit user details/role/activation state, set new initial password.
- Safety rules for Admin: prevent duplicate email, prevent self-deactivation, prevent deactivation of last active Administrator.

### 3.2 Explicitly Excluded Scope
- Email invitations, password-reset emails, MFA, social login, OAuth/SSO.
- Self-registration for new users.
- Actions Taken entity and formal SLA calculations.
- Multiple roles per user.
- User deletion, bulk user export/import, department/profile image management.

## 4. Functional Requirements

- **FR-01 (Authentication):** The system shall authenticate users via valid email address and password credentials.
- **FR-02 (First Login Change):** The system shall enforce a mandatory password change screen when a user logs in with `mustChangePassword = true` before granting access to normal application screens.
- **FR-03 (Session & Logout):** The system shall manage authenticated user sessions via secure HTTP tokens/cookies and allow explicit user logout.
- **FR-04 (Role-Based Navigation):** The application navigation bar shall dynamically present only menu destinations allowed for the authenticated user's role.
- **FR-05 (Requester Continuity):** Requesters shall create and manage tickets using their authenticated user identity without manual selector controls.
- **FR-06 (IT Staff Queue):** IT Staff shall view a dedicated Ticket Queue featuring text search, status/priority/category filters, sorting, pagination, and assigned owner badges.
- **FR-07 (Ticket Ownership):** IT Staff or Administrators shall claim unassigned tickets or reassign tickets to active IT Staff/Admin users.
- **FR-08 (IT Priority):** IT Staff or Administrators shall adjust the IT Priority of any ticket independently of the Requester's requested priority.
- **FR-09 (Status Workflow):** IT Staff or Administrators shall update a ticket's status according to the valid status transition rules.
- **FR-10 (Public Comments):** Requesters, IT Staff, and Administrators shall view and post Public Comments on tickets.
- **FR-11 (Internal Notes):** IT Staff and Administrators shall view and post private Internal Notes on tickets. Requesters shall be blocked from viewing or creating Internal Notes.
- **FR-12 (Problem Resolved Indication):** Requesters shall be able to mark their ticket as "Problem Appears Resolved", providing notification to IT Staff.
- **FR-13 (Admin User List):** Administrators shall view a searchable and filterable list of all user accounts with their name, email, role, and active status.
- **FR-14 (Admin User Management):** Administrators shall create new user accounts and edit existing user attributes (name, email, role, active status).
- **FR-15 (Admin Password Reset):** Administrators shall set a new initial password for any user account, forcing a password change on next login.

## 5. Business Rules

- **BR-01:** Only active user accounts (`isActive = true`) with valid password credentials may authenticate.
- **BR-02:** A user with `mustChangePassword = true` cannot access application screens or APIs (except password change) until a new valid password is set.
- **BR-03:** Passwords must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
- **BR-04:** The authenticated session identity (JWT token), not client-supplied user parameters, determines ownership and access rights for all operations.
- **BR-05:** Requesters may only view, update, and manage attachments for tickets they created.
- **BR-06:** IT Staff and Administrators may view all tickets in the system.
- **BR-07:** Primary ticket ownership (`ownerId`) may only be assigned to active users with `IT_STAFF` or `ADMINISTRATOR` roles.
- **BR-08:** Requested Priority is submitted by the Requester and is read-only after creation. IT Priority initially defaults to Requested Priority and can only be altered by IT Staff or Administrators.
- **BR-09:** Permitted status values are `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **BR-10:** Requesters cannot directly set ticket status to `RESOLVED` or `CLOSED`; they can only set `isRequesterResolved = true` or move ticket status to `REOPENED` / `CANCELLED` if permitted.
- **BR-11:** Formal resolution and closure of a ticket must be performed by IT Staff or Administrator.
- **BR-12:** Public Comments are visible to Requester (owner), IT Staff, and Administrator.
- **BR-13:** Internal Notes are visible ONLY to IT Staff and Administrator. Requesters attempting to access internal notes must receive a 403 Forbidden error.
- **BR-14:** Public Comments and Internal Notes are append-only. No editing or deletion is allowed.
- **BR-15:** Empty or whitespace-only content for comments or notes is rejected.
- **BR-16:** User email addresses must be unique across the system. Duplicate email creation or update is rejected.
- **BR-17:** Administrators cannot deactivate their own logged-in account.
- **BR-18:** Deactivating or removing the last active Administrator account in the system is strictly prohibited.
- **BR-19:** User accounts cannot be deleted from the database; account access is controlled via the `isActive` flag.
- **BR-20:** All API endpoints must enforce authorization checks on the server side regardless of frontend button visibility.

## 6. Authorization Matrix

| Operation / Resource | Requester (Owner) | Requester (Non-Owner) | IT Staff | Administrator |
|---|---|---|---|---|
| Login / Password Change | Yes | Yes | Yes | Yes |
| Create Ticket | Yes | Yes | Yes | Yes |
| View Ticket Detail | Yes | No (403/404) | Yes | Yes |
| Manage Attachments | Yes | No (403/404) | Yes | Yes |
| Update IT Priority | No (403) | No (403) | Yes | Yes |
| Claim / Assign Ticket | No (403) | No (403) | Yes | Yes |
| Change Ticket Status | Partial (Resolved Flag) | No (403) | Yes | Yes |
| View Public Comments | Yes | No (403) | Yes | Yes |
| Post Public Comment | Yes | No (403) | Yes | Yes |
| View Internal Notes | No (403) | No (403) | Yes | Yes |
| Post Internal Note | No (403) | No (403) | Yes | Yes |
| Manage User Accounts | No (403) | No (403) | No (403) | Yes |

## 7. Data Model Changes
- **New Enums**: `Role` (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **New Model**: `User` (id, email, passwordHash, fullName, role, isActive, mustChangePassword, timestamps)
- **New Model**: `PublicComment` (id, ticketId, authorId, content, createdAt)
- **New Model**: `InternalNote` (id, ticketId, authorId, content, createdAt)
- **Ticket Updates**: `ownerId` (FK -> User), `itPriority` (Enum), `isRequesterResolved` (Boolean).

## 8. Acceptance Criteria Summary
- **AC-01**: Active user with valid credentials logs in successfully and receives user profile + role token.
- **AC-02**: User with initial password is redirected to Change Password screen and cannot navigate away until password is updated.
- **AC-03**: Requester cannot access another requester's tickets or attachments even if ticket ID is supplied in request.
- **AC-04**: Requester requesting Internal Notes endpoint receives HTTP 403 Forbidden with no leak of note data.
- **AC-05**: IT Staff can search, filter by status/priority/category, and paginate through Ticket Queue.
- **AC-06**: IT Staff can claim an unassigned ticket or assign it to another active IT Staff.
- **AC-07**: Administrator can create a new user and set initial password with mandatory change flag.
- **AC-08**: Administrator cannot deactivate their own account or the last active Administrator.

## 9. Definition of Done
1. All functional requirements (FR-01 to FR-15) and business rules (BR-01 to BR-20) implemented and verified.
2. All database migrations applied without data loss from Lab 2.
3. 100% test coverage for API, Component, and E2E test cases documented in `docs/lab-03/tests.md`.
4. Zen Green theme applied consistently across all new screens.
5. All code reviewed and merged into `lab3-staging` and `main`.
