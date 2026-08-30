# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Tokens

| Token / Element | Required Style |
|---|---|
| Primary green | `#006B3C` for app header, primary actions, and strong emphasis. |
| Secondary green | `#0B7A46` for active tabs, focus accents, links, and hover states. |
| Pale green | `#EAF6EF` for selected, success, and subtle section emphasis. |
| Page background | `#F5F7F6` or similarly quiet near-white. |
| Surface / cards | White (`#FFFFFF`) with subtle border and restrained shadow. |
| Text | Dark charcoal-green (`#1A2421`), not pure black, for comfortable reading. |
| Editable field | White background with clear neutral border (`#D1D5DB`). |
| Read-only field | Soft gray-green or warm ivory shading (`#F3F4F6` or `#F9FAFB`) that is distinct but readable. |
| Error | Dark red text and border (`#DC2626`); message appears immediately below the field. |
| Warning | Amber callout or badge (`#D97706`); do not use warning color as ordinary decoration. |
| Success | Green confirmation (`#16A34A`) with readable text and no reliance on color alone. |

## 2. Typography and Spacing
- **Font Family:** Inter or system default sans-serif.
- **Base Font Size:** 16px (1rem) for body text.
- **Spacing:** Use a consistent 4px or 8px baseline grid (e.g., margins of 8px, 16px, 24px, 32px).
- **Labels:** Appear above controls with consistent font weight (e.g., 500 or 600) and spacing.

## 3. Component States & Rules
- **Required Fields:** Show a red asterisk (`*`). The asterisk does not replace validation messages.
- **Inputs:** One consistent height (e.g., 40px). Multiline description is taller and resizable vertically only.
- **Buttons:**
  - *Primary:* Solid `#006B3C` background, white text.
  - *Secondary:* Outline with `#0B7A46` border and text.
  - *Disabled:* Grayed out background (`#E5E7EB`), text (`#9CA3AF`), distinct from active state.
  - *Busy:* Shows a loading spinner and is disabled while processing.
- **Icons:** Every icon-only control requires an accessible label and tooltip.
- **Focus:** Focus indicators (e.g., ring in `#0B7A46`) must remain visible for keyboard users.
- **Validation:** Messages appear near the associated field (below), not just at the top of the form.

## 4. Screen Layouts

### 4.1 Development Requester Selection Screen
- **Elements:** TokTickIT title, short explanation text, Requester dropdown (loaded from DB), Continue button, loading/empty/error states.
- **Layout:** Centered card on a `#F5F7F6` background.

### 4.2 Create Ticket Screen
- **Elements:** Ticket Number (Read-only), Ticket Date (Read-only), Requester (Read-only), Category (Dropdown), Related System (Dropdown), Requested Priority (Dropdown), Ticket Summary (Text input), Description (Textarea), Attachments section, Submit/Cancel buttons.
- **Layout:**
  - *Top:* System-generated fields (Number, Date, Requester).
  - *Middle:* Classification grouped together, Summary & Description full width.
  - *Bottom:* Attachments below main fields, primary/secondary actions at the bottom right.

### 4.3 My Tickets Screen
- **Elements:** Search bar, Category filter, Priority filter, Status filter, 'Create Ticket' action button, Data table or list of cards, Pagination controls.
- **Columns/Fields:** Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Current Status.
- **States:** Loading spinner, Empty state (no tickets yet), No-results state (filters applied but no match), API failure state.

### 4.4 Requester Ticket Detail (View Mode)
- **Elements:** Read-only view of ticket fields from Create Mode. Attachment list with download buttons and soft-remove (Trash icon) buttons.
- **Layout:** Clear distinction between ticket information and attachment actions. Removed attachments shown with a strikethrough or grayed out, with download disabled.

## 5. Responsive Behavior

| Viewport | Required Behavior |
|---|---|
| **Desktop ≥ 992px** | Multi-column layout as specified; content centered with a sensible max-width (e.g., 1200px). My Tickets is a data table. |
| **Tablet 768-991px** | Two-column layout where practical; Summary and Description receive enough width. |
| **Mobile < 768px** | Fields stack vertically; buttons remain touch-friendly (min 44px height); no horizontal page scrolling. My Tickets becomes a stacked card layout per ticket. |

*No clipped labels, overlapping messages, hidden buttons, or unreadable attachment names at any size.*

## 6. Accessibility & Visual Checks
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text).
- [ ] Keyboard navigation follows logical DOM order.
- [ ] Screen readers announce form validation errors.
- [ ] Playwright screenshots captured for desktop, tablet, and mobile.
