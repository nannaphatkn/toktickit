# Lab 04 REST API Specification — TokTickIT API Endpoints & Contracts

## 1. Base URL & Authentication

All endpoints are hosted at `/api`. Authentication is via JWT Bearer token or HTTP-Only Cookie (`toktickit_token`).

- `401 Unauthorized` — Missing or invalid token.
- `403 Forbidden` — Valid token but insufficient role or ownership.
- `404 Not Found` — Resource does not exist or is not visible to caller.
- `409 Conflict` — Stale-update detected (`updatedAt` mismatch).

---

## 2. Stale-Update Handling

PATCH requests that modify Ticket or ActionTaken records must include the caller's last-known `updatedAt` value in the request body. The server compares this value against the database record:
- If they match → proceed with update.
- If they differ → return `409 Conflict` with `{ "error": "Conflict", "message": "Record was modified by another user. Please refresh." }`.

---

## 3. Actions Taken Endpoints (`/api/tickets/:id/actions`)

### 3.1 GET `/api/tickets/:id/actions`

Retrieve all Actions Taken for a Ticket, sorted by `actionDateTime DESC`.

**Required Auth:** Authenticated user.  
**Authorization:**
- Requester: only if `ticket.requesterId === currentUser.id`.
- IT Staff / Administrator: any accessible Ticket.

**Response `200 OK`:**
```json
{
  "actions": [
    {
      "id": 1,
      "ticketId": 42,
      "actionDateTime": "2026-10-30T14:00:00Z",
      "actionDescription": "Replaced SSD on laptop.",
      "result": "System now boots correctly.",
      "performedBy": { "id": 10, "fullName": "Michael Brown" },
      "followUpRequired": true,
      "followUpNote": "Monitor for 3 days.",
      "attachmentNotes": "See image: ssd_replacement.jpg",
      "createdAt": "2026-10-30T14:10:00Z",
      "updatedAt": "2026-10-30T14:10:00Z"
    }
  ]
}
```

**Error Responses:**
- `403 Forbidden` — Requester accessing another Requester's ticket.
- `404 Not Found` — Ticket not found.

---

### 3.2 POST `/api/tickets/:id/actions`

Create a new Actions Taken record for a Ticket.

**Required Role:** `IT_STAFF` or `ADMINISTRATOR`.

**Request Body:**
```json
{
  "actionDateTime": "2026-10-30T14:00:00Z",
  "actionDescription": "Replaced SSD on laptop.",
  "result": "System now boots correctly.",
  "followUpRequired": true,
  "followUpNote": "Monitor for 3 days.",
  "attachmentNotes": "See image: ssd_replacement.jpg"
}
```

**Validation:**
- `actionDateTime`: required, valid ISO-8601, not in the future (> server UTC now).
- `actionDescription`: required, non-empty, non-whitespace.
- `result`: required, non-empty, non-whitespace.
- `followUpNote`: required (non-empty) when `followUpRequired = true`; ignored if `followUpRequired = false`.
- `attachmentNotes`: optional; if provided must be non-whitespace.
- `performedById`: **ignored** — always set from JWT identity.

