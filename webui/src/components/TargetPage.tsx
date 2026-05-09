import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed, Paths } from '../services/tseed'

interface AppEntry {
  packageName: string
  appName: string
  isSystem: boolean
}

interface AppItemProps {
  app: AppEntry
  checked: boolean
  disabled: boolean
  colors: ReturnType<typeof useTheme>['colors']
  onToggle: (pkg: string, isSystem: boolean) => void
}

const AppItem = memo(function AppItem({ app, checked, disabled, colors, onToggle }: AppItemProps) {
  const iconRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!iconRef.current) return
    iconRef.current.src = `ksu://icon/${app.packageName}`
  }, [app.packageName])

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ backgroundColor: colors.surfaceContainerLow, opacity: disabled ? 0.6 : 1 }}
    >
      <img
        ref={iconRef}
        className="w-10 h-10 rounded-xl shrink-0"
        style={{ objectFit: 'cover' }}
        alt=""
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: colors.onSurface }}>
          {app.appName}
        </p>
        <p className="text-xs truncate" style={{ color: colors.onSurfaceVariant }}>
          {app.packageName}
        </p>
        <div className="flex gap-1.5 mt-0.5">
          {app.isSystem ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}>
              SYSTEM
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}>
              USER
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => !disabled && onToggle(app.packageName, app.isSystem)}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{
          backgroundColor: checked ? colors.primary : colors.surfaceContainerHighest,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform"
          style={{
            backgroundColor: colors.surface,
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
})

interface TargetPageProps {
  searchText?: string
  showSystemApps?: boolean
  blacklistMode?: boolean
  onBlacklistModeChange?: (v: boolean) => void
}

let appCache: AppEntry[] | null = null

async function fetchPackagesNative(): Promise<{ user: string[]; system: string[] } | null> {
  const ksu = (window as any).ksu
  if (!ksu) return null

  try {
    if (typeof ksu.listUserPackages === 'function' && typeof ksu.listSystemPackages === 'function') {
      const userPkgs = JSON.parse(ksu.listUserPackages() || '[]')
      const systemPkgs = JSON.parse(ksu.listSystemPackages() || '[]')
      return { user: userPkgs, system: systemPkgs }
    }
  } catch { /* ignore */ }

  return null
}

async function getAppLabel(packageName: string): Promise<string | null> {
  const ksu = (window as any).ksu
  if (!ksu || typeof ksu.getPackagesInfo !== 'function') return null

  try {
    const info = JSON.parse(ksu.getPackagesInfo(`["${packageName}"]`))
    if (info && info[0] && info[0].appLabel) {
      return info[0].appLabel
    }
  } catch { /* ignore */ }

  return null
}

async function fetchPackagesPM(): Promise<{ user: string[]; system: string[] }> {
  const [thirdRaw, sysRaw] = await Promise.all([
    TSeed.pm.listThirdParty(),
    TSeed.pm.listSystem(),
  ])

  const user = thirdRaw.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
  const system = sysRaw.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)

  return { user, system }
}

