const SETTINGS_KEY = 'tsee-settings'

export interface AppSettings {
  lang: string
  theme: 'light' | 'dark'
  monetColor: string
  navigationMode: 'bottom' | 'floating'
}

const defaultSettings: AppSettings = {
  lang: 'zh',
  theme: 'dark',
  monetColor: '#006c4c',
  navigationMode: 'bottom',
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    }
  } catch {
    // ignore parse errors
  }

  return {
    lang: localStorage.getItem('tsee-lang') || defaultSettings.lang,
    theme: (localStorage.getItem('tsee-theme') as 'light' | 'dark') || defaultSettings.theme,
    monetColor: localStorage.getItem('tsee-monet-color') || defaultSettings.monetColor,
    navigationMode: defaultSettings.navigationMode,
  }
}

export async function syncSettingsFromDisk(): Promise<AppSettings> {
  return loadSettings()
}

export async function saveSettings(patch: Partial<AppSettings>) {
  const current = loadSettings()
  const next = { ...current, ...patch }
  const json = JSON.stringify(next)
  localStorage.setItem(SETTINGS_KEY, json)
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return loadSettings()[key]
}

export function clearCacheOnly() {
  const keysToKeep = new Set([SETTINGS_KEY, 'tsee-settings-disk', 'tsee-lang', 'tsee-theme', 'tsee-monet-color'])
  Object.keys(localStorage).forEach(key => {
    if (!keysToKeep.has(key)) {
      localStorage.removeItem(key)
    }
  })
  sessionStorage.clear()
}
