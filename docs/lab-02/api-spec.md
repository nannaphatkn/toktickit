# Lab 2 Phase 1 – API Specification (`api-spec.md`)

## 1️⃣ Overview
This document defines the **REST API contract** for the **Requester Ticketing MVP** (Lab 2). All endpoints assume a **simulated authentication** via a custom request header `X-Requester-Id` that carries the numeric ID of the currently selected Development Requester (provided by the dropdown on the front‑end). The API follows standard JSON‑API conventions and returns proper HTTP status codes for success and error cases.

---

## 2️⃣ Common Conventions
| Aspect | Convention |
|--------|------------|
| **Base URL** | `/api` (relative to the server root) |
| **Content‑Type** | `application/json` for JSON bodies; `multipart/form-data` for file uploads |
| **Authentication Header** | `X-Requester-Id: <number>` – required on every endpoint (except public reference data) |
| **Error Payload** | ```json { "error": "<human readable message>", "details": { ... } } ``` |
| **Success Payload** | Varies per endpoint – see each section |
| **Pagination** | `page` (1‑based) and `limit` query params; response includes `meta` object with `total`, `page`, `limit`, `totalPages` |
| **Filtering** | Query parameters as described per endpoint (e.g., `search`, `categoryId`, `requestedPriority`) |
| **Sorting** | `sortBy` (field name) and `sortDesc` (`true`/`false`) |
| **File Size Limit** | 5 MiB per attachment |
| **Allowed File Types** | `jpg`, `jpeg`, `png`, `webp`, `pdf` |

---

## 3️⃣ Reference Data & Requester Endpoints
| Method | Path | Description | Response |
|--------|------|-------------|----------|
| **GET** | `/api/requesters` | Retrieve all **active** requesters for the Development Requester selector. | `200 OK` – array of `{ id, name, email, isActive }` |
| **GET** | `/api/categories` | List ticket categories (e.g., Hardware, Software). | `200 OK` – array of `{ id, name }` |
| **GET** | `/api/related-systems` | List related systems (e.g., Email, VPN). | `200 OK` – array of `{ id, name }` |

All three endpoints **do not require** `X-Requester-Id`.

---

