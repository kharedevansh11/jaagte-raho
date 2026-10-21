# Jaagte Raho

A voice agent that keeps cab and truck drivers awake on night shifts.
During a shift it phones the driver every 20–30 minutes and chats in their language.
It scores how alert they sounded and calls the fleet owner if they sound very sleepy or miss two calls in a row.

```
backend/    NestJS API: GraphQL for the dashboard, REST for Bolna webhooks and the public demo
frontend/   React app: owner dashboard + public "try it now" page (Vite)
docs/agents Prompts to paste into Bolna for the two voice agents
```

## How it works

1. **Scheduler** (`check-in.scheduler.ts`): every minute it finds active drivers who are in their shift window and due a call, then asks Bolna to call them.
2. **Bolna** runs the actual phone call (Plivo/Exotel → Deepgram → LLM → Sarvam/Cartesia). When the call ends, it POSTs the result to `/webhooks/bolna`, which only drops it on a **BullMQ queue** and returns 200. A worker processes it with retries (`calls.processor.ts`).
3. **Scoring** (`alertness.ts`) turns the transcript and Bolna's extracted fields into GREEN, AMBER, RED or MISSED.
4. **Escalation** (`escalation.ts`): AMBER means call back in 10 minutes. RED, or two MISSED in a row, queues an owner-alert job, retried until the manager's phone actually rings.
5. **Conversation memory** (`conversation.ts`): each check-in gets the time of night, how the last call went, and an everyday question that never repeats in a night.

## Backend layout

```
src/
  config/          env validation (app won't boot with missing keys)
  prisma/          PrismaService (DB access)
  common/          admin guard, shared constants
  modules/
    bolna/         BolnaClient: the only code that talks to Bolna's API
    drivers/       model · inputs · repository · service · resolver
    calls/         model · repository · service · resolver · webhook controller · scheduler
                   alertness.ts / escalation.ts / shift.ts are pure functions with tests
    demo/          public "try it now" endpoint, rate limited
```

Each request goes controller/resolver → service → repository → Prisma.

## Run locally

**Quick start:** after the one-time setup below, run `npm run dev` from the project root. It starts the backend and frontend together (both use pnpm underneath). Ctrl+C stops both. Postgres and Redis (Docker) and ngrok still run separately.

Needs **Postgres** (`DATABASE_URL`). Locally it runs in Docker on port 5433:

```bash
docker run -d --name jaagte-postgres --restart unless-stopped -p 5433:5432 -e POSTGRES_USER=jaagte -e POSTGRES_PASSWORD=jaagte -e POSTGRES_DB=jaagte -v jaagte-pgdata:/var/lib/postgresql/data postgres:17-alpine
```

Needs **Redis** for the job queue (`REDIS_URL`, default `redis://localhost:6379`). Easiest with Docker:

```bash
docker run -d --name jaagte-redis -p 6379:6379 -v jaagte-redis-data:/data --restart unless-stopped redis:7-alpine redis-server --appendonly yes
```

After the first time it starts by itself with Docker Desktop (`docker start jaagte-redis` if not). Check with `redis-cli ping`.

```bash
cd backend
pnpm install
cp .env.example .env    # then fill in the Bolna keys and two random tokens
pnpm db:migrate
pnpm start:dev
```

- GraphQL sandbox: http://localhost:3000/graphql. Send the header `Authorization: Bearer <ADMIN_TOKEN>`.
- Bolna can't reach localhost, so expose it with `ngrok http 3000` and use the ngrok URL as the agent's webhook.
- Tests: `pnpm test`

## API

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /graphql` | Clerk session token (`Bearer`) | `drivers`, `driver`, `recentCalls`, `createDriver`, `updateDriver`, `deleteDriver`, `callDriverNow` |
| `POST /webhooks/bolna?token=…` | `WEBHOOK_TOKEN` | Bolna call status updates |
| `POST /demo/call` | none, rate limited | `{ name, phone, language }` → the judge's phone rings |
| `GET /demo/calls/:id` | none (unguessable id) | Result for the try-it page |

## Run the frontend

With the backend running on :3000 (Vite proxies `/graphql` and `/demo` to it):

```bash
cd frontend
pnpm install
pnpm dev
```

- http://localhost:5173/try is the public demo page for judges.
- http://localhost:5173/ is the owner dashboard. Owners sign in with Google through Clerk; each owner sees only their own drivers.
- Put the Clerk publishable key in `frontend/.env.local` (`VITE_CLERK_PUBLISHABLE_KEY`) and the secret key in `backend/.env` (`CLERK_SECRET_KEY`).
- It's mobile-first, light/dark follows the phone, and there's a हिं/EN switch in the header.
- `pnpm build` creates `frontend/dist`. `pnpm check` runs the phone-number self-check.
- GraphQL operations live in `frontend/src/graphql/` (one `.gql` file each). After changing one, or the backend schema, run `pnpm codegen` to regenerate the typed documents in `src/graphql/generated.ts`. Components never call the API; they use the hooks in `src/hooks/` (TanStack Query).

## Stage demo

Set `CALL_INTERVAL_MINUTES=1` and `RECALL_MINUTES=1`, and set the driver's shift to cover the current time.
A whole "night" then plays out in a few minutes.

## Deploy (free: Vercel + Render + Neon + Redis Cloud)

- **Database:** Neon Postgres. Set its connection string as `DATABASE_URL` on Render.
- **Backend (Render, root `backend`):**
  - Build command: `corepack enable && pnpm i --frozen-lockfile && pnpm db:deploy && pnpm build`. `postinstall` runs `prisma generate`.
  - Start command: `pnpm start:prod`.
  - Set `NODE_ENV=production`, and every variable from `.env.example`.
- **One instance only:** the scheduler runs in-process. The queue itself already scales across workers.
- **Redis:** Redis Cloud free tier as `REDIS_URL`. Upstash's free command quota runs out under BullMQ's polling.
- **Frontend (Vercel, root `frontend`):** set `VITE_CLERK_PUBLISHABLE_KEY`.
  - `frontend/vercel.json` forwards `/graphql` and `/demo` to the Render URL and serves `index.html` for every other route.
  - If the Render service has a different name, change the URL in `vercel.json`.
- **Clerk and Bolna:** set `CLERK_AUTHORIZED_PARTIES` to the Vercel URL. Point both Bolna agents' webhooks at `https://<render-url>/webhooks/bolna?token=<WEBHOOK_TOKEN>`.
- **Keep it awake:** Render's free tier sleeps after 15 idle minutes, which stops the scheduler. Ping `/graphql` every 10 minutes (for example with cron-job.org).
