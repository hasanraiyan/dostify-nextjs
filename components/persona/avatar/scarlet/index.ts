import { svgRig, type AvatarPack, STANDARD_GESTURES } from '@personaai/avatar';
import { SCARLET_ART } from './art';
import { SCARLET_EMOTIONS } from './emotions';
import { SCARLET_MANIFEST } from './manifest';

/**
 * Scarlet: a beautiful, alluring anime character with silky dark crimson hair,
 * almond eyes, and rich swappable lip visemes.
 */
export const scarlet: AvatarPack = {
  id: 'scarlet',
  name: 'Scarlet',
  createRig: () => svgRig(SCARLET_ART, SCARLET_MANIFEST),
  emotions: SCARLET_EMOTIONS,
  gestures: STANDARD_GESTURES,
  defaultEmotion: 'neutral',
};

export { SCARLET_ART, SCARLET_MANIFEST, SCARLET_EMOTIONS };
