# TokTickIT - IT Service Desk Application

Full-stack application for CPE 334 Introduction to Software Engineering in the Age of AI Agents.

## 🚀 Overview
TokTickIT is an IT Service Desk ticketing system designed for internal requester workflow and support ticket management.

---

## 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Vite + Bootstrap
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Testing**: Vitest & Supertest

---

## 📁 Directory Structure
```
toktickit/
├── client/          # React + Vite frontend
├── server/          # Express + Prisma backend
│   ├── prisma/      # Prisma schema & migrations
│   ├── src/         # Server source code
│   └── tests/       # Backend tests
├── docs/            # Documentation
│   ├── lab-01/      # Lab 1 docs
│   └── lab-02/      # Lab 2 Requester Ticketing Specs
│       ├── specification.md # Core Requirements & Acceptance Criteria
│       ├── ui-spec.md        # UI Design System & Component States (Zen Green)
│       ├── api-spec.md       # REST API Endpoints & Contracts
│       └── tests.md          # Test Strategy & Traceability Matrix
├── .gitignore
└── README.md
```

---

## 📚 Documentation
- 📄 **Lab 1 Docs**: [`docs/lab-01/`](./docs/lab-01/)
- 📋 **Lab 2 Specs**:
  - [Specification & Acceptance Criteria](./docs/lab-02/specification.md)
  - [UI Design Specification](./docs/lab-02/ui-spec.md)
  - [REST API Specification](./docs/lab-02/api-spec.md)
  - [Test Plan & Traceability](./docs/lab-02/tests.md)

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Backend Setup
```bash
cd server
npm install

# Copy .env.example to .env and adjust database connection string
cp .env.example .env

# Run Prisma database migrations and seed reference data
npx prisma migrate dev
npm run seed

# Run backend development server
npm run dev
```

### Frontend Setup
```bash
cd client
npm install

# Run frontend development server
npm run dev
```

### Testing
```bash
cd server
npm test
```
