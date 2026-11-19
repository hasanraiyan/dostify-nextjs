import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { verifyBearerToken } from 'better-auth/oauth2'
import { BASE_URL, MCP_RESOURCE } from '@/lib/auth'
import { registerDostifyTools } from '@/lib/dostify/tools'

const handler = createMcpHandler((server) => {
  registerDostifyTools(server)
})

const authHandler = withMcpAuth(
  handler,
  async (_req, token) => {
    if (!token) return undefined
    try {
      // Verifies signature (via our JWKS), issuer, audience and expiry.
      const payload = await verifyBearerToken(token, {
        jwksUrl: `${BASE_URL}/api/auth/jwks`,
        verifyOptions: { issuer: `${BASE_URL}/api/auth`, audience: MCP_RESOURCE },
      })
      if (!payload.sub) return undefined
      return {
        token,
        clientId: String(payload.azp ?? 'unknown'),
        scopes: typeof payload.scope === 'string' ? payload.scope.split(' ') : [],
        extra: { userId: payload.sub },
      }
    } catch {
      return undefined
    }
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/mcp',
  },
)

export { authHandler as GET, authHandler as POST }
