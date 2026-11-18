import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { auth } from '@clerk/nextjs/server'
import { registerDostifyTools } from '@/lib/dostify/tools'

const handler = createMcpHandler((server) => {
  registerDostifyTools(server)
})

const authHandler = withMcpAuth(
  handler,
  async (_, token) => {
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
    return verifyClerkToken(clerkAuth, token)
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/mcp',
  },
)

export { authHandler as GET, authHandler as POST }
