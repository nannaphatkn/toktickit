# Peer Reviewer Record — Lab 3: TokTickIT

- **Student Name:** Janinee (`nannaphatkn`)
- **Reviewer Partner Name:** Patita Dansikaew (Student ID: 67070505211, GitHub: [`Patitta-23`](https://github.com/Patitta-23))
- **Repository:** [`https://github.com/nannaphatkn/toktickit`](https://github.com/nannaphatkn/toktickit)
- **Integration Workflow:** Feature branches ➔ `lab3-staging` ➔ `main`

---

## 1. Peer Reviews Received (My PRs Reviewed by Patitta-23)

### PR #28: `[Lab03] Issue #21: Spec & Documentation`
- **PR Link:** [https://github.com/nannaphatkn/toktickit/pull/28](https://github.com/nannaphatkn/toktickit/pull/28)
- **Target Branch:** `lab3-staging`
- **Status:** Merged ✅ (Merged by `Patitta-23`)
- **Review Decision:** `APPROVED` (2026-09-19T05:08:05Z)
- **Reviewer Comment:** *"Gooooood"* (by [`Patitta-23`](https://github.com/Patitta-23))
- **Author Response:** *"> Gooooood\nthanks"* (by [`nannaphatkn`](https://github.com/nannaphatkn))

---

### PR #29: `[Lab03] Issue #22: Database Migration — User, Role, Comments`
- **PR Link:** [https://github.com/nannaphatkn/toktickit/pull/29](https://github.com/nannaphatkn/toktickit/pull/29)
- **Target Branch:** `lab3-staging`
- **Status:** Merged ✅ (Merged by `Patitta-23`)
- **Review Decision:** `COMMENTED` / Code Improvement (2026-09-19T06:27:08Z)
- **Reviewer Comment:** 
  > *"มี index ที่ Ticket.requesterId, ownerId, currentStatus แล้ว แต่ User.role และ User.isActive ยังไม่มี index — ถ้ามี query แบบ "list active IT_STAFF" บ่อยๆ (เช่นตอน assign ticket) ควรพิจารณาเพิ่ม @@index([role]) หรือ composite @@index([role, isActive])"*
- **Author Action & Response:**
  > *"Added `@@index([role, isActive])` to the `User` model in `schema.prisma`. Optimizes queries like `WHERE role = 'IT_STAFF' AND isActive = true` (e.g., during ticket assignment) to leverage the composite index instead of performing a full table scan. All tests passed (51/51)."* (Commit `97d57ee`)

---

### PR #32: `[Lab03] Issue #30: Server APIs — Auth, Staff Queue, Comments, Admin`
- **PR Link:** [https://github.com/nannaphatkn/toktickit/pull/32](https://github.com/nannaphatkn/toktickit/pull/32)
- **Target Branch:** `lab3-staging`
- **Status:** Merged ✅ (Merged by `Patitta-23`)
- **Review Decision:** `APPROVED` (2026-10-03T15:42:14Z)
- **Reviewer Comment:** *"good job👏"* (by [`Patitta-23`](https://github.com/Patitta-23))
- **Author Response:** *"> good job👏\nthanks khan"* (by [`nannaphatkn`](https://github.com/nannaphatkn))

---

### PR #33: `[Lab03] Issue #31: Frontend Pages, Auth Context, Tests & E2E Specs`
- **PR Link:** [https://github.com/nannaphatkn/toktickit/pull/33](https://github.com/nannaphatkn/toktickit/pull/33)
- **Target Branch:** `lab3-staging`
- **Status:** Merged ✅ (Merged by `Patitta-23`)
- **Review Decision:** `APPROVED` (2026-10-03T16:18:56Z)
- **Reviewer Comment:** *"Excellent"* (by [`Patitta-23`](https://github.com/Patitta-23))
- **Author Response:** *"> Excellent\nwoww thanks for review"* (by [`nannaphatkn`](https://github.com/nannaphatkn))

---

### PR #36: `Release: Lab 03 — Authentication, RBAC, IT Staff & Admin`
- **PR Link:** [https://github.com/nannaphatkn/toktickit/pull/36](https://github.com/nannaphatkn/toktickit/pull/36)
- **Target Branch:** `main` ⟵ `lab3-staging`
- **Status:** Approved ✅ (Review Decision: `APPROVED` at 2026-10-04T05:55:03Z)
- **Reviewer Comment:** *"Goood"* (by [`Patitta-23`](https://github.com/Patitta-23))
- **Author Response:** *"> Goood\nthanks"* (by [`nannaphatkn`](https://github.com/nannaphatkn))
- **Next Action:** Peer reviewer `Patitta-23` to click the green Merge button on GitHub.


---

## 2. Peer Reviews Conducted (PRs I Reviewed for Patitta-23)

- **Partner Repository:** [`https://github.com/Patitta-23/LAB`](https://github.com/Patitta-23/LAB)

### PR #34: `Lab-03 : add Spec DD baseline — specification, ui-spec, api-spec…`
- **PR Link:** [https://github.com/Patitta-23/LAB/pull/34](https://github.com/Patitta-23/LAB/pull/34)
- **Status:** Merged ✅
- **My Review:** *"Lgtm"* (Approved ✅ at 2026-10-04T04:36:17Z)
- **Partner Response:** *"> Lgtm\nThanks"*

---

### PR #35: `Lab3 : Authentication System — Login, Password Change, Session, RBAC`
- **PR Link:** [https://github.com/Patitta-23/LAB/pull/35](https://github.com/Patitta-23/LAB/pull/35)
- **Status:** Merged ✅
- **My Review:** *"Greatest"* (Approved ✅ at 2026-10-04T04:39:20Z)
- **Partner Response:** *"> Greatest\nThanks"*

---

### PR #36: `Lab3 : IT Staff Ticket Queue & Detail — Claim, Status, Priority, Comments, Notes`
- **PR Link:** [https://github.com/Patitta-23/LAB/pull/36](https://github.com/Patitta-23/LAB/pull/36)
- **Status:** Merged ✅
- **My Review:** *"code looks good as you"* (Approved ✅ at 2026-10-04T04:50:05Z)
- **Partner Response:** *"> code looks good as you\nTq"*

---

### PR #37: `Lab3 : Admin User Management — CRUD, Toggle Active, Reset Password`
- **PR Link:** [https://github.com/Patitta-23/LAB/pull/37](https://github.com/Patitta-23/LAB/pull/37)
- **Status:** Merged ✅
- **My Review:** *"Approve khaa"* (Approved ✅ at 2026-10-04T04:52:51Z)
- **Partner Response:** *"> Approve khaa\nTq"*

---

### PR #38: `Lab3 : Requester Regression + Public Comments + "Problem Appears Resolved"`
- **PR Link:** [https://github.com/Patitta-23/LAB/pull/38](https://github.com/Patitta-23/LAB/pull/38)
- **Status:** Merged ✅
- **My Review:** *"Good good good"* (Approved ✅ at 2026-10-04T04:59:38Z)
- **Partner Response:** *"> Good good good\nThanks"*

---

## 3. Reviewer Verification Checklist Summary

- [x] **Spec DD:** Specification document complete at `docs/lab-03/specification.md` (FR-01..FR-15, BR-01..BR-20, Authorization Matrix)
- [x] **UI Spec:** UI design system & state matrix at `docs/lab-03/ui-spec.md` with Zen Green palette (`#006B3C`)
- [x] **API Spec:** REST API contracts documented at `docs/lab-03/api-spec.md`
- [x] **Test DD & Traceability:** Full BR ➔ TC matrix at `docs/lab-03/tests.md`
- [x] **Data Migration:** Prisma schema updated with `User`, `Role`, `PublicComment`, `InternalNote`, relations to `Ticket`, and composite index `@@index([role, isActive])` without breaking Lab 2 data
- [x] **Auth & Authorization:** Server-side RBAC enforced for Requester, IT Staff, and Administrator
- [x] **IT Staff Queue & Operations:** Search, filter, pagination, claim/reassign, IT priority, status workflow
- [x] **Admin User Management:** CRUD operations with safety rules (no duplicate email, self-deactivation protection, last active admin protection)
- [x] **Automated Tests:** Server API (71/71), Client Component (34/34), and Playwright E2E (19/19) passing clean
