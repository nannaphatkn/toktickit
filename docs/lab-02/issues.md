# Lab 2 Sprint Issues Breakdown

This document defines the 5 official sprint issues for **Lab 2 (Requester Ticketing MVP)**. Each issue represents an end-to-end feature slice with clear scope, tasks, branch names, and acceptance criteria traceability.

---

## 1️⃣ Issue 1: Database Schema, Migration & Seed Data (Backend Base)
- **Title:** `feat(db): Implement Prisma Schema, Migrations, and Seed Data for Lab 2`
- **Target Branch:** `feature/db-schema-and-seed`
- **Traceability:** FR-01, FR-02 (Database readiness)

### 📌 Description
Create and test the PostgreSQL Prisma Schema for Lab 2 models, run initial migrations, and provide reproducible seed scripts for categories, systems, and requesters.

### 🛠️ Tasks
- [ ] Define 5 Models in `server/prisma/schema.prisma`: `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, `Attachment`
- [ ] Define Enums: `Priority` (`LOW`, `MEDIUM`, `HIGH`), `TicketStatus` (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- [ ] Execute Migration: `npx prisma migrate dev --name init_lab2_schema`
- [ ] Write Seed Script (`server/prisma/seed.ts`):
  - 4 Active Requesters (`Jennifer Anderson`, `Michael Chen`, `Sarah Jenkins`, `David Kim`)
  - 1 Inactive Requester (`Robert Taylor` with `isActive: false`)
  - 4 Categories (`Hardware`, `Software`, `Account & Access`, `Network & Connectivity`)
  - 6 Related Systems (`Corporate Laptop`, `Email / Outlook`, `Campus Wi-Fi`, `Corporate VPN`, `ERP System`, `Desktop Monitor / Peripherals`)
- [ ] Add `npm run seed` command to `server/package.json`

### 🧪 Acceptance Criteria
- Schema validates via `npx prisma validate`.
- Migration applies cleanly to PostgreSQL.
- Seed script populates all reference data reproducibly.

---

## 2️⃣ Issue 2: Development Requester Selection & Context Header (FE/BE)
- **Title:** `feat(auth): Implement Development Requester Selector & Request Context Header`
- **Target Branch:** `feature/requester-selection`
- **Traceability:** AC-02, FR-01, FR-02, BR-03, BR-10

### 📌 Description
Implement the Development Requester selection mechanism on the frontend to allow identity switching during testing, and attach the `X-Requester-Id` header to all outgoing API requests.

### 🛠️ Tasks
- [ ] **Backend:** Implement `GET /api/requesters` returning only active requesters (`isActive: true`).
- [ ] **Frontend:** Build Header component with Requester Dropdown (Zen Green Theme).
- [ ] **State Management:** Store selected requester identity in React Context and `localStorage`.
- [ ] **API Interceptor:** Configure Axios/Fetch interceptor to attach `X-Requester-Id: <id>` header on every request.
- [ ] **Access Guard:** Redirect or prompt user to select a requester if none is currently active.

### 🧪 Acceptance Criteria
- [x] **AC-02:** Only active requesters are available in the selection dropdown.
- [x] Header `X-Requester-Id` updates dynamically upon requester selection.
- [x] Selected identity persists across browser page reloads.

---

## 3️⃣ Issue 3: Create Ticket Form with File Attachments (FE/BE)
- **Title:** `feat(ticket): Implement Create Ticket Form with File Attachment Uploads`
- **Target Branch:** `feature/create-ticket`
- **Traceability:** AC-01, AC-04, FR-03, FR-04, BR-01, BR-02, BR-04, BR-05, BR-06, BR-07, BR-11

### 📌 Description
Build the ticket submission form and attachment handling with client and server-side validations and single-transaction database rollbacks.

### 🛠️ Tasks
- [ ] **Backend:** Implement `POST /api/tickets` (Multipart/form-data) endpoint.
- [ ] **Ticket Number:** Auto-generate unique Ticket Number format `TKT-YYYY-XXXXXX` and set initial status `NEW`.
- [ ] **Database Transaction:** Execute Ticket creation and Attachment storage in a single transaction (Rollback if file storage fails).
- [ ] **Frontend Form:** Create Ticket page matching Zen Green UI Spec (Summary, Description, Category, Related System, Requested Priority).
- [ ] **Validation:**
  - Summary: 10–150 characters.
  - Description: 20–1000 characters.
  - Attachments: Maximum 5 files, <= 5 MB per file, allowed MIME types (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).

### 🧪 Acceptance Criteria
- [x] **AC-01:** Submitting valid form creates a Ticket and displays the official Ticket Number.
- [x] **AC-04:** Files exceeding 5MB or with invalid MIME types trigger validation errors and are rejected.
- [x] **BR-11:** Upload failures cause a complete transaction rollback (no orphaned tickets).

---

## 4️⃣ Issue 4: My Tickets List with Search, Filter & Pagination (FE/BE)
- **Title:** `feat(ticket): Implement My Tickets List with Search, Filter, and Pagination`
- **Target Branch:** `feature/my-tickets-list`
- **Traceability:** AC-03, AC-05, AC-07, FR-05, FR-06, FR-10

### 📌 Description
Construct the My Tickets dashboard listing only tickets owned by the active Requester, with support for searching, filtering, and pagination.

### 🛠️ Tasks
- [ ] **Backend:** Implement `GET /api/tickets` supporting `page`, `limit`, `search`, `categoryId`, `requestedPriority`, `currentStatus`, `sortBy`, `sortDesc`.
- [ ] **Access Enforcement:** Strict filtering using `X-Requester-Id` header (return only owned tickets).
- [ ] **Frontend View:** My Tickets page using Zen Green Table/Card layout.
- [ ] **Controls:**
  - Search bar (matches `ticketNumber` or `summary`).
  - Category & Priority filter dropdowns.
  - Pagination bar with total counts and page selection.

### 🧪 Acceptance Criteria
- [x] **AC-03:** Requester B cannot retrieve or see tickets belonging to Requester A.
- [x] **AC-05:** Loads tickets paginated, ordered by creation date (newest first).
- [x] **AC-07:** Search filters tickets correctly by summary or ticket number.

---

## 5️⃣ Issue 5: Ticket Detail View & Attachment Download / Soft-Remove (FE/BE)
- **Title:** `feat(ticket): Implement Ticket Detail View and Attachment Download/Soft-Removal`
- **Target Branch:** `feature/ticket-detail-and-attachments`
- **Traceability:** AC-03, AC-06, FR-07, FR-08, FR-09, BR-08, BR-09

### 📌 Description
Develop the read-only Ticket Detail page, secure file attachment downloading, and soft-removal functionality.

### 🛠️ Tasks
- [ ] **Backend:**
  - `GET /api/tickets/:id`: Fetch ticket detail (ownership check -> `403 Forbidden` / `404 Not Found`).
  - `GET /api/attachments/:id/download`: Stream file attachment (ownership check -> `403` / `404` / `410 Gone` if soft-removed).
  - `DELETE /api/attachments/:id`: Soft-remove attachment (`isRemoved = true`, record `removedAt`).
- [ ] **Frontend:**
  - Ticket Detail page (Read-only representation).
  - Attachment section showing active files (Download button) vs soft-removed files (Disabled/Removed badge).

### 🧪 Acceptance Criteria
- [x] **AC-03:** Accessing another requester's ticket returns HTTP 403 Forbidden or 404 Not Found.
- [x] **AC-06:** Soft-removing an attachment updates UI state and prevents further downloads.
- [x] **BR-09:** Soft-removed files cannot be downloaded or previewed.
