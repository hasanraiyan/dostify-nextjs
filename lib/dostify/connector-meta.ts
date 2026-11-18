import type { PersonaMcpConnection } from '@personaai/react'

/**
 * Display info for connectors, added by hand. Persona only sends a raw name
 * and an often-empty description, so this is where a connector gets its icon,
 * a friendly name and a proper description.
 *
 * To add one:
 *   1. Copy an entry below.
 *   2. Put what Persona calls it in `match` (the `name` in the console log,
 *      e.g. "pyqdeck_mcp"). Case, spaces, dashes and underscores are ignored,
 *      so "PyqDeck MCP" and "pyqdeck-mcp" match the same entry.
 *   3. Drop the icon in `public/connectors/` and set `icon: "/connectors/x.svg"`,
 *      or use any https image URL. Leave it out for a letter tile.
 *
 * Anything left out falls back to what Persona sent.
 */
export interface ConnectorMeta {
  /** Names (or mcpIds) this entry applies to. */
  match: string[]
  /** Shown instead of Persona's raw name. */
  name?: string
  /** Shown instead of Persona's (often empty) description. */
  description?: string
  /** Image path under /public, or an https URL. */
  icon?: string
}

export const CONNECTORS: ConnectorMeta[] = [
  {
    match: ['pyqdeck_mcp'],
    name: 'PYQDeck',
    description: 'Previous year question papers and study material.',
    icon: '/connectors/pyqdeck.png',
  },
  {
    match: ['deepwiki'],
    name: 'DeepWiki',
    description: 'Ask questions about any public GitHub repository and read its documentation.',
    icon: '/connectors/deepwiki.png',
  },
  {
    match: ['notion'],
    name: 'Notion',
    description: 'Read and write your Notion pages and notes.',
    icon: '/connectors/notion.png',
  },
  {
    match: ['linear'],
    name: 'Linear',
    description: 'Look up and manage issues and projects.',
    icon: '/connectors/linear.png',
  },
  {
    match: ['sentry'],
    name: 'Sentry',
    description: 'Investigate errors and crashes in your apps.',
    icon: '/connectors/sentry.png',
  },
  {
    match: ['atlassian'],
    name: 'Atlassian',
    description: 'Search and update Jira issues and Confluence pages.',
    icon: '/connectors/atlassian.png',
  },
  {
    match: ['roundtable'],
    name: 'Roundtable',
    description: 'Get code reviews and design advice from a panel of AI models.',
    icon: '/connectors/roundtable.png',
  },
]

/** Lowercase and drop everything but letters and digits, so naming style doesn't matter. */
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

export interface ResolvedConnector {
  name: string
  description: string
  icon?: string
}

/** What to show for a connector: our entry if there is one, else Persona's data. */
export function resolveConnector(connection: PersonaMcpConnection): ResolvedConnector {
  const keys = new Set([normalize(connection.name), normalize(connection.mcpId)])
  const meta = CONNECTORS.find((c) => c.match.some((m) => keys.has(normalize(m))))
  return {
    name: meta?.name ?? connection.name,
    description: meta?.description ?? connection.description,
    icon: meta?.icon,
  }
}
