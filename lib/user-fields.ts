type EmailLike = { id: string; email: string }

type UserFieldsInput = {
  emails: EmailLike[]
  primaryEmailId?: string | null
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  imageUrl?: string | null
}

/** Maps Clerk user data (webhook or API shape) to our User columns. */
export function toUserFields(input: UserFieldsInput) {
  const email =
    input.emails.find((e) => e.id === input.primaryEmailId)?.email ??
    input.emails[0]?.email ??
    null
  const name =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    input.username ||
    null
  return { email, name, imageUrl: input.imageUrl ?? null }
}
