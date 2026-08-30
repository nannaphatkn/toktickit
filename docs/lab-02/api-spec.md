# Lab 2 API Specification

## Overview
This document specifies the REST API contract for the Requester ticketing experience in Lab 2.
All endpoints assume the `requesterId` is either passed in headers (e.g., `X-Requester-Id`) or body/query params depending on the endpoint, to simulate an authenticated session context. 

For Lab 2, we will use a custom header `X-Requester-Id` to simulate the logged-in user making the request.

---

## 1. Reference Data & Requesters

### 1.1 Retrieve Active Requesters
**GET** `/api/requesters`
- **Purpose:** Load active requesters for the Development Requester Selection screen.
- **Request:** None.
- **Response (200 OK):**
```json
[
  { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.a@example.com", "isActive": true },
  { "id": 2, "name": "Michael Brown", "email": "michael.b@example.com", "isActive": true }
]
```

### 1.2 Retrieve Categories
**GET** `/api/categories`
- **Purpose:** Populate Category dropdown in Create Ticket.
- **Response (200 OK):**
```json
[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" }
]
```

### 1.3 Retrieve Related Systems
**GET** `/api/related-systems`
- **Purpose:** Populate Related System dropdown.
- **Response (200 OK):**
```json
[
  { "id": 1, "name": "Corporate Laptop" },
  { "id": 2, "name": "VPN" }
]
```

---

## 2. Tickets

### 2.1 Create a Ticket
**POST** `/api/tickets`
- **Headers:** `X-Requester-Id: 1`
- **Content-Type:** `multipart/form-data`
- **Purpose:** Create a ticket and upload optional attachments in a single transaction.
- **Request Body (Form Data):**
  - `summary` (string, 10-150 chars)
  - `description` (string, 20-1000 chars)
  - `categoryId` (number)
  - `relatedSystemId` (number)
  - `requestedPriority` (string: "LOW", "MEDIUM", "HIGH")
  - `attachments` (File[], max 5 files, 5MB limit each, allowed types: jpg, png, webp, pdf)
- **Response (201 Created):**
```json
{
  "id": 12,
  "ticketNumber": "TKT-2025-001234",
  "summary": "Laptop battery drains quickly",
  "currentStatus": "NEW",
  "createdAt": "2025-05-12T09:14:00Z"
}
```
- **Errors:**
  - `400 Bad Request`: Validation failure (e.g., summary too short, file too large, unsupported type).
  - `401 Unauthorized`: Missing `X-Requester-Id`.

### 2.2 Retrieve My Tickets (Paginated List)
**GET** `/api/tickets`
- **Headers:** `X-Requester-Id: 1`
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 10, max: 50)
  - `search` (string, optional - searches summary or ticketNumber)
  - `categoryId` (number, optional)
  - `requestedPriority` (string, optional)
  - `currentStatus` (string, optional)
  - `sortBy` (string, default: "createdAt")
  - `sortDesc` (boolean, default: true)
- **Response (200 OK):**
```json
{
  "data": [
    {
      "id": 12,
      "ticketNumber": "TKT-2025-001234",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "MEDIUM",
      "itPriority": null,
      "currentStatus": "NEW",
      "createdAt": "2025-05-12T09:14:00Z",
      "updatedAt": "2025-05-12T09:14:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```
- **Errors:**
  - `400 Bad Request`: Invalid query parameters.
  - `401 Unauthorized`: Missing `X-Requester-Id`.

### 2.3 Retrieve Ticket Detail
**GET** `/api/tickets/:id`
- **Headers:** `X-Requester-Id: 1`
- **Purpose:** Retrieve full details for View Mode, including attachment metadata.
- **Response (200 OK):**
```json
{
  "id": 12,
  "ticketNumber": "TKT-2025-001234",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual...",
  "category": { "id": 1, "name": "Hardware" },
  "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
  "requestedPriority": "MEDIUM",
  "itPriority": null,
  "currentStatus": "NEW",
  "requester": { "id": 1, "name": "Jennifer Anderson" },
  "createdAt": "2025-05-12T09:14:00Z",
  "attachments": [
    {
      "id": 101,
      "originalName": "battery-report.pdf",
      "fileSize": 1048576,
      "isRemoved": false
    }
  ]
}
```
- **Errors:**
  - `404 Not Found`: Ticket does not exist.
  - `403 Forbidden`: Ticket exists but belongs to a different requester.
  - `401 Unauthorized`: Missing `X-Requester-Id`.

---

## 3. Attachments

### 3.1 Download Attachment
**GET** `/api/attachments/:id/download`
- **Headers:** `X-Requester-Id: 1`
- **Purpose:** Download an active attachment.
- **Response (200 OK):** File stream with appropriate `Content-Disposition: attachment; filename="..."` and `Content-Type`.
- **Errors:**
  - `404 Not Found`: Attachment does not exist.
  - `403 Forbidden`: Attachment belongs to a ticket owned by someone else.
  - `410 Gone`: Attachment has been soft-removed.

### 3.2 Soft-Remove Attachment
**DELETE** `/api/attachments/:id`
- **Headers:** `X-Requester-Id: 1`
- **Purpose:** Soft-remove an attachment (sets `isRemoved = true`).
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Attachment removed successfully"
}
```
- **Errors:**
  - `404 Not Found`: Attachment does not exist.
  - `403 Forbidden`: Attachment belongs to a ticket owned by someone else.
  - `400 Bad Request`: Attachment is already removed.
