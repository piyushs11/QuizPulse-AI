
# AI Quiz Builder (Full Stack + GenAI)

Stack: **Node.js (Express) + Socket.io + PostgreSQL (Prisma) + Next.js + OpenAI**

## Quick Start

### 0) Prerequisites
- Node.js 18+
- Docker (for Postgres) or your own Postgres instance
- An OpenAI API key

### 1) Start Postgres
```bash
docker compose up -d
```

### 2) Server setup
```bash
cd server
cp .env.example .env           # fill in OPENAI_API_KEY and DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run dev
```
Server runs on **http://localhost:4000**

### 3) Web (Next.js) setup
Open a new terminal:
```bash
cd web
cp .env.example .env           # fill in NEXT_PUBLIC_SERVER_URL
npm install
npm run dev
```
Web runs on **http://localhost:3000**

## Flow
1. Create a quiz by entering a topic → server calls OpenAI → stores quiz & questions.
2. Share the join code with players.
3. Players join the lobby; host starts the quiz.
4. Real-time questions broadcast via WebSockets.
5. Players answer → scores update live → leaderboard.

## Notes
- This is a minimal scaffold intended to be extended.
- Security-hardening, rate-limits, and production configs left to you.
