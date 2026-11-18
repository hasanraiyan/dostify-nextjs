# Dostify: MCP and Connector Plan

> **Connectors (section 2) are postponed.** First we build the Dostify website with chat, voice and our own tools. Connectors come after everything else is done.

## How it works in this starter
Persona agents get tools from **MCP servers** attached to the agent. There are two kinds:

| Kind | Who authorizes | Example | Where it lives |
|---|---|---|---|
| **Our own MCP** (Dostify tools) | Clerk OAuth (already set up) | tasks, focus, journal, reminders, stats | `app/[transport]/route.ts` in this repo |
| **User-mode connectors** (third-party) | Each end user connects their own account via OAuth | Google Calendar, Notion, Todoist | Attached to the agent in the Persona dashboard; the starter UI (`mcp-connections-dialog`, `mcp-connect-banner`) already shows "Connected accounts" with Connect / Revoke |

So we only **write code** for our own MCP. Connectors are **configuration** (register the MCP URL, attach to the agent), and the UI is already there.

## 1. Our own MCP: Dostify tools (build these)
Backed by Prisma. All tools scope data to the Clerk user from `authInfo.extra.userId`.

| Tool | Purpose |
|---|---|
| `create_task` / `list_tasks` / `update_task` / `complete_task` / `delete_task` | Planner (title, notes, due date, category, priority) |
| `start_focus_session` / `end_focus_session` / `focus_stats` | Pomodoro (planned minutes, optional task link) |
| `add_journal_entry` / `list_journal_entries` | Mood journal |
| `set_reminder` / `list_reminders` / `cancel_reminder` | In-app reminders |
| `get_profile` | Level, XP, streak |
| `get_today_overview` | One call: today's tasks, reminders, focus minutes, last journal entry (great for "mera din kaisa hai") |

Notes:
- Award XP inside the tools (complete task, finish focus session, journal entry) so the agent never calculates it.
- `delete_*` tools should be marked as needing approval (the starter has an `interrupt-panel` for approvals).
- Optional: MCP **app widgets** (the starter has `mcp-app-renderer`) to render a task list or timer card inside chat.

## 1b. Frontend tools (run in the browser, turn on "Frontend Tools" on the agent)
Registered in `components/persona/chat-sdk/frontend-tools.tsx`. Arguments from the model are untrusted: navigation uses a fixed allowlist, data comes from MCP tools.

**Keep (already in starter):** `get_page_context`, `set_theme`, `navigate_to` (allowlist to be changed to Dostify pages), `copy_to_clipboard`, `confirm_action`.

**Build for v1:**
| Tool | What it shows |
|---|---|
| `show_helpline` | **Crisis card**: Tele-MANAS 14416 / 1-800-891-4416, KIRAN 1800-599-0019, iCall 9152987821, 112, with tap-to-call links. Called by the agent whenever the user mentions suicide or self-harm (see `AGENT.md`). |
| `start_focus_timer` | Live Pomodoro card (work/break, pause), calls `end_focus_session` when done |
| `show_tasks` | Today's tasks as a tickable card |
| `breathing_exercise` | 4-7-8 breathing animation for stress |

**Later:** `show_flashcards`, `play_focus_sound`, `show_study_plan`, `request_notification`.

**Removed from plan:** `mood_check_in`, `show_mood_chart`, mood trends. Also drop the starter's `get_weather` and `show_clock`.

Helpline numbers: double check them before launch, they can change.

## 2. Suggested connectors (user-mode, OAuth)
Chosen for Dostify's audience (students and young professionals). Ordered by value.

| Priority | Connector | What Dostify can do | Remote MCP endpoint (per vendor docs, verify before use) |
|---|---|---|---|
| 1 | **Google Calendar** | "Kal ke exam aur classes dekh", add study blocks, avoid clashes | `https://calendarmcp.googleapis.com/mcp/v1` (Google Workspace Developer Preview, needs our Google Cloud OAuth client) |
| 2 | **Notion** | Save notes, read study material, update a study tracker | `https://mcp.notion.com/mcp` (OAuth) |
| 3 | **Todoist** | For users who already use it; sync tasks | `https://ai.todoist.net/mcp` (OAuth) |
| 4 | **Gmail** | "Koi important mail aaya?", draft replies (confirm before sending) | `https://gmailmcp.googleapis.com/mcp/v1` (Developer Preview, needs our Google Cloud OAuth client) |
| 5 | **Google Drive / Docs** | Pull notes and PDFs for study help | not verified |
| 6 | **Spotify** (mood and focus playlists) | Not found as an official MCP; skip or build our own small MCP later | not verified |

Recommendation: **v1 = Dostify MCP + Google Calendar + Notion.** Add Todoist and Gmail after v1 works. Keep Gmail "draft only, confirm before send".

Caveats:
- The endpoints above come from third-party directories and blogs, not vendor pages I opened. Confirm each one in the vendor's official docs and check whether our Persona version supports that auth style (OAuth client registration) before building around it.
- Google connectors require a Google Cloud project, an OAuth consent screen, and possibly app verification for sensitive scopes (Gmail, Calendar). That can take time, so start early or begin with Notion.

## 3. Other Persona features to use (no extra code)
- **Memory** (user scope): name, language, goals, routines.
- **Knowledge base**: upload syllabus, previous-year papers, or notes per user.
- **Skills**: reusable behaviors such as "exam plan", "weekly review", "motivation".
- **Web search with citations**: already in the starter UI.
- **Sandbox terminal / file explorer / subagents**: kept per the decisions in `PRODUCT.md`. Useful for notes and files; subagents could handle "make me a full exam plan".
- **Workflows** (optional): a scheduled "morning check-in" or "evening reflection". Needs a trigger source, so decide later.

## 4. Setup checklist
1. [ ] Create the Dostify agent in Persona and paste the prompt from `AGENT.md`.
2. [ ] Build the Dostify MCP tools (Prisma models first, see `PRODUCT.md`).
3. [ ] Register our MCP in Persona (public URL, Clerk OAuth) and attach it to the agent.
4. [ ] Register Google Calendar and Notion MCPs; attach as **user-mode**.
5. [ ] Put the new agent IDs in `app/agents.ts` and the env vars in `.env.local`.
6. [ ] Test in chat: connect accounts from the "Connected accounts" dialog.
