# Lab 03 UI Specification — TokTickIT Design System & UI States

## 1. Design System & Theme Principles (Zen Green)

TokTickIT uses the **Zen Green** design language established in Lab 2. All new screens in Lab 3 MUST strictly comply with this design system:

- **Primary Color:** Zen Green (`#006B3C` / `bg-emerald-800` / `text-emerald-800`)
- **Accent Color:** Muted Sage / Forest Tint (`#E8F5E9` / `#2E7D32`)
- **Typography:** Inter, system-ui, sans-serif
- **Card & Surface Styling:** White backgrounds with standard border radius (`rounded-xl`), subtle shadows (`shadow-sm`), and clean border separators (`border-slate-200`).
- **Button Conventions:**
  - Primary Action: Deep Zen Green solid button (`bg-[#006B3C]` hover `bg-[#00542f]` text-white).
  - Secondary Action: Outline or soft grey (`border border-slate-300` or `bg-slate-100 text-slate-700`).
  - Danger Action: Red accent (`bg-rose-600` text-white).

## 2. Status & Priority Badges

### Status Badges
- **NEW**: Blue badge (`bg-sky-100 text-sky-800 border-sky-200`)
- **OPEN**: Cyan badge (`bg-cyan-100 text-cyan-800 border-cyan-200`)
- **IN_PROGRESS**: Amber badge (`bg-amber-100 text-amber-800 border-amber-200`)
- **WAITING_FOR_REQUESTER**: Purple badge (`bg-purple-100 text-purple-800 border-purple-200`)
- **RESOLVED**: Emerald badge (`bg-emerald-100 text-emerald-800 border-emerald-200`)
- **CLOSED**: Slate badge (`bg-slate-100 text-slate-700 border-slate-200`)
- **REOPENED**: Orange badge (`bg-orange-100 text-orange-800 border-orange-200`)
- **CANCELLED**: Rose badge (`bg-rose-100 text-rose-800 border-rose-200`)

### Priority Badges
- **LOW**: Soft Gray (`bg-slate-100 text-slate-700`)
- **MEDIUM**: Soft Blue (`bg-blue-100 text-blue-800`)
- **HIGH**: Soft Orange (`bg-amber-100 text-amber-800`)
- **URGENT**: Soft Red (`bg-rose-100 text-rose-800 font-semibold`)

### Role Badges
- **REQUESTER**: Soft Green (`bg-emerald-100 text-emerald-800`)
- **IT_STAFF**: Soft Indigo (`bg-indigo-100 text-indigo-800`)
- **ADMINISTRATOR**: Soft Purple (`bg-purple-100 text-purple-800`)

## 3. Screen Layouts & UI Structure

### 3.1 Login Screen (`/login`)
- Clean centered card container with TokTickIT logo & Zen Green header banner.
- Form fields: Email input, Password input (with show/hide eye toggle).
- Validation state: Inline error messages below input fields for empty or invalid format.
- Alert banner: Red toast banner for invalid credentials or inactive account ("Invalid email or password" / "Account is inactive").
- Submit button with loading spinner state during API call.

### 3.2 Mandatory Change Password Screen (`/change-password`)
- Centered card container with warning icon indicating password update is required before proceeding.
- Fields: Current Password, New Password, Confirm New Password.
- Real-time password requirement checklist:
  - Minimum 8 characters
  - Include upper and lower case letters
  - Include a number and a special character
- Submit button disabled until all password rules pass.

### 3.3 IT Staff Ticket Queue Screen (`/staff/queue`)
- Search bar (by ticket number, summary, requester name).
- Filter bar: Category dropdown, Status dropdown, IT Priority dropdown, Assigned Owner filter (All / Assigned to Me / Unassigned).
- Data Table view (Desktop):
  - Columns: Ticket No., Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner, Actions.
  - Interactive hover rows, click row to view detail.
  - Pagination controls at bottom (Previous, Page numbers, Next, Page size indicator).
- Card Grid view (Mobile/Tablet):
  - Responsive cards with ticket number header, priority pills, status badge, summary text, owner avatar, and "View Detail" button.

### 3.4 IT Staff Ticket Detail Screen (`/staff/tickets/:id`)
- Header breadcrumb: `My Queue > Ticket Detail`.
- Action Bar:
  - Ticket Owner selector (Claim button / Reassign dropdown).
  - IT Priority dropdown selector.
  - Status change dropdown / action buttons based on permitted workflow.
- Left column: Ticket metadata (Summary, Description, Requester details, Category, Related System, Attachments).
- Right column / Tabbed section:
  - **Public Comments Tab**: Timeline of public messages with author badges (Requester / IT Staff). Form to add public comment.
  - **Internal Notes Tab**: Distinctly styled section with yellow/amber background tint (`bg-amber-50/50 border-amber-200`) and clear warning icon ("Private operational notes visible ONLY to IT Staff & Admin"). Form to add internal note.

### 3.5 Administrator User Management Screen (`/admin/users`)
- Header: User count indicator, "Create User" primary button.
- Filter & Search bar: Search by name or email, Role filter dropdown (All / Requester / IT Staff / Administrator).
- User Table:
  - Columns: Name, Email, Role badge, Status (Active / Inactive toggle badge), Actions (Edit, Reset Initial Password).
- Slide-over / Modal dialogs:
  - **Create / Edit User Modal**: Form fields for Full Name, Email, Role select, Active toggle.
  - **Reset Initial Password Modal**: Enter new initial password with check mark for `force password change on next login`. Safety warning displayed if attempting to self-deactivate or remove last admin.

## 4. Responsive & Accessibility Checklist
- Desktop (>1024px): Multi-column layouts, sticky sidebar header, hover indicators.
- Tablet (768px - 1023px): Collapsible filter drawer, flexible 2-column detail view.
- Mobile (<767px): Stacked single-column layouts, full-width buttons, tap targets >= 44x44px.