## 4️⃣ Ticket Endpoints
### 4.1 Create Ticket
- **Method**: `POST`
- **Path**: `/api/tickets`
- **Headers**: `X-Requester-Id: <number>`
- **Content‑Type**: `multipart/form-data`
- **Form Fields**:
  - `summary` (string, 10‑150 chars, required)
  - `description` (string, 20‑1000 chars, required)
  - `categoryId` (number, required)
  - `relatedSystemId` (number, required)
  - `requestedPriority` (enum: `LOW`, `MEDIUM`, `HIGH`, required)
  - `attachments` (file[], optional, max 5 files, each ≤ 5 MiB, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`)
- **Success**: `201 Created`
```json
{
  "id": 12,
  "ticketNumber": "TKT-2025-001234",
  "summary": "Laptop battery drains quickly",
  "currentStatus": "NEW",
  "createdAt": "2025-05-12T09:14:00Z"
}
```
- **Errors**:
  - `400 Bad Request` – validation failure (missing fields, summary length, unsupported file type/size, >5 attachments)
  - `401 Unauthorized` – missing or invalid `X-Requester-Id`
  - `500 Internal Server Error` – unexpected failure (transaction rollback will be performed)

### 4.2 List My Tickets (Paginated)
- **Method**: `GET`
- **Path**: `/api/tickets`
- **Headers**: `X-Requester-Id: <number>`
- **Query Parameters**:
  - `page` (number, default 1)
  - `limit` (number, default 10, max 50)
  - `search` (string, optional – matches `summary` or `ticketNumber`)
  - `categoryId` (number, optional)
  - `requestedPriority` (enum, optional)
  - `currentStatus` (enum, optional)
  - `sortBy` (string, default `createdAt`)
  - `sortDesc` (boolean, default true)
- **Success**: `200 OK`
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
    // …more tickets
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```
- **Errors**:
  - `400 Bad Request` – invalid query parameters
  - `401 Unauthorized` – missing/invalid requester header

### 4.3 Retrieve Ticket Detail
- **Method**: `GET`
- **Path**: `/api/tickets/:id`
- **Headers**: `X-Requester-Id: <number>`
- **Success**: `200 OK`
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
    // …more attachments
  ]
}
```
- **Errors**:
  - `404 Not Found` – ticket does not exist
  - `403 Forbidden` – ticket belongs to another requester
  - `401 Unauthorized` – missing requester header

---

## 5️⃣ Attachment Endpoints
### 5.1 Add Attachment to an Existing Ticket
- **Method**: `POST`
- **Path**: `/api/tickets/:id/attachments`
- **Headers**: `X-Requester-Id: <number>`
- **Body**: `multipart/form-data` with one `file` field.
- **Success**: `201 Created` – persists the attachment metadata and returns the attachment record.
- **Validation**: maximum 5 active attachments per ticket; each file must be ≤ 5 MiB and use JPG/JPEG, PNG, WEBP, or PDF MIME/extension.
- **Errors**:
  - `400 Bad Request` – missing file, invalid type/size, or active attachment limit reached
  - `403 Forbidden` – ticket belongs to another requester
  - `404 Not Found` – ticket does not exist

### 5.2 Download Attachment
- **Method**: `GET`
- **Path**: `/api/attachments/:id/download`
- **Headers**: `X-Requester-Id: <number>`
- **Success**: `200 OK` – streams the file with `Content‑Disposition: attachment; filename="<originalName>"` and correct `Content‑Type`
- **Errors**:
  - `404 Not Found` – attachment does not exist
  - `403 Forbidden` – attachment belongs to a ticket owned by another requester
  - `410 Gone` – attachment has been **soft‑removed** (still in DB but not downloadable)

### 5.3 Soft‑Remove Attachment
- **Method**: `DELETE`
- **Path**: `/api/attachments/:id`
- **Headers**: `X-Requester-Id: <number>`
- **Body**: JSON `{ "removalReason": "<3–500 character reason>" }`.
- **Success**: `200 OK`
```json
{ "success": true, "message": "Attachment removed successfully" }
```
- **Errors**:
  - `404 Not Found` – attachment does not exist
  - `403 Forbidden` – attachment belongs to another requester
  - `400 Bad Request` – attachment already marked `isRemoved = true` or the removal reason is invalid

---

## 6️⃣ Validation Rules (summary for quick reference)
| Field | Rule |
|-------|------|
| `summary` | required, 10‑150 characters |
| `description` | required, 20‑1000 characters |
| `categoryId` / `relatedSystemId` | required, must exist in reference tables |
| `requestedPriority` | required, one of `LOW`, `MEDIUM`, `HIGH` |
| `attachments[]` | max 5 files, each ≤ 5 MiB, MIME type in allowed list |
| `X-Requester-Id` | required on all protected routes; must correspond to an active requester |

---

## 7️⃣ Sample cURL Requests (for documentation)
```bash
# Create ticket with two attachments
curl -X POST http://localhost:3000/api/tickets \
  -H "X-Requester-Id: 1" \
  -F "summary=Battery drains fast" \
  -F "description=My laptop battery dies after 30 min" \
  -F "categoryId=1" \
  -F "relatedSystemId=1" \
  -F "requestedPriority=MEDIUM" \
  -F "attachments=@/path/to/report.pdf" \
  -F "attachments=@/path/to/screenshot.png"

# List my tickets, page 2, 15 per page, filtered by category 3
curl -X GET "http://localhost:3000/api/tickets?page=2&limit=15&categoryId=3" \
  -H "X-Requester-Id: 1"

# Download an attachment
curl -X GET http://localhost:3000/api/attachments/101/download \
  -H "X-Requester-Id: 1" -OJ

# Soft‑remove an attachment
curl -X DELETE http://localhost:3000/api/attachments/101 \
  -H "X-Requester-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{"removalReason":"No longer needed"}'
```

---

## 8️⃣ Versioning & Future Extensions
- Current version: **v1.0** – stable for Lab 2.
- Future labs (Lab 3, Lab 4) will extend this contract with **staff workflow**, **role‑based JWT auth**, and **comment/notification** endpoints. The existing endpoints will remain backward compatible.

---

*All API contracts are written **before** implementation (TDD). The failing tests will verify that each contract is respected once the code is merged.*