**Response `201 Created`:**
```json
{
  "action": {
    "id": 5,
    "ticketId": 42,
    "actionDateTime": "2026-10-30T14:00:00Z",
    "actionDescription": "Replaced SSD on laptop.",
    "result": "System now boots correctly.",
    "performedBy": { "id": 10, "fullName": "Michael Brown" },
    "followUpRequired": true,
    "followUpNote": "Monitor for 3 days.",
    "attachmentNotes": "See image: ssd_replacement.jpg",
    "createdAt": "2026-10-30T14:10:00Z",
    "updatedAt": "2026-10-30T14:10:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Validation failure (missing field, future date, missing followUpNote).
- `403 Forbidden` — Requester role attempting to create.
- `404 Not Found` — Ticket not found.

---

### 3.3 PATCH `/api/tickets/:id/actions/:actionId`

Update an existing Actions Taken record.

**Authorization:**
- Original performer (`performedById === currentUser.id`): may update any field.
- Administrator: may update any field on any record.
- IT Staff (not original performer): `403 Forbidden`.

**Request Body:** (include only fields to update + `updatedAt` for conflict detection)
```json
{
  "updatedAt": "2026-10-30T14:10:00Z",
  "actionDescription": "Replaced SSD and reinstalled OS.",
  "result": "System fully restored.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "See images: ssd_replacement.jpg, os_install.jpg"
}
```

**Response `200 OK`:** Updated ActionTaken object (same shape as POST 201 response).

**Error Responses:**
- `400 Bad Request` — Validation failure.
- `403 Forbidden` — Not permitted to update.
- `404 Not Found` — Ticket or Action not found.
- `409 Conflict` — Stale update detected.

---

## 4. Dashboard Endpoints (`/api/dashboard`)

### 4.1 GET `/api/dashboard/requester`

Returns dashboard metrics scoped to the authenticated Requester's own tickets.

**Required Role:** `REQUESTER`.

**Response `200 OK`:**
```json
{
  "openTickets": 5,
  "waitingForRequester": 2,
  "recentlyUpdated": 3,
  "recentlyResolved": 1,
  "recentTickets": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "currentStatus": "IN_PROGRESS",
      "updatedAt": "2026-10-29T10:00:00Z"
    }
  ]
}
```

**Metric Definitions:**
- `openTickets`: tickets where `requesterId = currentUser.id` AND `currentStatus NOT IN (RESOLVED, CLOSED, CANCELLED)`.
- `waitingForRequester`: tickets where `requesterId = currentUser.id` AND `currentStatus = WAITING_FOR_REQUESTER`.
- `recentlyUpdated`: tickets where `requesterId = currentUser.id` AND `updatedAt >= (now - 7 days)`.
- `recentlyResolved`: tickets where `requesterId = currentUser.id` AND `currentStatus = RESOLVED` AND `updatedAt >= (now - 7 days)`.
- `recentTickets`: up to 5 tickets sorted by `updatedAt DESC` where `requesterId = currentUser.id` AND `updatedAt >= (now - 7 days)`.

**Error Responses:**
- `403 Forbidden` — IT Staff or Administrator accessing Requester-only endpoint.

---

### 4.2 GET `/api/dashboard/staff`

Returns dashboard metrics for IT Staff and Administrator roles.

**Required Role:** `IT_STAFF` or `ADMINISTRATOR`.

**Response `200 OK`:**
```json
{
  "unassigned": 8,
  "myTickets": 4,
  "byStatus": {
    "NEW": 3,
    "OPEN": 5,
    "IN_PROGRESS": 7,
    "WAITING_FOR_REQUESTER": 2,
    "RESOLVED": 10,
    "CLOSED": 20,
    "REOPENED": 1,
    "CANCELLED": 3
  },
  "byPriority": {
    "LOW": 5,
    "MEDIUM": 18,
    "HIGH": 10,
    "URGENT": 4
  },
  "recentTickets": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "currentStatus": "IN_PROGRESS",
      "itPriority": "HIGH",
      "owner": { "id": 10, "fullName": "Michael Brown" },
      "updatedAt": "2026-10-29T10:00:00Z"
    }
  ]
}
```

**Metric Definitions:**
- `unassigned`: tickets where `ownerId IS NULL` AND `currentStatus NOT IN (RESOLVED, CLOSED, CANCELLED)`.
- `myTickets`: tickets where `ownerId = currentUser.id` AND `currentStatus NOT IN (RESOLVED, CLOSED, CANCELLED)`.
- `byStatus`: count of ALL tickets grouped by `currentStatus`.
- `byPriority`: count of ALL tickets grouped by `itPriority`.
- `recentTickets`: up to 10 tickets sorted by `updatedAt DESC` where `updatedAt >= (now - 7 days)`.

**Error Responses:**
- `403 Forbidden` — Requester accessing staff-only endpoint.

---

## 5. Continued Lab 2 & Lab 3 Endpoints

All previously defined endpoints remain active and unchanged:

| Endpoint | Lab |
|----------|-----|
| `POST /api/auth/login` | Lab 3 |
| `POST /api/auth/change-password` | Lab 3 |
| `GET /api/auth/me` | Lab 3 |
| `POST /api/auth/logout` | Lab 3 |
| `GET /api/tickets` | Lab 2 |
| `POST /api/tickets` | Lab 2 |
| `GET /api/tickets/:id` | Lab 2 |
| `PATCH /api/tickets/:id` | Lab 2 |
| `GET /api/tickets/:id/attachments` | Lab 2 |
| `POST /api/tickets/:id/attachments` | Lab 2 |
| `DELETE /api/tickets/:id/attachments/:attachId` | Lab 2 |
| `GET /api/tickets/:id/comments` | Lab 3 |
| `POST /api/tickets/:id/comments` | Lab 3 |
| `GET /api/tickets/:id/notes` | Lab 3 |
| `POST /api/tickets/:id/notes` | Lab 3 |
| `GET /api/staff/tickets` | Lab 3 |
| `GET /api/staff/tickets/:id` | Lab 3 |
| `PATCH /api/staff/tickets/:id/assign` | Lab 3 |
| `PATCH /api/staff/tickets/:id/priority` | Lab 3 |
| `PATCH /api/staff/tickets/:id/status` | Lab 3 |
| `GET /api/admin/users` | Lab 3 |
| `POST /api/admin/users` | Lab 3 |
| `PATCH /api/admin/users/:id` | Lab 3 |
| `POST /api/admin/users/:id/reset-password` | Lab 3 |

---

## 6. Status Transition Enforcement Contract

The `PATCH /api/staff/tickets/:id/status` endpoint must validate the requested transition against the matrix in `specification.md` (BR-09). Invalid transitions return:

```json
HTTP 400 Bad Request
{
  "error": "InvalidStatusTransition",
  "message": "Cannot transition from IN_PROGRESS to NEW."
}
```

---

## 7. Authorization Summary for Lab 4 APIs

| Operation | Requester (owner) | Requester (non-owner) | IT Staff | Administrator |
|-----------|-------------------|----------------------|----------|---------------|
| GET actions for ticket | ✅ | ❌ 403 | ✅ | ✅ |
| POST action on ticket | ❌ 403 | ❌ 403 | ✅ | ✅ |
| PATCH own action | ❌ 403 | ❌ 403 | ✅ | ✅ |
| PATCH other's action | ❌ 403 | ❌ 403 | ❌ 403 | ✅ |
| GET /dashboard/requester | ✅ | ✅ | ❌ 403 | ❌ 403 |
| GET /dashboard/staff | ❌ 403 | ❌ 403 | ✅ | ✅ |
