/** Where the site lives. Set NEXT_PUBLIC_SITE_URL to override (for example on a preview deploy). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dostify.hasanraiyan.me').replace(
  /\/$/,
  '',
)

export const SITE_NAME = 'Dostify'
export const SITE_TAGLINE = 'Your AI friend who listens and gets things done'

/** About 150 characters: what search engines show under the title. */
export const SITE_DESCRIPTION =
  'Dostify is an AI friend you can talk to in English, Hindi or Hinglish. Vent, keep a private journal, get a hand with your day, and connect your apps.'

export const SITE_KEYWORDS = [
  'AI friend',
  'AI companion',
  'AI journal',
  'Hinglish chatbot',
  'talk to AI in Hindi',
  'student AI companion',
  'private journal app',
  'mental wellness companion',
]
