# TokTickIT - IT Service Desk Application

Full-stack application for CPE 334 Introduction to Software Engineering in the Age of AI Agents.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Bootstrap
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Testing**: Vitest & Supertest

## Directory Structure
```
toktickit/
├── client/          # React + Vite frontend
├── server/          # Express + Prisma backend
│   ├── prisma/      # Prisma schema & migrations
│   ├── src/         # Server source code
│   └── tests/       # Backend tests
├── docs/            # Documentation
│   └── lab-01/      # Lab 1 docs
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Backend Setup
```bash
cd server
npm install
# Copy .env.example to .env and adjust database connection string
cp .env.example .env
npm run dev
```
