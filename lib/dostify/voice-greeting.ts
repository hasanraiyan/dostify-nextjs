/**
 * Sent to the voice agent the moment a call connects, so Dostify speaks first
 * instead of waiting in silence. Used by every place the app starts a call.
 */
export const VOICE_PROACTIVE_GREETING =
  "The user just joined the voice call. First call trigger_avatar_reaction with wave and set_avatar_emotion with happy, then greet them warmly like a close friend (use their name if you know it, via get_profile) in one or two short sentences and ask how they are doing. Do not wait for them to speak first.";
