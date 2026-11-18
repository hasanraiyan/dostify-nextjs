import type { AvatarId } from "./avatar-config";
import { isValidAvatarId } from "./avatar-config";

export const AVATAR_STORAGE_KEY = "dostify-avatar";
const CHANGE_EVENT = "dostify-avatar-change";

export function readAvatarPref(): AvatarId {
  try {
    const v = localStorage.getItem(AVATAR_STORAGE_KEY);
    return v && isValidAvatarId(v) ? v : "sakura";
  } catch {
    return "sakura";
  }
}

export function setAvatarPref(id: AvatarId) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, id);
  } catch {
    // Storage unavailable
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: id }));
}

export function subscribeAvatarPref(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
