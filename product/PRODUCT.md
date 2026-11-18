# Dostify (Next.js + Persona)

> Status: PLAN / draft. Items marked **(proposed)** are suggestions, not decided yet.

## 1. Overview
Dostify is an AI **friend** you chat with (text + voice, Hinglish) who can also **do things for you** (plan tasks, set focus sessions, journal, remind, search).

This is a rebuild of the earlier Dostify mobile app (React Native + Expo + Supabase, "Your AI study companion") as a Next.js web app powered by **Persona** (`@personaai/*`), built on top of this starter.

Tagline (proposed): *"Tera dost, jo kaam bhi karta hai."*

## 2. Target Users
- Students and young professionals dealing with stress, planning and focus.
- People who want a friendly, Hinglish-speaking companion rather than a formal assistant.

## 3. What the starter already gives us (reuse, don't rebuild)
| Area | Already in starter |
|---|---|
| Chat UI | `components/persona/chat-sdk/*` (messages, composer, tool cards, voice, memory, todo checklist, MCP connections) |
| Chat routes | `app/(chat)` (`/`, `/c/[threadId]`), `app/assistant` |
| Persona backend | `app/api/persona/[...persona]/route.ts` (`createPersonaHandler`, Clerk user resolution, Twilio channel) |
| Auth | Clerk (`sign-in`, `sign-up`, webhook, `lib/sync-user.ts`) |
| DB | Postgres + Prisma (`User` model with phone number), `docker-compose.yml` |
| Channels | WhatsApp/SMS/call via `app/api/channels/outbound` + Twilio |
| Tools via MCP | `app/[transport]/route.ts` (Clerk-protected MCP server, `registerTool`) |
| Agents | `app/agents.ts` (agent picker; currently demo agents) |

## 4. Core Features (proposed)
**A. Friend chat (core)**
- One main agent: **Dostify**. Friendly Hinglish tone, empathetic, remembers the user (Persona memory).
- Text chat + voice in v1 (starter already has voice agent support).
- Hinglish tone. Web only: **no WhatsApp / SMS / phone calls**.
- Keep the starter extras: sandbox terminal, file explorer, subagents, memory, MCP connections.

**B. Things Dostify can do (tools)**
Implemented as MCP tools in `app/[transport]/route.ts` backed by Prisma:
1. **Tasks**: `create_task`, `list_tasks`, `complete_task`, `update_task` (date, category, priority).
2. **Pomodoro**: `start_focus_session`, `end_focus_session` (+ stats).
3. **Mood journal**: `add_journal_entry`, `list_journal_entries`, `mood_summary`.
4. **Reminders**: `set_reminder`, shown in-app (no WhatsApp/SMS).
5. **Profile / gamification**: `get_profile` (level, XP, streak).
6. **Web search / study help**: use Persona's built-in tools (search, citations).

**C. Gamification (later phase)**
- XP and levels for completed tasks, Pomodoros, journal entries.
- Credits and payments: **removed from scope**.

**D. Web UI beyond chat (later phase)**
- Dashboard pages: Tasks, Focus timer, Journal, Profile. Chat stays the primary interface; tools render as cards in chat.

## 5. Dostify Agent (Persona)
- Create the agent in the Persona platform: name **Dostify**, system prompt (friend persona, Hinglish, supportive, not clinical, safety-aware for mental-health topics), attach the MCP tools, enable memory.
- Replace the demo list in `app/agents.ts` with Dostify (agentId + voiceAgentId).
- Safety note: not a therapist. Include crisis-response guidance in the prompt (suggest helplines / trusted people).

## 6. Data Model (proposed additions to `prisma/schema.prisma`)
- `Task` (userId, title, notes, dueAt, category, priority, status)
- `FocusSession` (userId, startedAt, endedAt, plannedMinutes, taskId?)
- `JournalEntry` (userId, mood, text, createdAt)
- `Reminder` (userId, message, remindAt, doneAt)
- `UserStats` (userId, xp, level, streak)

## 7. Build Plan (phases)
**Phase 0: Setup**
- [x] Fresh git repo pushed to GitHub, Persona libs updated, pnpm.
- [ ] Configure `.env.local` (Persona base URL + credential, Clerk keys, Postgres, Twilio).
- [ ] Run DB (`pnpm db:up`, `pnpm db:migrate`) and confirm starter runs (`pnpm dev`).

**Phase 1: Friend chat MVP**
- [ ] Create Dostify agent in Persona; wire into `app/agents.ts`.
- [ ] Rebrand UI (name, logo, empty state, colors).
- [ ] Keep only Dostify in the agent picker.

**Phase 2: Tools (Tasks, Journal, Pomodoro)**
- [ ] Add Prisma models + migration.
- [ ] Add MCP tools in `app/[transport]/route.ts`.
- [ ] Custom tool cards in chat for tasks / timer / journal.

**Phase 3: Reminders and cleanup**
- [ ] In-app reminders.
- [ ] Remove Twilio/WhatsApp/SMS/call code (`app/api/channels/outbound`, `app/api/user/phone`, Twilio block in persona route, channel-connect dialog, `twilio` dep, `phoneNumber` field).

**Phase 4: Gamification**
- [ ] XP/levels/streaks.

**Phase 5: Dashboard and polish**
- [ ] Dashboard pages, mobile-friendly layout (PWA), deploy (Vercel + hosted Postgres).

## 8. Tech Stack
Next.js 16, React 19, TypeScript, Tailwind v4, shadcn, Clerk, Prisma 7 + Postgres, `@personaai/{sdk,react,runtime,adapters}`, MCP (`mcp-handler`), pnpm.

> Before writing code: read `node_modules/next/dist/docs/` (per `AGENTS.md`), since this Next.js version differs from older ones.

## 9. Decisions
- New Dostify agent will be created in Persona (no existing one). Credentials will be shared by the owner later.
- Hinglish + voice in v1.
- No WhatsApp / SMS / phone calls. No credits / payments.
- Keep sandbox terminal, file explorer, subagents.
- Git branch: `dostify`.

## 10. Open Questions
1. Persona credentials (`PERSONA_BASE_URL`, `PERSONA_CREDENTIAL`) and new agent IDs: pending.
2. Brand: logo, color palette?
