export type ThemePref = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'dostify-theme'
const CHANGE_EVENT = 'dostify-theme-change'

/**
 * Runs in <head> before first paint so a saved theme never flashes the wrong
 * colours. Keep it tiny and dependency-free.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Puts the `dark` class on <html> to match the preference. */
export function applyThemePref(pref: ThemePref) {
  const dark =
    pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Saves, applies and announces a new preference (other tabs and hooks follow). */
export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    // Storage unavailable: it still applies for this page view.
  }
  applyThemePref(pref)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeThemePref(onChange: () => void) {
  const media = matchMedia('(prefers-color-scheme: dark)')
  const onMedia = () => {
    // Follow the OS only while the preference is "system".
    if (readThemePref() === 'system') applyThemePref('system')
    onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  media.addEventListener('change', onMedia)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
    media.removeEventListener('change', onMedia)
  }
}
