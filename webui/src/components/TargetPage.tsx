import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'
import { TSeed } from '../services/tseed'
import {
  Shield,
  Wrench,
  Zap,
} from 'lucide-react'

interface TargetPageProps {
  searchText?: string
  showSystemApps?: boolean
}

const MODE_TAGS: Record<string, { text: string }> = {
  auto: { text: 'AUTO' },
  modify: { text: 'MODIFY' },
  generate: { text: 'GENERATE' },
}

const ITEM_ESTIMATED_HEIGHT = 88 // px, for virtual scroll estimation
const OVERSCAN = 6

function generateMockIcon(pkg: string, appName: string): string {
  const letter = (appName || pkg).charAt(0).toUpperCase()
  const hue = pkg.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="hsl(${hue},70%,45%)"/><text x="24" y="33" font-size="22" fill="white" text-anchor="middle" font-family="sans-serif">${letter}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface AppListItemProps {
  app: {
    packageName: string
    appName: string
    isSystem: boolean
    isProxied: boolean
    certMode: 'auto' | 'modify' | 'generate'
  }
  isExpanded: boolean
  resolvedIcon?: string
  colors: ReturnType<typeof useTheme>['colors']
  onToggle: (pkg: string, current: boolean) => void
  onExpand: (pkg: string) => void
  onSetMode: (pkg: string, mode: 'auto' | 'modify' | 'generate') => void
  onLoadDetail: (pkg: string) => void
}

const AppListItem = memo(function AppListItem({
  app,
  isExpanded,
  resolvedIcon,
  colors,
  onToggle,
  onExpand,
  onSetMode,
  onLoadDetail,
}: AppListItemProps) {
  const { t } = useI18n()
  const pkg = app.packageName
  const mode = app.certMode
  const modeTag = app.isProxied ? MODE_TAGS[mode] : null
  const itemRef = useRef<HTMLDivElement>(null)
  const displayName = app.appName || pkg

  useEffect(() => {
    if (!itemRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onLoadDetail(pkg)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '120px' }
    )
    observer.observe(itemRef.current)
    return () => observer.disconnect()
  }, [pkg, onLoadDetail])

  return (
    <div
      ref={itemRef}
      data-package={pkg}
      className="rounded-3xl overflow-hidden transition-colors"
      style={{
        backgroundColor: colors.surfaceContainerLow,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
        contentVisibility: 'auto',
        containIntrinsicHeight: `${ITEM_ESTIMATED_HEIGHT}px`,
      }}
    >
      {/* Main Row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => onExpand(pkg)}
      >
        {/* Icon — lazy loaded */}
        <div className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden" style={{ backgroundColor: colors.surfaceContainerHighest }}>
          {resolvedIcon ? (
            <img src={resolvedIcon} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full animate-pulse" style={{ backgroundColor: colors.outlineVariant }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: colors.onSurface }}>
            {displayName}
          </p>
          <p className="text-xs truncate" style={{ color: colors.onSurfaceVariant }}>
            {pkg}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {app.isProxied && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: colors.primaryContainer,
                  color: colors.onPrimaryContainer,
                }}
              >
                PROXIED
              </span>
            )}
            {modeTag && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: mode === 'auto' ? colors.primaryContainer
                    : mode === 'modify' ? colors.tertiaryContainer
                    : colors.secondaryContainer,
                  color: mode === 'auto' ? colors.onPrimaryContainer
                    : mode === 'modify' ? colors.onTertiaryContainer
                    : colors.onSecondaryContainer,
                }}
              >
                {modeTag.text}
              </span>
            )}
            {app.isSystem && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  backgroundColor: colors.secondaryContainer,
                  color: colors.onSecondaryContainer,
                }}
              >
                SYSTEM
              </span>
            )}
          </div>
        </div>

        {/* Switch */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(pkg, app.isProxied)
          }}
          className="relative w-11 h-6 rounded-full transition-colors shrink-0"
          style={{
            backgroundColor: app.isProxied ? colors.primary : colors.surfaceContainerHighest,
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform"
            style={{
              backgroundColor: colors.surface,
              transform: app.isProxied ? 'translateX(20px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* Expanded — Mode selector */}
      {isExpanded && app.isProxied && (
        <div
          className="px-4 pb-4 pt-1"
        >
          <p className="text-sm font-medium mt-3 mb-2" style={{ color: colors.onSurface }}>
            {t('apps.select_mode')}
          </p>
          <div className="flex gap-2">
            {Object.entries(MODE_TAGS).map(([key]) => (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  onSetMode(pkg, key as 'auto' | 'modify' | 'generate')
                }}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors"
                style={{
                  backgroundColor: mode === key ? (
                    key === 'auto' ? colors.primaryContainer
                    : key === 'modify' ? colors.tertiaryContainer
                    : colors.secondaryContainer
                  ) : colors.surfaceContainer,
                  color: mode === key ? (
                    key === 'auto' ? colors.onPrimaryContainer
                    : key === 'modify' ? colors.onTertiaryContainer
                    : colors.onSecondaryContainer
                  ) : colors.onSurfaceVariant,
                  border: mode === key ? `1px solid ${
                    key === 'auto' ? colors.primary
                    : key === 'modify' ? colors.tertiary
                    : colors.secondary
                  }` : 'none',
                }}
              >
                {MODE_TAGS[key].text}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: colors.onSurfaceVariant }}>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3 h-3" /> AUTO: {t('apps.mode_auto_desc')}
            </span>
            <br />
            <span className="inline-flex items-center gap-1">
              <Wrench className="w-3 h-3" /> MODIFY: {t('apps.mode_mod_desc')}
            </span>
            <br />
            <span className="inline-flex items-center gap-1">
              <Shield className="w-3 h-3" /> GENERATE: {t('apps.mode_gen_desc')}
            </span>
          </p>
        </div>
      )}
    </div>
  )
})

