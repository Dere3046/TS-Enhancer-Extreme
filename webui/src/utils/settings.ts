import { TSeed } from '../services/tseed'

const SETTINGS_KEY = 'tsee-settings'

export interface AppSettings {
  lang: string
  theme: 'light' | 'dark'
  monetColor: string
  proxyMode: 'auto' | 'manual'
  vbhashAutoApply: boolean
  navigationMode: 'bottom' | 'floating'
}

const defaultSettings: AppSettings = {
  lang: 'zh',
  theme: 'dark',
  monetColor: '#006c4c',
  proxyMode: 'manual',
  vbhashAutoApply: false,
  navigationMode: 'bottom',
}

export function loadSettings(): AppSettings {
  // 1. Try loading from module private dir (persisted across cache clears)
  try {
    const diskRaw = localStorage.getItem('tsee-settings-disk')
    if (diskRaw) {
      const parsed = JSON.parse(diskRaw)
      return { ...defaultSettings, ...parsed }
    }
  } catch { /* ignore */ }

  // 2. Fallback to localStorage cache
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    }
  } catch {
    // ignore parse errors
  }

  // 3. Legacy migration
  return {
    lang: localStorage.getItem('tsee-lang') || defaultSettings.lang,
    theme: (localStorage.getItem('tsee-theme') as 'light' | 'dark') || defaultSettings.theme,
    monetColor: localStorage.getItem('tsee-monet-color') || defaultSettings.monetColor,
    proxyMode: (localStorage.getItem('tsee-proxy-mode') as 'auto' | 'manual') || defaultSettings.proxyMode,
    vbhashAutoApply: defaultSettings.vbhashAutoApply,
    navigationMode: defaultSettings.navigationMode,
  }
}

export async function syncSettingsFromDisk(): Promise<AppSettings> {
  try {
    const raw = await TSeed.system.settingsGet()
    const parsed = JSON.parse(raw || '{}')
    const merged = { ...defaultSettings, ...parsed }
    localStorage.setItem('tsee-settings-disk', JSON.stringify(merged))
    return merged
  } catch {
    return loadSettings()
  }
}

export async function saveSettings(patch: Partial<AppSettings>) {
  const current = loadSettings()
  const next = { ...current, ...patch }
  const json = JSON.stringify(next)

  // Always save to localStorage as cache
  localStorage.setItem(SETTINGS_KEY, json)
  localStorage.setItem('tsee-settings-disk', json)

  // Also persist to module private dir so clearing cache doesn't wipe it
  try {
    await TSeed.system.settingsSet(json)
  } catch {
    // If TSEED is unavailable, localStorage cache is sufficient fallback
  }
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return loadSettings()[key]
}

export function clearCacheOnly() {
  const keysToKeep = new Set([SETTINGS_KEY, 'tsee-settings-disk'])
  Object.keys(localStorage).forEach(key => {
    if (!keysToKeep.has(key)) {
      localStorage.removeItem(key)
    }
  })
  sessionStorage.clear()
}
