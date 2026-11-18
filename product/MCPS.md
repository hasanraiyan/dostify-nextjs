# Dostify: MCP servers to add in Persona

Checklist of the MCP servers to register on the Persona website and attach to the Dostify agent. **Already added in Persona (2026-11-18):** `pyqdeck_mcp`, `deepwiki`, `notion`, `linear`, `sentry`, `atlassian`, `roundtable`. **Still to add:** `dostify` (our own). URLs and auth types were probed with a live `initialize` request on 2026-11-18 (see "How this was checked"), but Persona itself has not connected to them yet, so confirm each one when you add it.

## How to add one

In Persona, create an MCP and fill in:

| Field | Value |
|---|---|
| **Name** | Lowercase, letters, digits, `_` and `-` only, no spaces. See the naming note below. |
| **Description** | Paste from the entry below (Persona often shows an empty one otherwise). |
| **Transport** | `http` (Streamable HTTP). Use `sse` only for old `/sse` URLs. |
| **URL** | From the entry below. |
| **Auth type** | `none`, `oauth` or `apiKey`. |
| **Auth mode** | For OAuth: **`user`**, so each end user connects their own account. `owner` shares one account for everyone. |

Then attach the MCP to the **Dostify agent** in its settings. User-mode OAuth connectors show up on the app's **/connectors** page with a Connect button.

**Naming matters.** Persona names every tool `<name>__<tool>` after lowercasing the MCP name and replacing anything outside `a-z 0-9 _ -` with `_` (so `Dostify MCP` becomes `dostify_mcp`, and the tool `dostify_mcp__manage_journal`). Pick the name once and keep it, because the agent prompt and logs refer to it. The chat cards recognise our tools by the part after `__`, so any prefix works.

If the form asks for an OAuth client ID and secret, try leaving them empty first. The backend supports dynamic client registration, so most servers below need none.

---

## 1. Add now (`dostify` is still to do)

### Dostify (our own MCP)

| | |
|---|---|
| Name | `dostify` |
| Description | Dostify's own tools: read and manage the user's journal, and look up their profile. |
| Transport | `http` |
| URL | `https://<public-host>/mcp` |
| Auth | `oauth`, mode `user` (Clerk OAuth) |
| Tools | `manage_journal` (list, search, get, create, update, delete), `get_profile` |

- Persona's servers must be able to reach the URL. In development use a tunnel (for example ngrok) and put its address here. In production use the real domain.
- The OAuth metadata is served at `/.well-known/oauth-protected-resource/mcp` and `/.well-known/oauth-authorization-server`, and those paths are public in `proxy.ts`.
- After changing tools, refresh the MCP in Persona so the agent sees the new list.

### PYQDeck (already added)

| | |
|---|---|
| Name | `pyqdeck_mcp` |
| Description | Previous year question papers and study material. |
| Transport | `http` |
| Auth | `oauth`, mode `user` (login at `clerk.pyqdeck.in`) |

Icon and friendly name are already set in `lib/dostify/connector-meta.ts`.

---

## 2. For testing

### DeepWiki: no login (best first test) - added

| | |
|---|---|
| Name | `deepwiki` |
| Description | Ask questions about any public GitHub repository and read its documentation. |
| Transport | `http` |
| URL | `https://mcp.deepwiki.com/mcp` |
| Auth | `none` |
| Tools | `read_wiki_structure`, `read_wiki_contents`, `ask_wiki_question` |

Try: "Tell me about the vercel/next.js repo." Confirms that a new connector's tools reach the chat and render as the normal tool card.

### Notion: OAuth (best second test) - added

| | |
|---|---|
| Name | `notion` |
| Description | Read and write the user's Notion pages and notes. |
| Transport | `http` |
| URL | `https://mcp.notion.com/mcp` |
| Auth | `oauth`, mode `user` |

Tests the full connect round trip on `/connectors`. Not confirmed: whether Persona's OAuth flow completes with Notion. This is what the test is for.

---

## 3. Optional (developer tools, not a fit for Dostify's audience) - all added

| Name | URL | Auth | What it is |
|---|---|---|---|
| `linear` | `https://mcp.linear.app/mcp` | `oauth`, `user` | Issues and projects. `/mcp/readonly` exists for read-only access. |
| `sentry` | `https://mcp.sentry.dev/mcp` | `oauth`, `user` | Errors and crashes. |
| `atlassian` | `https://mcp.atlassian.com/v2/mcp` | `oauth`, `user` | Jira and Confluence. Older `/v1/sse` URLs are legacy. |
| `roundtable` | `https://mcp.roundtable.now/mcp` | `none` | 13 code-review and design tools (`review-code`, `debug-issue`, `design-architecture`...). Only useful for plumbing tests. |

---

## 4. Do not add

| Server | Why |
|---|---|
| Semgrep `https://mcp.semgrep.ai/mcp` | Listed as no-auth in community lists, but returns `401` and needs a login. |
| Asana `https://mcp.asana.com/mcp` | Returns `410 Gone`. The new server needs a registered client ID and secret. |
| 402.bot `https://api.402.bot/mcp` | The probe timed out, so it is unverified. |

---

## Ideas for later (not built)

Possible tools on our own MCP, in the `manage_journal` style (one tool, an `action` field):
`manage_preferences` (timezone, language, preferred name), `manage_my_data` (export and delete), `weekly_review` (summary of recent entries), `manage_safety_plan`, `manage_habits`, `manage_flashcards`.

---

## Connector display

`lib/dostify/connector-meta.ts` gives each connector a logo, a friendly name and a description on the Connectors page. Entries exist for `pyqdeck_mcp`, `deepwiki`, `notion`, `linear`, `sentry`, `atlassian` and `roundtable`; the icons are in `public/connectors/` (128px PNGs from each product's own site or GitHub avatar). `match` is the name used in Persona (case and punctuation are ignored), so if a connector is registered under a different name, add that name to its `match` list.

No-auth connectors (`deepwiki`, `roundtable`) do not appear on `/connectors`, because there is nothing to connect; only user-mode OAuth ones do. Their tools still reach the agent.

To add another, copy an entry and drop a square image into `public/connectors/`.

---

## After adding

1. Attach each MCP to the Dostify agent.
2. In the agent settings, keep **Frontend Tools** on (needed for the helpline, weather, location and confirm cards).
3. Re-paste `product/AGENT.md` into the agent's instructions if it changed.
4. Open `/connectors`, connect any OAuth ones, then try a prompt that uses each.
5. Check the browser console for `[connectors]` (what the API returned) and `[mcp-app] tool call` (exact tool names).

## How this was checked

On 2026-11-18 a JSON-RPC `initialize` request was sent to each URL. `200` with a server name means it answered without credentials. `401` with `WWW-Authenticate ... resource_metadata` means OAuth. Tool lists for DeepWiki and Roundtable came from a `tools/list` request. Nothing was connected through Persona.
