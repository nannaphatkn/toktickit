# Lab 03 REST API Specification — TokTickIT API Endpoints & Contracts

## 1. Base URL & Authentication

All API endpoints are hosted at `/api`.

### Session & Token Handling
- Authentication is maintained via JSON Web Tokens (JWT) or HTTP Bearer header (`Authorization: Bearer <token>`) / HTTP-Only Cookie (`toktickit_token`).
- Unauthenticated requests to protected endpoints return `401 Unauthorized`.
- Authenticated requests that violate role or ownership permissions return `403 Forbidden`.

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 POST `/api/auth/login`
- **Description:** Authenticates user credentials.
- **Request Body:**
  ```json
  {
    "email": "user@toktickit.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr-1001",
      "email": "user@toktickit.com",
      "fullName": "Jennifer Anderson",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email/password or account is inactive (`isActive: false`).

### 2.2 POST `/api/auth/change-password`
- **Description:** Changes current user's password (required for `mustChangePassword = true`).
- **Request Body:**
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Password changed successfully",
    "mustChangePassword": false
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Password doesn't meet complexity criteria or current password incorrect.

### 2.3 GET `/api/auth/me`
- **Description:** Returns profile of current authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** User object.

### 2.4 POST `/api/auth/logout`
- **Description:** Clears session token / cookie.
- **Response `200 OK`:** `{ "message": "Logged out successfully" }`.

---

## 3. IT Staff Ticket Queue & Management Endpoints (`/api/staff/tickets`)

### 3.1 GET `/api/staff/tickets`
- **Description:** Retrieves paginated list of all tickets for IT Staff queue.
- **Query Parameters:**
  - `search` (optional string)
  - `category` (optional string)
  - `status` (optional string)
  - `priority` (optional string: LOW | MEDIUM | HIGH | URGENT)
  - `owner` (optional string: `all` | `me` | `unassigned` | `<userId>`)
  - `page` (default `1`)
  - `limit` (default `10`)
  - `sortBy` (default `createdAt`)
  - `sortOrder` (default `desc`)
- **Required Role:** `IT_STAFF` or `ADMINISTRATOR`
- **Response `200 OK`:**
  ```json
  {
    "tickets": [
      {
        "id": "tkt-001",
        "ticketNumber": "TKT-2026-000001",
        "summary": "Laptop battery drains quickly",
        "category": { "name": "Hardware" },
        "requestedPriority": "MEDIUM",
        "itPriority": "MEDIUM",
        "status": "IN_PROGRESS",
        "requester": { "id": "usr-1", "fullName": "Jennifer Anderson" },
        "owner": { "id": "usr-10", "fullName": "Michael Brown" },
        "createdAt": "2026-05-12T09:14:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 87,
      "totalPages": 9
    }
  }
  ```

### 3.2 GET `/api/staff/tickets/:id`
- **Description:** Retrieves ticket details including owner, IT priority, requester info.
- **Required Role:** `IT_STAFF` or `ADMINISTRATOR`

### 3.3 PATCH `/api/staff/tickets/:id/assign`
- **Description:** Claims ticket or reassigns ownership to another active IT Staff / Admin user.
- **Request Body:** `{ "ownerId": "usr-10" }` (or `null` to unassign)
- **Required Role:** `IT_STAFF` or `ADMINISTRATOR`

### 3.4 PATCH `/api/staff/tickets/:id/priority`
- **Description:** Updates IT Priority of a ticket.
- **Request Body:** `{ "itPriority": "HIGH" }`
- **Required Role:** `IT_STAFF` or `ADMINISTRATOR`

### 3.5 PATCH `/api/staff/tickets/:id/status`
- **Description:** Updates ticket status according to allowed transition workflow.
- **Request Body:** `{ "status": "RESOLVED", "resolutionSummary": "Replaced battery pack." }`
- **Required Role:** `IT_STAFF` or `ADMINISTRATOR`

---

## 4. Public Comments & Internal Notes Endpoints (`/api/tickets/:id/...`)

### 4.1 GET `/api/tickets/:id/comments`
- **Description:** Retrieves public comments on ticket.
- **Access:** Requester (if owner of ticket), IT Staff, Administrator.

### 4.2 POST `/api/tickets/:id/comments`
- **Description:** Adds public comment to ticket.
- **Request Body:** `{ "content": "Thank you for the update!" }`
- **Access:** Requester (if owner of ticket), IT Staff, Administrator.

### 4.3 GET `/api/tickets/:id/notes`
- **Description:** Retrieves private internal notes.
- **Access:** `IT_STAFF` or `ADMINISTRATOR` ONLY. Requesters receive `403 Forbidden`.

### 4.4 POST `/api/tickets/:id/notes`
- **Description:** Adds private internal note to ticket.
- **Request Body:** `{ "content": "Checked diagnostics - hardware fault confirmed." }`
- **Access:** `IT_STAFF` or `ADMINISTRATOR` ONLY. Requesters receive `403 Forbidden`.

---

## 5. Administrator User Management Endpoints (`/api/admin/users`)

### 5.1 GET `/api/admin/users`
- **Description:** Retrieves list of users with search and role filter.
- **Query Parameters:** `search`, `role`
- **Required Role:** `ADMINISTRATOR` ONLY.

### 5.2 POST `/api/admin/users`
- **Description:** Creates a new user account with initial password.
- **Request Body:**
  ```json
  {
    "fullName": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "initialPassword": "Password123!"
  }
  ```
- **Required Role:** `ADMINISTRATOR` ONLY.

### 5.3 PATCH `/api/admin/users/:id`
- **Description:** Updates existing user account details (name, email, role, active status).
- **Request Body:** `{ "fullName": "Alex T.", "role": "IT_STAFF", "isActive": false }`
- **Required Role:** `ADMINISTRATOR` ONLY.
- **Safety Validations:**
  - Prevents deactivating currently logged-in Admin account (`400 Bad Request`).
  - Prevents deactivating the last active Admin in the system (`400 Bad Request`).

### 5.4 POST `/api/admin/users/:id/reset-password`
- **Description:** Sets a new initial password for a user account, setting `mustChangePassword = true`.
- **Request Body:** `{ "initialPassword": "NewTempPass123!" }`
- **Required Role:** `ADMINISTRATOR` ONLY.
