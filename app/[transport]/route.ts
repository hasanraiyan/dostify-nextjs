import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { auth, clerkClient } from '@clerk/nextjs/server'

const clerk = await clerkClient()

const handler = createMcpHandler((server) => {
  server.registerTool(
    'get_clerk_user_data',
    {
      description: 'Gets data about the Clerk user that authorized this request',
    },
    async (ctx) => {
      const authInfo = ctx.http?.authInfo
      const userId = authInfo!.extra!.userId! as string
      const userData = await clerk.users.getUser(userId)

      return {
        content: [{ type: 'text', text: JSON.stringify(userData) }],
      }
    },
  )
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
