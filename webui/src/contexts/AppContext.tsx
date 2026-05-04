import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { TSeed } from '../services/tseed'
import { syncSettingsFromDisk, type AppSettings } from '../utils/settings'

export interface AppItem {
  packageName: string
  appName: string
  isSystem: boolean
  isProxied: boolean
  certMode: 'auto' | 'modify' | 'generate'
}

export interface KeyboxItem {
  id: string
  filename: string
  timestamp: string
  path: string
  enabled: boolean
}

export interface AppState {
  serviceRunning: boolean
  trickyRunning: boolean
  proxyRunning: boolean
  proxyMode: 'auto' | 'manual'
  integrityVerified: boolean | null
  developerMode: boolean
  deviceName: string
  androidVersion: string
  kernelVersion: string
  selinuxStatus: 'Enforcing' | 'Permissive' | 'Disabled'
  architecture: string
  moduleVersion: string
}

interface AppContextType {
  state: AppState
  setState: (patch: Partial<AppState>) => void

  apps: AppItem[]
  refreshApps: () => Promise<void>
  setAppProxied: (pkg: string, proxied: boolean, mode?: 'auto' | 'modify' | 'generate') => Promise<void>
  setAppMode: (pkg: string, mode: 'auto' | 'modify' | 'generate') => Promise<void>

  keyboxes: KeyboxItem[]
  refreshKeyboxes: () => Promise<void>
  setKeyboxEnabled: (id: string) => Promise<void>
  removeKeybox: (id: string) => Promise<void>
  importKeybox: (path: string) => Promise<void>
  backupKeybox: () => Promise<void>
}

const defaultState: AppState = {
  serviceRunning: false,
  trickyRunning: false,
  proxyRunning: false,
  proxyMode: 'manual',
  integrityVerified: null,
  developerMode: false,
  deviceName: '',
  androidVersion: '',
  kernelVersion: '',
  selinuxStatus: 'Enforcing',
  architecture: '',
  moduleVersion: '',
}

