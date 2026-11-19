import { BASE_URL, MCP_RESOURCE } from '@/lib/auth'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

/** RFC 9728 metadata: tells MCP clients which authorization server guards /mcp. */
export const GET = () =>
  Response.json(
    {
      resource: MCP_RESOURCE,
      authorization_servers: [`${BASE_URL}/api/auth`],
      scopes_supported: ['profile', 'email'],
      bearer_methods_supported: ['header'],
    },
    { headers: cors },
  )
export const OPTIONS = () => new Response(null, { status: 204, headers: cors })