export function TargetPage({ searchText = '', showSystemApps = true }: TargetPageProps) {
  const { colors } = useTheme()
  const { state, apps, setAppProxied, setAppMode } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [appDetails, setAppDetails] = useState<Record<string, { icon?: string }>>({})
  const [scrollTop, setScrollTop] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const isAutoProxy = state.proxyMode === 'auto'

  const loadAppDetail = useCallback(async (pkg: string) => {
    const app = apps.find(a => a.packageName === pkg)
    if (!app) return
    try {
      const result = await TSeed.app.icon(pkg)
      const detail: { icon?: string } = {}
      if (result && result.startsWith('data:')) {
        detail.icon = result.trim()
      }
      if (!detail.icon) {
        detail.icon = generateMockIcon(pkg, app.appName || pkg)
      }
      setAppDetails(prev => {
        if (prev[pkg]?.icon === detail.icon) return prev
        return { ...prev, [pkg]: { ...prev[pkg], ...detail } }
      })
    } catch {
      setAppDetails(prev => {
        if (prev[pkg]) return prev
        return { ...prev, [pkg]: { icon: generateMockIcon(pkg, app.appName || pkg) } }
      })
    }
  }, [apps])

  const filtered = useMemo(() => {
    let list = apps
    if (!showSystemApps) {
      list = list.filter(a => !a.isSystem)
    }
    if (!searchText) return list
    const q = searchText.toLowerCase()
    return list.filter(a =>
      (a.appName || '').toLowerCase().includes(q) ||
      (a.packageName || '').toLowerCase().includes(q)
    )
  }, [apps, searchText, showSystemApps])

  // Virtual scroll: compute visible range
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight - 160 : 800
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_ESTIMATED_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(filtered.length, Math.ceil((scrollTop + containerHeight) / ITEM_ESTIMATED_HEIGHT) + OVERSCAN)

  useEffect(() => {
    const onScroll = () => setScrollTop(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleToggle = useCallback((pkg: string, current: boolean) => {
    setAppProxied(pkg, !current, 'auto')
    if (!current) setExpanded(pkg)
    else setExpanded(prev => prev === pkg ? null : prev)
  }, [setAppProxied])

  const handleExpand = useCallback((pkg: string) => {
    setExpanded(prev => prev === pkg ? null : pkg)
  }, [])

  const handleSetMode = useCallback((pkg: string, mode: 'auto' | 'modify' | 'generate') => {
    setAppMode(pkg, mode)
  }, [setAppMode])

  const visibleApps = filtered.slice(startIndex, endIndex)
  const topPadding = startIndex * ITEM_ESTIMATED_HEIGHT
  const bottomPadding = (filtered.length - endIndex) * ITEM_ESTIMATED_HEIGHT

  return (
    <div ref={listRef} className="flex flex-col gap-3">
      {isAutoProxy && (
        <div
          className="rounded-3xl px-5 py-4 text-sm flex items-center gap-3"
          style={{
            backgroundColor: colors.primaryContainer,
            color: colors.onPrimaryContainer,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <Shield className="w-5 h-5 shrink-0" />
          <span>{useI18n().t('target.auto_proxy_active')}</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: colors.onSurfaceVariant }}>
          {useI18n().t('apps.no_results')}
        </div>
      ) : (
        <>
          <div style={{ height: topPadding }} />
          {visibleApps.map((app) => (
              <AppListItem
              key={app.packageName}
              app={app}
              isExpanded={expanded === app.packageName}
              resolvedIcon={appDetails[app.packageName]?.icon}
              colors={colors}
              onToggle={handleToggle}
              onExpand={handleExpand}
              onSetMode={handleSetMode}
              onLoadDetail={loadAppDetail}
            />
          ))}
          <div style={{ height: bottomPadding }} />
          <div className="text-center text-xs py-2" style={{ color: colors.onSurfaceVariant }}>
            {useI18n().t('apps.total')} {filtered.length} {useI18n().t('apps.total_suffix')}
          </div>
        </>
      )}
    </div>
  )
}
