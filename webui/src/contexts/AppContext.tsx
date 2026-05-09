import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { TSeed, execShell, Paths } from '../services/tseed'

export interface AppState {
  serviceRunning: boolean
  trickyRunning: boolean
  deviceName: string
  androidVersion: string
  kernelVersion: string
  selinuxStatus: 'Enforcing' | 'Permissive' | 'Disabled' | 'Unknown'
  architecture: string
  moduleVersion: string
  rootType: string
  developerMode: boolean
  hasKeybox: boolean
}

const defaultState: AppState = {
  serviceRunning: false,
  trickyRunning: false,
  deviceName: '',
  androidVersion: '',
  kernelVersion: '',
  selinuxStatus: 'Unknown',
  architecture: '',
  moduleVersion: '',
  rootType: '',
  developerMode: false,
  hasKeybox: false,
}

function loadPersistedState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem('tsee-app-state')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return {}
}

interface AppContextType {
  state: AppState
  setState: (patch: Partial<AppState>) => void
  refreshStatus: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => {
    const persisted = loadPersistedState()
    return { ...defaultState, ...persisted }
  })

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

  // ── Device info — fetch once ───────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fetchInfo = async () => {
      try {
        const [model, release, sdk, kv, abi, selinux, moduleVer, keyboxCheck] = await Promise.all([
          TSeed.device.getProp('ro.product.model').catch(() => ''),
          TSeed.device.getProp('ro.build.version.release').catch(() => ''),
          TSeed.device.getProp('ro.build.version.sdk').catch(() => ''),
          TSeed.device.kernelVersion().catch(() => ''),
          TSeed.device.getProp('ro.product.cpu.abi').catch(() => ''),
          execShell('getenforce').catch(() => 'Unknown'),
          TSeed.device.version().catch(() => ''),
          TSeed.file.exists(Paths.KEYBOX).catch(() => 'not exists'),
        ])
        if (cancelled) return
        const androidVer = release.trim() ? `Android ${release.trim()} (API ${sdk.trim()})` : ''
        setStateRaw(prev => {
          const next = {
            ...prev,
            deviceName: model.trim(),
            androidVersion: androidVer,
            kernelVersion: kv.trim(),
            architecture: abi.trim(),
            moduleVersion: moduleVer.trim(),
            selinuxStatus: (selinux.trim() as AppState['selinuxStatus']) || 'Unknown',
            hasKeybox: keyboxCheck.trim() === 'exists',
          }
          persistState(next)
          return next
        })
      } catch { /* ignore */ }
    }
    fetchInfo()
    return () => { cancelled = true }
  }, [persistState])

  // ── Service state polling ──────────────────────────────────
  const refreshStatus = useCallback(async () => {
    try {
      const [tsState, tseeState] = await Promise.all([
        TSeed.tsctl('state').catch(() => 'false'),
        TSeed.tseectl('state').catch(() => 'false'),
      ])
      setStateRaw(prev => {
        const next = {
          ...prev,
          trickyRunning: tsState.trim() === 'true',
          serviceRunning: tseeState.trim() === 'true',
        }
        persistState(next)
        return next
      })
    } catch { /* ignore */ }
  }, [persistState])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 10000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  return (
    <AppContext.Provider value={{ state, setState, refreshStatus }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an AppProvider')
  return ctx
}