function loadPersistedState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem('tsee-app-state')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return {}
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => {
    const persisted = loadPersistedState()
    return { ...defaultState, ...persisted, integrityVerified: null }
  })
  const [apps, setApps] = useState<AppItem[]>([])
  const [keyboxes, setKeyboxes] = useState<KeyboxItem[]>([])

  const persistState = useCallback((next: AppState) => {
    localStorage.setItem('tsee-app-state', JSON.stringify(next))
  }, [])

  const setState = useCallback((patch: Partial<AppState>) => {
    setStateRaw(prev => {
      const next = { ...prev, ...patch }
      persistState(next)
      return next
    })
  }, [persistState])

  // ── Device info — fetch once ─────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fetchInfo = async () => {
      let deviceName = '', androidVersion = '', kernelVersion = '', architecture = '', moduleVersion = ''
      try {
          const [model, release, sdk, kv, abi] = await Promise.all([
          TSeed.device.getProp('ro.product.model'),
          TSeed.device.getProp('ro.build.version.release'),
          TSeed.device.getProp('ro.build.version.sdk'),
          TSeed.device.kernelVersion(),
          TSeed.device.getProp('ro.product.cpu.abi'),
        ])
        deviceName = model.trim()
        const rel = release.trim()
        const s = sdk.trim()
        androidVersion = rel ? `Android ${rel} (API ${s})` : ''
        kernelVersion = kv.trim()
        architecture = abi.trim()
      } catch { /* ignore */ }
      // versionCode fetched separately (single-line, avoids KSU buffer issues)
      try {
        moduleVersion = (await TSeed.device.versionCode()).trim()
        console.info('[TSEE] Version fetched:', moduleVersion || 'empty')
      } catch { /* ignore */ }
      if (cancelled) return
      setStateRaw(prev => {
        const next = { ...prev, deviceName, androidVersion, kernelVersion, architecture, moduleVersion }
        persistState(next)
        return next
      })
    }
    fetchInfo()
    return () => { cancelled = true }
  }, [persistState])

  // ── Retry device info once integrity confirmed ──────────────
  useEffect(() => {
    if (!state.integrityVerified) return
    let cancelled = false
    const t = setTimeout(async () => {
      let needUpdate = false
      const patch: Partial<AppState> = {}
      if (!state.moduleVersion) {
        try {
          patch.moduleVersion = (await TSeed.device.versionCode()).trim()
          needUpdate = true
          console.info('[TSEE] Version retry:', patch.moduleVersion || 'empty')
        } catch (e) { console.error('[TSEE] Version retry failed:', e) }
      }
      if (!cancelled && needUpdate) {
        setStateRaw(prev => {
          const next = { ...prev, ...patch }
          persistState(next)
          return next
        })
      }
    }, 2000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [state.integrityVerified])

  // ── Service state polling ────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    let lastIntegrity: boolean | null = null
    const refresh = async () => {
      let verified = false
      try {
        const result = await TSeed.system.ping()
        verified = result.trim() === 'pong'
      } catch {
        verified = false
      }
      if (cancelled) return

      if (lastIntegrity !== verified) {
        console.info(verified ? '[TSEE] Integrity OK' : '[TSEE] Integrity FAILED')
        lastIntegrity = verified
      }

      let tseet = false, tricky = false
      let autoProxyState = 'disabled'
      let diskSettings: Partial<AppSettings> = {}

      if (verified) {
        try {
          const testResult = await TSeed.service.test()
          const parts = testResult.trim().split(',')
          parts.forEach(p => {
              const [k, v] = p.split('=')
              if (k === 'tseet') tseet = v === 'true'
              if (k === 'tricky') tricky = v === 'true'
            })
        } catch { /* ignore */ }
        if (cancelled) return

        try {
          autoProxyState = (await TSeed.system.autoproxyState()).trim()
        } catch { /* ignore */ }
        if (cancelled) return

        try {
          diskSettings = await syncSettingsFromDisk()
        } catch { /* ignore */ }
        if (cancelled) return
      }

      setStateRaw(prev => {
        const next = {
          ...prev,
          integrityVerified: verified,
          serviceRunning: tseet,
          trickyRunning: tricky,
          proxyRunning: tseet,
          proxyMode: autoProxyState === 'enabled' ? 'auto' : (diskSettings.proxyMode ?? prev.proxyMode),
        }
        persistState(next)
        return next
      })
    }

    refresh()
    const interval = setInterval(refresh, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [persistState])

  // ── Apps ───────────────────────────────────────────────────────
  const refreshApps = useCallback(async () => {
    try {
      const result = await TSeed.app.listNames()
      const list = JSON.parse(result.trim()) as Array<{
        packageName: string
        appName: string
        isSystem: boolean
        isProxied: boolean
        certMode: string
      }>
      const newApps: AppItem[] = list.map(item => ({
        packageName: item.packageName,
        appName: item.appName || item.packageName,
        isSystem: item.isSystem,
        isProxied: item.isProxied,
        certMode: (item.certMode as 'auto' | 'modify' | 'generate') || 'auto',
      }))
      setApps(newApps)
    } catch (e) {
      console.error('Failed to refresh apps:', e)
    }
  }, [])

  const setAppProxied = useCallback(async (pkg: string, proxied: boolean, mode: 'auto' | 'modify' | 'generate' = 'auto') => {
    try {
      if (proxied) {
        const modeArg = mode === 'modify' ? 'mod' : mode === 'generate' ? 'gen' : 'auto'
        await TSeed.app.add(pkg, modeArg)
      } else {
        await TSeed.app.remove(pkg)
      }
      await refreshApps()
    } catch (e) {
      console.error('Failed to set app proxied:', e)
    }
  }, [refreshApps])

  const setAppMode = useCallback(async (pkg: string, mode: 'auto' | 'modify' | 'generate') => {
    try {
      const modeArg = mode === 'modify' ? 'mod' : mode === 'generate' ? 'gen' : 'auto'
      await TSeed.app.add(pkg, modeArg)
      await refreshApps()
    } catch (e) {
      console.error('Failed to set app mode:', e)
    }
  }, [refreshApps])

  // ── Keyboxes ───────────────────────────────────────────────────
  const refreshKeyboxes = useCallback(async () => {
    try {
      const result = await TSeed.keybox.list()
      const lines = result.trim().split('\n').filter(Boolean)
      const items: KeyboxItem[] = lines.map(filename => {
        const match = filename.match(/keybox_(.+)\.xml/)
        let timestamp = filename
        if (match) {
          const raw = match[1]
          const [datePart, timePart] = raw.split('T')
          const timeFormatted = timePart ? timePart.replace(/-/g, ':') : ''
          timestamp = `${datePart} ${timeFormatted}`
        }
        return {
          id: filename,
          filename,
          timestamp,
          path: `/data/adb/tricky_store/keybox_backup/${filename}`,
          enabled: false,
        }
      })
      setKeyboxes(items)
    } catch (e) {
      console.error('Failed to refresh keyboxes:', e)
      setKeyboxes([])
    }
  }, [])

  const setKeyboxEnabled = useCallback(async (id: string) => {
    try {
      const path = `/data/adb/tricky_store/keybox_backup/${id}`
      await TSeed.keybox.restore(path)
      await refreshKeyboxes()
    } catch (e) {
      console.error('Failed to restore keybox:', e)
    }
  }, [refreshKeyboxes])

  const removeKeybox = useCallback(async (id: string) => {
    try {
      const path = `/data/adb/tricky_store/keybox_backup/${id}`
      await TSeed.keybox.deleteBackup(path)
      await refreshKeyboxes()
    } catch (e) {
      console.error('Failed to delete keybox backup:', e)
    }
  }, [refreshKeyboxes])

  const importKeybox = useCallback(async (path: string) => {
    try {
      await TSeed.keybox.import(path)
      await refreshKeyboxes()
    } catch (e) {
      console.error('Failed to import keybox:', e)
      throw e
    }
  }, [refreshKeyboxes])

  const backupKeybox = useCallback(async () => {
    try {
      await TSeed.keybox.backup()
      await refreshKeyboxes()
    } catch (e) {
      console.error('Failed to backup keybox:', e)
      throw e
    }
  }, [refreshKeyboxes])

  // ── Load apps/keyboxes after fresh integrity confirmation ──
  const appsLoadedRef = useRef(false)
  useEffect(() => {
    if (state.integrityVerified && !appsLoadedRef.current) {
      const t = setTimeout(() => {
        appsLoadedRef.current = true
        refreshApps()
        refreshKeyboxes()
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [state.integrityVerified, refreshApps, refreshKeyboxes])

  return (
    <AppContext.Provider
      value={{
        state,
        setState,
        apps,
        refreshApps,
        setAppProxied,
        setAppMode,
        keyboxes,
        refreshKeyboxes,
        setKeyboxEnabled,
        removeKeybox,
        importKeybox,
        backupKeybox,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
