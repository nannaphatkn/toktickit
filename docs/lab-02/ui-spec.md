# Lab 2 Phase 1 – UI Specification (`ui-spec.md`)

## 🎨 Zen Green Theme (ต่อจาก Labsheet หน้า 8)
| Token | HEX / HSL | Usage |
|-------|-----------|-------|
| **Primary** | `#006B3C` (hsl(157,100%,21%)) | Main brand colour – navigation bar, buttons, active tabs |
| **Secondary** | `#0B7A46` (hsl(157,55%,30%)) | Accent colour – secondary buttons, focus rings, links |
| **Background** | `#F5FAF7` (hsl(150,20%,96%)) | Page background, cards, modal body |
| **Surface** | `#FFFFFF` | Card / table surface – pure white for contrast |
| **Text‑Primary** | `#1A2421` (dark charcoal‑green) | Headings, primary copy |
| **Text‑Secondary** | `#4A4A4A` | Supporting copy, placeholders |
| **Success** | `#16A34A` | Success alerts, check‑marks |
| **Error** | `#C62828` | Error alerts, validation messages |
| **Warning** | `#ED6C02` | Warning alerts |

## 🖋 Typography & Spacing
- **Font Family:** `Outfit`, fallback to `Inter` or system sans‑serif – load via Google Fonts.
- **Base Font‑size:** 16 px (1 rem).
- **Heading Scale:**
  - `h1`: 2.5 rem / 40 px – weight 700
  - `h2`: 2 rem / 32 px – weight 600
  - `h3`: 1.75 rem / 28 px – weight 600
- **Body Text:** 1 rem / 16 px – weight 400
- **Line‑height:** 1.5 for body, 1.2 for headings.
- **Spacing Grid:** 4 px base unit (margins/padding multiples of 4).

## 📐 Layout & Responsive Break‑points
| Breakpoint | Width | Layout Adjustments |
|------------|------|-------------------|
| **Desktop** | ≥ 1200 px | 3‑column grid for ticket cards, side navigation stays vertical, max‑width 1200 px.
| **Tablet** | 768 – 1199 px | 2‑column grid, top navigation with hamburger menu.
| **Mobile** | < 768 px | Single‑column stack, full‑width forms, drawer navigation.

## 🖥 UI Components (states & variations)
### 1. Navigation Bar
- Height: **64 px**
- Background: **Primary** (`#006B3C`) with subtle **glass‑morphism** (`backdrop‑filter: blur(6px); opacity:0.95`).
- Left: Logo; Right: Requester avatar dropdown.
- Active link: underline 2 px, colour **Secondary**.

### 2. Buttons
| Variant | Background | Text | Border | Hover / Focus |
|--------|------------|------|--------|---------------|
| Primary | Primary | White | none | Darken Primary 5% (`#005531`). |
| Secondary | Transparent | Primary | 1 px solid Primary | Background Primary 10% opacity. |
| Disabled | `#E0E0E0` | `#9E9E9E` | none | cursor: not‑allowed |

### 3. Form Fields
- **Input / Textarea**: 1 px solid `#CCCCCC`, border‑radius 4 px, padding 0.5 rem.
- **Focus**: `outline: 2px solid Primary`, box‑shadow `0 0 0 3px rgba(0,107,60,0.2)`.
- **Error**: border colour **Error**, helper text in **Error** colour.
- **Required**: Red asterisk (`*`) after label.

### 4. Ticket Card (My Tickets list)
- Surface: white, radius 8 px, shadow `0 2px 6px rgba(0,0,0,0.08)`.
- Header: ticket number (bold) + status badge (New – Secondary, In‑Progress – Primary, Closed – Text‑Secondary).
- Body: summary (truncate 2 lines with ellipsis), category badge (secondary bg), priority icon (color‑coded).
- Hover: raise shadow, background `#F0FAF5`.

### 5. Attachment List (Ticket Detail)
- Row: file icon, name, size, **Download** button (primary) and **Remove** icon button (Error colour).
- Soft‑removed: opacity 0.4, disabled download, tooltip *"Removed – not downloadable"*.

## ♿ Accessibility
- All interactive elements receive a **focus outline** (2 px solid Primary).
- ARIA labels for icon‑only buttons (`aria-label="Remove attachment"`).
- Colour contrast meets **WCAG AA** (Primary vs White = 4.5:1).
- Keyboard navigation order follows visual order.
- Provide a **skip‑to‑content** link at the top of each page.

## 📋 Checklist (must be present in the markdown)
- ✅ Theme colour tokens (Primary, Secondary, Background, Surface, Text, Success, Error, Warning).
- ✅ Typography scale and spacing grid.
- ✅ Responsive break‑points with layout description.
- ✅ Component definitions with all states (nav, button, form field, ticket card, attachment list).
- ✅ Accessibility notes (focus, ARIA, contrast, keyboard).
- ✅ Optional: mock‑up screenshots (can be added later).

---

*All UI specifications are written before any code is implemented so developers can copy the token values and component patterns directly into the React component library.*
