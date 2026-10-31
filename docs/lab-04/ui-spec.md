# Lab 04 UI Specification — TokTickIT Design System & UI States

## 1. Design System (Zen Green — Unchanged from Lab 2 & 3)

All Lab 4 screens MUST comply with the established Zen Green design language:

- **Primary Color:** `#006B3C` (Zen Green)
- **Accent / Surface Tint:** `#E8F5E9` (Soft Sage)
- **Danger:** `bg-rose-600` / `#E53E3E`
- **Typography:** Inter, system-ui, sans-serif
- **Card Surface:** White background, `rounded-xl`, `shadow-sm`, `border border-slate-200`
- **Primary Button:** `bg-[#006B3C] hover:bg-[#00542f] text-white`
- **Secondary Button:** `border border-slate-300 bg-white text-slate-700`
- **Danger Button:** `bg-rose-600 hover:bg-rose-700 text-white`

### Status Badges (unchanged)
| Status | Style |
|--------|-------|
| NEW | `bg-sky-100 text-sky-800 border-sky-200` |
| OPEN | `bg-cyan-100 text-cyan-800 border-cyan-200` |
| IN_PROGRESS | `bg-amber-100 text-amber-800 border-amber-200` |
| WAITING_FOR_REQUESTER | `bg-purple-100 text-purple-800 border-purple-200` |
| RESOLVED | `bg-emerald-100 text-emerald-800 border-emerald-200` |
| CLOSED | `bg-slate-100 text-slate-700 border-slate-200` |
| REOPENED | `bg-orange-100 text-orange-800 border-orange-200` |
| CANCELLED | `bg-rose-100 text-rose-800 border-rose-200` |

### Priority Badges (unchanged)
| Priority | Style |
|----------|-------|
| LOW | `bg-slate-100 text-slate-700` |
| MEDIUM | `bg-blue-100 text-blue-800` |
| HIGH | `bg-amber-100 text-amber-800` |
| URGENT | `bg-rose-100 text-rose-800 font-semibold` |

---

## 2. Navigation Bar Updates

- **Requester Nav:** Home | My Tickets | **Dashboard** (new) | Logout
- **IT Staff Nav:** Dashboard (new) | Ticket Queue | Logout
- **Administrator Nav:** Dashboard (new) | Ticket Queue | User Management | Logout
- Active page: Zen Green underline or solid indicator on current route.
- Remove any temporary, duplicate, or obsolete nav items from earlier labs.

---

## 3. New Screens — Lab 4

### 3.1 IT Staff Dashboard (`/staff/dashboard`)

**Layout:** Responsive grid of metric cards + recent tickets list.

#### Metric Cards (row of 4 on desktop, 2×2 on tablet, stacked on mobile)
| Card | Metric | Drill-Down Link |
|------|--------|-----------------|
| Unassigned | Count of tickets with no owner | `/staff/queue?owner=unassigned` |
| My Tickets | Count of tickets assigned to current user | `/staff/queue?owner=me` |
| Open / In Progress | Count of tickets in OPEN or IN_PROGRESS | `/staff/queue?status=OPEN,IN_PROGRESS` |
| Urgent Priority | Count of tickets with `itPriority = URGENT` | `/staff/queue?priority=URGENT` |

**Card anatomy:**
- Large numeric value (e.g., `24`)
- Small label below (e.g., "Unassigned Tickets")
- Subtle icon in card corner
- Clickable — navigates to drill-down on click
- Hover: slight shadow lift `shadow-md`

#### Status Breakdown Section
- Horizontal bar or badge group showing count per status.
- Clicking a status badge drills down to `/staff/queue?status=<STATUS>`.

#### Recent Tickets List
- Last 5–10 tickets updated within 7 days.
- Columns: Ticket No., Summary (truncated), Status badge, IT Priority badge, Updated At.
- Clicking a row navigates to `/staff/tickets/:id`.

#### States
- **Loading:** Skeleton cards (animated pulse) in place of metric cards and list rows.
- **Empty:** Friendly illustration + "No tickets to show" message per card / section.
- **Forbidden:** Shown when a non-IT Staff / Admin role accesses; display `403 Access Denied` card.
- **Error:** Generic safe-failure card: "Unable to load dashboard. Please try again."

---

### 3.2 Requester Dashboard (`/dashboard`)

**Layout:** Compact summary above the My Tickets list; not a replacement for My Tickets.

#### Metric Cards (row of 4 on desktop, 2×2 on tablet, stacked on mobile)
| Card | Metric | Drill-Down Link |
|------|--------|-----------------|
| Open Tickets | Count of Requester's tickets not in RESOLVED/CLOSED/CANCELLED | `/my-tickets` |
| Waiting for You | Count with status = WAITING_FOR_REQUESTER | `/my-tickets?status=WAITING_FOR_REQUESTER` |
| Recently Updated | Count updated in last 7 days | `/my-tickets` |
| Recently Resolved | Count resolved in last 7 days | `/my-tickets?status=RESOLVED` |

