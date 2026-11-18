import type { RigManifest } from '@personaai/avatar';

/**
 * Scarlet's rig manifest.
 *
 * Uses the swap strategy for lip-sync with 8 detailed visemes,
 * pivots centered for head rotation and micro-nodding around [250, 280],
 * and eyebrow templates with placeholders for emotion interpolation.
 */
export const SCARLET_MANIFEST: RigManifest = {
  version: 1,
  name: 'scarlet',
  mouth: {
    strategy: 'swap',
    shapes: {
      rest: '[data-mouth="rest"]',
      A: '[data-mouth="A"]',
      E: '[data-mouth="E"]',
      I: '[data-mouth="I"]',
      O: '[data-mouth="O"]',
      U: '[data-mouth="U"]',
      M: '[data-mouth="M"]',
      S: '[data-mouth="S"]',
    },
  },
  pivots: {
    head: [250, 280],
  },
  brows: {
    left: 'M 186 {s} Q 205 {c} 224 {e}',
    right: 'M 276 {s} Q 295 {c} 314 {e}',
  },
};
