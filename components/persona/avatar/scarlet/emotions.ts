import type { EmotionPose } from '@personaai/avatar';

/**
 * Scarlet's expressive emotion set: eyebrow control points, cheek blush,
 * resting mouth bias, and eye openness scaling.
 */
export const SCARLET_EMOTIONS: Record<string, EmotionPose> = {
  neutral: {
    description: 'Calm, confident, alluring expression.',
    brow: {
      left: { start: 190, ctrl: 182, end: 191 },
      right: { start: 191, ctrl: 182, end: 190 },
    },
    blushOpacity: 0.45,
    blushScale: 1.0,
    mouthFormBias: 0.05,
    eyeScaleY: 1.0,
  },
  happy: {
    description: 'Warm, radiant smile with luminous rosy cheeks.',
    brow: {
      left: { start: 185, ctrl: 174, end: 186 },
      right: { start: 186, ctrl: 174, end: 185 },
    },
    blushOpacity: 0.8,
    blushScale: 1.2,
    mouthFormBias: 0.35,
    eyeScaleY: 0.94,
  },
  thinking: {
    description: 'Intrigued, contemplative pose with one arching eyebrow.',
    brow: {
      left: { start: 182, ctrl: 170, end: 184 },
      right: { start: 194, ctrl: 186, end: 192 },
    },
    blushOpacity: 0.4,
    blushScale: 0.95,
    mouthFormBias: -0.08,
    eyeScaleY: 0.98,
  },
  surprised: {
    description: 'Wide expressive eyes and high arched eyebrows.',
    brow: {
      left: { start: 178, ctrl: 165, end: 179 },
      right: { start: 179, ctrl: 165, end: 178 },
    },
    blushOpacity: 0.35,
    blushScale: 0.9,
    mouthFormBias: -0.15,
    eyeScaleY: 1.08,
  },
  shy: {
    description: 'Demure, coquettish blush with soft gentle gaze.',
    brow: {
      left: { start: 193, ctrl: 186, end: 188 },
      right: { start: 188, ctrl: 186, end: 193 },
    },
    blushOpacity: 0.95,
    blushScale: 1.4,
    mouthFormBias: 0.2,
    eyeScaleY: 0.92,
  },
  sad: {
    description: 'Melancholic, softly troubled expression with downturned brows.',
    brow: {
      left: { start: 196, ctrl: 188, end: 189 },
      right: { start: 189, ctrl: 188, end: 196 },
    },
    blushOpacity: 0.25,
    blushScale: 0.85,
    mouthFormBias: -0.25,
    eyeScaleY: 0.9,
  },
};