#### Recent Tickets List
- Last 5 tickets updated within 7 days, sorted by `updatedAt DESC`.
- Columns: Ticket No., Summary, Status badge, Updated At.
- Clicking navigates to `/my-tickets/:id`.

#### States
- Same loading, empty, error patterns as IT Staff Dashboard.
- **Ownership protection**: metrics are always scoped to the authenticated Requester — the server enforces this.

---

### 3.3 Actions Taken on IT Staff Ticket Detail

**Placement:** Below the existing Public Comments / Internal Notes tab section on `/staff/tickets/:id`.

#### List View (all roles that can access the ticket)
- Section header: "Actions Taken" with count badge.
- Table (Desktop): columns — #, Date/Time, Performed By, Description (truncated), Result (truncated), Follow-Up?, Actions (Edit for permitted users).
- Cards (Mobile): one card per Action Taken; expands to show full fields.
- Sorted: most recent first.
- Empty state: "No actions recorded yet."

#### Create Mode (IT Staff / Administrator only)
- "Add Action" primary button visible for IT Staff / Admin.
- Inline form or slide-over panel with fields:
  - **Action Date/Time** — datetime-local input, defaults to now, must not exceed server time.
  - **Action Description** — textarea, required, min 1 char.
  - **Result** — textarea, required, min 1 char.
  - **Follow-Up Required?** — toggle/checkbox.
  - **Follow-Up Note** — textarea, visible and required when Follow-Up Required = ON.
  - **Attachment Notes** — textarea, optional.
- Submit: "Save Action" button (primary). Cancel: dismisses form.
- Validation: inline field-level error messages.
- Success: form collapses, new entry appears at top of list.

#### Edit Mode (Original performer or Administrator)
- "Edit" action button per row (shown only to original performer and Admin).
- Same fields as Create Mode, pre-populated.
- Submit: "Update Action" button.

#### Requester View
- Actions Taken section visible to Requester (owner of the ticket).
- All fields shown in read-only mode.
- No "Add Action" or "Edit" buttons rendered or accessible.

---

### 3.4 Ticket Workflow Controls (Updated)

- Status dropdown / buttons show **only permitted next statuses** from the transition matrix.
- Disallowed targets are hidden (not merely disabled) from the UI.
- After a successful status change: Ticket header status badge and status controls refresh without full page reload.
- Conflict (409): user sees toast — "This ticket was recently updated. Please refresh and try again."

---

## 4. Existing Screens — Hardening Checklist

The following screens from earlier labs must be reviewed and hardened:

| Screen | Required Checks |
|--------|----------------|
| Login (`/login`) | No console errors, correct error messages, loading state works |
| Change Password (`/change-password`) | Password rules enforce, success redirects correctly |
| My Tickets (`/my-tickets`) | Pagination correct, filters work, no ghost requester selector |
| Ticket Create (`/my-tickets/create`) | Validation, success, form data preserved on recoverable failure |
| Ticket Detail - Requester (`/my-tickets/:id`) | Attachments, comments, resolved flag, read-only Actions Taken |
| Staff Queue (`/staff/queue`) | Search, filter, sort, pagination; no stale data |
| Staff Ticket Detail (`/staff/tickets/:id`) | Claim, assign, IT Priority, status, comments, notes, Actions Taken |
| Admin User Management (`/admin/users`) | CRUD, safety rules, reset password — all pass |

---

## 5. Responsive Rules

| Breakpoint | Layout |
|------------|--------|
| Desktop ≥ 1024 px | Multi-column metric grid, table views, sticky nav |
| Tablet 768–1023 px | 2-column metric grid, collapsible filter drawer, flexible detail layout |
| Mobile < 768 px | Single-column stacked layout, full-width buttons, card-based lists, tap targets ≥ 44 × 44 px |

**No horizontal scrolling permitted on any breakpoint.**

---

## 6. Accessibility Requirements (Same as Labs 2 & 3)

- All interactive elements keyboard-navigable (Tab / Enter / Space / Escape).
- Visible focus rings on all focusable elements.
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<table>`, `<form>`, `<button>`.
- ARIA labels on icon-only buttons and status badges.
- Colour is never the only status indicator (badge text or icon required).
- Modal dialogs trap focus; Escape closes them.

---

## 7. Visual & Accessibility Checklist (for PDF submission — Part 9)

- [ ] Zen Green primary colour consistent on all new screens
- [ ] Status and priority badges use correct colour system
- [ ] Dashboard metric cards have labels, values, and accessible drill-down actions
- [ ] Actions Taken: editable fields clearly distinguished from read-only fields
- [ ] Validation errors placed inline, not only in a banner
- [ ] Keyboard focus visible on all controls
- [ ] No clipping, overlapping, or horizontal overflow at any breakpoint
- [ ] Desktop, tablet, and mobile screenshots captured for all major Lab 4 screens