export function TargetPage({ searchText = '', showSystemApps = false, blacklistMode = false, onBlacklistModeChange }: TargetPageProps) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [allApps, setAllApps] = useState<AppEntry[]>([])
  const [thirdPartyList, setThirdPartyList] = useState<string[]>([])
  const [systemList, setSystemList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const search = searchText
  const showSystem = showSystemApps

  const loadConfig = useCallback(async () => {
    try {
      const [usr, sys, bl] = await Promise.all([
        TSeed.file.read(Paths.USR_TXT).catch(() => ''),
        TSeed.file.read(Paths.SYS_TXT).catch(() => ''),
        TSeed.file.exists(Paths.BLACKLIST).catch(() => 'not exists'),
      ])
      setThirdPartyList(usr.split('\n').map(s => s.trim()).filter(Boolean))
      setSystemList(sys.split('\n').map(s => s.trim()).filter(Boolean))
      onBlacklistModeChange?.(bl.trim() === 'exists')
    } catch { /* ignore */ }
  }, [onBlacklistModeChange])

  const fetchApps = useCallback(async () => {
    if (appCache) {
      setAllApps(appCache)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let nativeResult = await fetchPackagesNative()
      let { user: userPkgs, system: sysPkgs } = nativeResult || { user: [], system: [] }

      if (userPkgs.length === 0 && sysPkgs.length === 0) {
        const pmResult = await fetchPackagesPM()
        userPkgs = pmResult.user
        sysPkgs = pmResult.system
      }

      const entries: AppEntry[] = []

      for (const pkg of userPkgs) {
        const label = await getAppLabel(pkg)
        entries.push({ packageName: pkg, appName: label || pkg, isSystem: false })
      }

      for (const pkg of sysPkgs) {
        const label = await getAppLabel(pkg)
        entries.push({ packageName: pkg, appName: label || pkg, isSystem: true })
      }

      appCache = entries
      setAllApps(entries)
    } catch (e) {
      console.error('fetch apps failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
    fetchApps()
  }, [loadConfig, fetchApps])

  useEffect(() => {
    return () => {
      appCache = null
    }
  }, [])

  const getChecked = useCallback((pkg: string, isSystem: boolean) => {
    if (isSystem) {
      const inSystemList = systemList.includes(pkg)
      return blacklistMode ? !inSystemList : inSystemList
    } else {
      const inThirdPartyList = thirdPartyList.includes(pkg)
      return blacklistMode ? inThirdPartyList : !inThirdPartyList
    }
  }, [systemList, thirdPartyList, blacklistMode])

  const getDisabled = useCallback(() => {
    return false
  }, [])

  const handleToggle = useCallback((pkg: string, isSystem: boolean) => {
    if (isSystem) {
      setSystemList(prev => {
        const inList = prev.includes(pkg)
        return inList ? prev.filter(p => p !== pkg) : [...prev, pkg]
      })
    } else {
      setThirdPartyList(prev => {
        const inList = prev.includes(pkg)
        return inList ? prev.filter(p => p !== pkg) : [...prev, pkg]
      })
    }
  }, [])

  const lastSaveTimeRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSave = useCallback(async () => {
    const now = Date.now()
    if (now - lastSaveTimeRef.current < 500) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => doSave(), 1000)
      return
    }

    try {
      await TSeed.file.write(Paths.USR_TXT, thirdPartyList.join('\n'))
      await TSeed.file.write(Paths.SYS_TXT, systemList.join('\n'))
      if (blacklistMode) {
        await TSeed.file.touch(Paths.BLACKLIST)
      } else {
        await TSeed.file.rm(Paths.BLACKLIST)
      }
      TSeed.packagelistupdate().catch(() => {})
      lastSaveTimeRef.current = Date.now()
    } catch (e) {
      console.error('save failed:', e)
    }
  }, [thirdPartyList, systemList, blacklistMode])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => doSave(), 1000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [thirdPartyList, systemList, blacklistMode, doSave])

  const filtered = useMemo(() => {
    let list = allApps.filter(app => showSystem || !app.isSystem)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        (a.appName || '').toLowerCase().includes(q) ||
        (a.packageName || '').toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (a.isSystem !== b.isSystem) {
        return a.isSystem ? 1 : -1
      }

      const aChecked = getChecked(a.packageName, a.isSystem)
      const bChecked = getChecked(b.packageName, b.isSystem)

      if (!a.isSystem && !b.isSystem) {
        if (blacklistMode) {
          if (aChecked !== bChecked) return aChecked ? -1 : 1
        } else {
          if (aChecked !== bChecked) return aChecked ? 1 : -1
        }
      } else {
        if (aChecked !== bChecked) return aChecked ? -1 : 1
      }

      return (a.appName || a.packageName || '').localeCompare(b.appName || b.packageName || '')
    })

    return list
  }, [allApps, showSystem, search, blacklistMode, getChecked])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: colors.primaryContainer, borderTopColor: colors.primary }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: colors.onSurfaceVariant }}>
          {t('target.no_results')}
        </div>
      ) : (
        <>
          {filtered.map((app) => (
            <div key={app.packageName}>
              <AppItem
                app={app}
                checked={getChecked(app.packageName, app.isSystem)}
                disabled={getDisabled()}
                colors={colors}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
