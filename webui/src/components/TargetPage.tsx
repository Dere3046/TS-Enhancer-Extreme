import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed, Paths } from '../services/tseed'

interface AppEntry {
  packageName: string
  appName: string
  isSystem: boolean
}

const BATCH_SIZE = 10

const AppItem = memo(function AppItem({
  app,
  checked,
  colors,
  onToggle,
}: {
  app: AppEntry
  checked: boolean
  colors: ReturnType<typeof useTheme>['colors']
  onToggle: (pkg: string, isSystem: boolean) => void
}) {
  const iconRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!iconRef.current) return
    iconRef.current.src = `ksu://icon/${app.packageName}`
  }, [app.packageName])

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ backgroundColor: colors.surfaceContainerLow }}
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
        onClick={() => onToggle(app.packageName, app.isSystem)}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{
          backgroundColor: checked ? colors.primary : colors.surfaceContainerHighest,
          cursor: 'pointer',
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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getAppLabel(packageName: string): Promise<string> {
  const ksu = (window as any).ksu
  if (!ksu || typeof ksu.getPackagesInfo !== 'function') return packageName
  try {
    const info = JSON.parse(ksu.getPackagesInfo(`["${packageName}"]`))
    if (info && info[0] && info[0].appLabel) return info[0].appLabel.trim()
  } catch { /* ignore */ }
  return packageName
}

async function processPackagesBatch(packages: string[], isSystem: boolean): Promise<AppEntry[]> {
  const entries: AppEntry[] = []
  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(pkg => getAppLabel(pkg)))
    for (let j = 0; j < batch.length; j++) {
      entries.push({ packageName: batch[j].trim(), appName: results[j] || batch[j].trim(), isSystem })
    }
    await delay(10)
  }
  return entries
}

async function fetchPackagesNative(): Promise<{ user: string[]; system: string[] } | null> {
  const ksu = (window as any).ksu
  if (!ksu) return null
  try {
    if (typeof ksu.listUserPackages === 'function' && typeof ksu.listSystemPackages === 'function') {
      return {
        user: JSON.parse(ksu.listUserPackages() || '[]'),
        system: JSON.parse(ksu.listSystemPackages() || '[]'),
      }
    }
  } catch { /* ignore */ }
  return null
}

async function fetchPackagesPM(): Promise<{ user: string[]; system: string[] }> {
  const [thirdRaw, sysRaw] = await Promise.all([
    TSeed.pm.listThirdParty(),
    TSeed.pm.listSystem(),
  ])
  return {
    user: thirdRaw.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean),
    system: sysRaw.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean),
  }
}

export function TargetPage({ searchText = '', showSystemApps = false, blacklistMode = false, onBlacklistModeChange }: TargetPageProps) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [allApps, setAllApps] = useState<AppEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [, tick] = useState(0)

  // use Set in ref to avoid re-render on toggle
  const thirdRef = useRef<Set<string>>(new Set())
  const systemRef = useRef<Set<string>>(new Set())

  const search = searchText
  const showSystem = showSystemApps

  // load config once
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [usr, sys, bl] = await Promise.all([
          TSeed.file.read(Paths.USR_TXT).catch(() => ''),
          TSeed.file.read(Paths.SYS_TXT).catch(() => ''),
          TSeed.file.exists(Paths.BLACKLIST).catch(() => 'not exists'),
        ])
        if (cancelled) return
        thirdRef.current = new Set(usr.split('\n').map(s => s.trim()).filter(Boolean))
        systemRef.current = new Set(sys.split('\n').map(s => s.trim()).filter(Boolean))
        onBlacklistModeChange?.(bl.trim() === 'exists')
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [onBlacklistModeChange])

  // fetch apps once
  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      if (appCache) {
        setAllApps(appCache)
        setLoading(false)
        return
      }

      setLoading(true)
      setProgress(10)
      setProgressText(t('target.loading_init') || 'Initializing...')
      await delay(100)

      try {
        let userPkgs: string[] = []
        let systemPkgs: string[] = []

        setProgress(20)
        setProgressText(t('target.fetching_apps') || 'Fetching app list...')

        const native = await fetchPackagesNative()
        if (native) {
          userPkgs = native.user
          systemPkgs = native.system
        } else {
          const pm = await fetchPackagesPM()
          userPkgs = pm.user
          systemPkgs = pm.system
        }

        setProgress(40)
        setProgressText(t('target.processing_apps') || 'Processing apps...')
        const userEntries = await processPackagesBatch(userPkgs, false)

        setProgress(60)
        setProgressText(t('target.processing_system') || 'Processing system apps...')
        const systemEntries = await processPackagesBatch(systemPkgs, true)

        const entries = [...userEntries, ...systemEntries]
        appCache = entries
        if (!cancelled) {
          setAllApps(entries)
          setProgress(100)
          setProgressText(t('target.complete') || 'Complete')
          await delay(200)
          setLoading(false)
        }
      } catch (e) {
        console.error('fetch apps failed:', e)
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [t])

  useEffect(() => {
    return () => { appCache = null }
  }, [])

  const getChecked = useCallback((pkg: string, isSystem: boolean) => {
    if (isSystem) {
      return blacklistMode ? !systemRef.current.has(pkg) : systemRef.current.has(pkg)
    }
    return blacklistMode ? thirdRef.current.has(pkg) : !thirdRef.current.has(pkg)
  }, [blacklistMode])

  const handleToggle = useCallback((pkg: string, isSystem: boolean) => {
    if (isSystem) {
      const set = systemRef.current
      if (set.has(pkg)) set.delete(pkg)
      else set.add(pkg)
    } else {
      const set = thirdRef.current
      if (set.has(pkg)) set.delete(pkg)
      else set.add(pkg)
    }
    tick(v => v + 1)
  }, [])

  // auto save
  const lastSaveRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSave = useCallback(async () => {
    const now = Date.now()
    if (now - lastSaveRef.current < 500) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => doSave(), 1000)
      return
    }
    try {
      await TSeed.file.write(Paths.USR_TXT, [...thirdRef.current].join('\n'))
      await TSeed.file.write(Paths.SYS_TXT, [...systemRef.current].join('\n'))
      if (blacklistMode) {
        await TSeed.file.touch(Paths.BLACKLIST)
      } else {
        await TSeed.file.rm(Paths.BLACKLIST)
      }
      TSeed.packagelistupdate().catch(() => {})
      lastSaveRef.current = Date.now()
    } catch (e) {
      console.error('save failed:', e)
    }
  }, [blacklistMode])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => doSave(), 1000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [doSave])

  // stable filtered list (alpha order, no re-sort on toggle)
  const filtered = useMemo(() => {
    let list = allApps.filter(app => showSystem || !app.isSystem)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        (a.appName || '').toLowerCase().includes(q) ||
        (a.packageName || '').toLowerCase().includes(q)
      )
    }

    // stable alpha sort, never changes on toggle
    list.sort((a, b) =>
      (a.appName || a.packageName || '').localeCompare(b.appName || b.packageName || '')
    )

    return list
  }, [allApps, showSystem, search])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-full max-w-xs h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.surfaceContainerHighest }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: colors.primary }}
          />
        </div>
        <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
          {progressText} ({progress}%)
        </p>
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
        filtered.map((app) => (
          <AppItem
            key={app.packageName}
            app={app}
            checked={getChecked(app.packageName, app.isSystem)}
            colors={colors}
            onToggle={handleToggle}
          />
        ))
      )}
    </div>
  )
}
