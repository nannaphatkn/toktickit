# Lab 03 Test Plan & Traceability Matrix — Test DD

## 1. Test Strategy & Overview

Lab 3 testing covers full end-to-end verification across API, Component UI, Authorization, and E2E flows:

- **Server API Tests (`server/tests/lab-03/*.test.ts`)**: Direct HTTP integration tests testing authentication, role-based authorization, IT Staff queue queries, ticket workflow, comments, internal notes, and user administration safety rules.
- **Client Component Tests (`client/src/pages/__tests__/*.test.tsx`)**: React Testing Library unit & component tests verifying render states, form validation, role-based rendering, and user feedback.
- **Playwright E2E Tests (`e2e/lab-03/*.spec.ts`)**: Full browser end-to-end integration tests validating multi-role login, mandatory password change workflow, queue interaction, ticket assignment, and admin operations.

---

## 2. Business Rule to Test Case Traceability Matrix

| BR ID | Business Rule | Test ID | Test Description | Automated Test File | Expected Result | Status |
|---|---|---|---|---|---|---|
| **BR-01** | Only active users with valid credentials may authenticate | API-01 | Login with valid active credentials | `server/tests/lab-03/auth.api.test.ts` | 200 OK + JWT token | Pass |
| **BR-01** | Inactive user credentials rejected | API-02 | Login with inactive user account | `server/tests/lab-03/auth.api.test.ts` | 401 Unauthorized | Pass |
| **BR-02** | Initial password forces password change | API-03 | Login user with `mustChangePassword=true` | `server/tests/lab-03/auth.api.test.ts` | `mustChangePassword: true` | Pass |
| **BR-02** | User with initial password blocked from app APIs | API-04 | User accesses queue before password change | `server/tests/lab-03/authorization.api.test.ts` | 403 Forbidden | Pass |
| **BR-03** | Password complexity enforcement | UI-01 | Submit weak password on change screen | `client/src/pages/__tests__/ChangePassword.test.tsx` | Form error display | Pass |
| **BR-04** | JWT determines identity over request params | API-05 | Requester sends another requesterId in body | `server/tests/lab-03/authorization.api.test.ts` | Uses auth context ID | Pass |
| **BR-05** | Requester owner protection | API-06 | Requester views non-owned ticket | `server/tests/lab-03/authorization.api.test.ts` | 403 Forbidden | Pass |
| **BR-06** | IT Staff view all tickets | API-07 | IT Staff fetches queue | `server/tests/lab-03/staff-queue.api.test.ts` | 200 OK with all tickets | Pass |
| **BR-07** | Ticket ownership assignment | API-08 | Reassign ticket to IT Staff user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | 200 OK + updated owner | Pass |
| **BR-08** | IT Priority modification | API-09 | IT Staff changes ticket IT Priority | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | 200 OK + updated priority | Pass |
| **BR-09** | Status transitions | API-10 | Transition ticket status | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | 200 OK + status updated | Pass |
| **BR-10** | Requester cannot set Resolved status | API-11 | Requester sends status=RESOLVED | `server/tests/lab-03/authorization.api.test.ts` | 403 Forbidden | Pass |
| **BR-12** | Public Comments accessible by Requester | API-12 | Requester posts & views public comments | `server/tests/lab-03/comments-notes.api.test.ts` | 200 OK | Pass |
| **BR-13** | Internal Notes forbidden to Requester | API-13 | Requester GET/POST `/api/tickets/:id/notes` | `server/tests/lab-03/comments-notes.api.test.ts` | 403 Forbidden (No leak) | Pass |
| **BR-14** | Comments append-only | API-14 | Attempt DELETE/PATCH on comment | `server/tests/lab-03/comments-notes.api.test.ts` | 405 / 404 | Pass |
| **BR-16** | Admin prevents duplicate email | API-15 | Admin creates user with duplicate email | `server/tests/lab-03/users-admin.api.test.ts` | 400 Bad Request | Pass |
| **BR-17** | Admin cannot self-deactivate | API-16 | Admin attempts self-deactivation | `server/tests/lab-03/users-admin.api.test.ts` | 400 Bad Request | Pass |
| **BR-18** | Admin cannot remove last active Admin | API-17 | Admin deactivates last active Admin | `server/tests/lab-03/users-admin.api.test.ts` | 400 Bad Request | Pass |
| **BR-20** | Server-side authorization enforcement | E2E-01 | Full Auth, Queue, Detail, Admin flow | `e2e/lab-03/authentication.spec.ts` | All assertions pass | Pass |

---

## 3. Planned Automated Test Files

### Backend Unit & Integration Tests (`server/tests/lab-03/`)
- `auth.api.test.ts`
- `authorization.api.test.ts`
- `staff-queue.api.test.ts`
- `staff-ticket-detail.api.test.ts`
- `comments-notes.api.test.ts`
- `users-admin.api.test.ts`

### Frontend Component Tests (`client/src/pages/__tests__/`)
- `Login.test.tsx`
- `ChangePassword.test.tsx`
- `StaffTicketQueue.test.tsx`
- `StaffTicketDetail.test.tsx`
- `UserManagement.test.tsx`

### End-to-End Playwright Tests (`e2e/lab-03/`)
- `authentication.spec.ts`
- `staff-ticket-flow.spec.ts`
- `user-administration.spec.ts`
