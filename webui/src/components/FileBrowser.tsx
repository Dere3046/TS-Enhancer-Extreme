import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed } from '../services/tseed'
import {
  Folder,
  File,
  ChevronRight,
  X,
  Bookmark,
  Filter,
} from 'lucide-react'

interface DirEntry {
  name: string
  isDir: boolean
}

interface FileBrowserProps {
  onSelect: (path: string) => void
  onCancel: () => void
}

const BOOKMARKS = [
  { labelKey: 'filebrowser.download', path: '/storage/emulated/0/Download' },
  { labelKey: 'filebrowser.sdcard', path: '/sdcard' },
  { labelKey: 'filebrowser.adb', path: '/data/adb' },
]

export function FileBrowser({ onSelect, onCancel }: FileBrowserProps) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [currentPath, setCurrentPath] = useState('/sdcard')
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showXmlOnly, setShowXmlOnly] = useState(true)

  const listDir = useCallback(async (path: string) => {
    setLoading(true)
    setError('')
    try {
      const raw = await TSeed.exec('system', 'ls', path)
      const arr = JSON.parse(raw) as Array<{ n: string; d: boolean }>
      const dirs: DirEntry[] = []
      const files: DirEntry[] = []
      for (const e of arr) {
        if (e.d) dirs.push({ name: e.n, isDir: true })
        else files.push({ name: e.n, isDir: false })
      }
      dirs.sort((a, b) => a.name.localeCompare(b.name))
      files.sort((a, b) => a.name.localeCompare(b.name))
      setEntries([...dirs, ...files])
    } catch {
      setError(t('filebrowser.read_error'))
      setEntries([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    listDir(currentPath)
  }, [currentPath, listDir])

  const navigateTo = (name: string) => {
    const normalized = currentPath.replace(/\/+$/, '')
    setCurrentPath(`${normalized}/${name}`)
  }

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
    setCurrentPath(parent)
  }

  const pathSegments = currentPath.split('/').filter(Boolean)

  const visibleEntries = showXmlOnly
    ? entries.filter(e => e.isDir || e.name.endsWith('.xml'))
    : entries

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: colors.background }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-14 shrink-0"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        >
          <X className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
        </button>
        <span className="text-lg font-medium" style={{ color: colors.onSurface }}>
          {t('filebrowser.title')}
        </span>
        <button
          onClick={() => setShowXmlOnly(!showXmlOnly)}
          className="w-10 h-10 rounded-full flex items-center justify-center ml-auto"
          title={t('filebrowser.filter_xml')}
          style={{
            backgroundColor: showXmlOnly ? colors.primaryContainer : 'transparent',
          }}
        >
          <Filter
            className="w-5 h-5"
            style={{ color: showXmlOnly ? colors.onPrimaryContainer : colors.onSurfaceVariant }}
          />
        </button>
      </div>

      {/* Breadcrumb */}
      <div
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto shrink-0 text-sm"
        style={{ backgroundColor: colors.surfaceContainerLowest }}
      >
        <button
          onClick={() => setCurrentPath('/')}
          className="px-2 py-1 rounded-md font-medium shrink-0"
          style={{
            backgroundColor: currentPath === '/' ? colors.primaryContainer : 'transparent',
            color: currentPath === '/' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
          }}
        >
          /
        </button>
        {pathSegments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="w-3.5 h-3.5" style={{ color: colors.outline }} />
            <button
              onClick={() => {
                const target = '/' + pathSegments.slice(0, i + 1).join('/')
                setCurrentPath(target)
              }}
              className="px-2 py-1 rounded-md font-medium"
              style={{
                backgroundColor: i === pathSegments.length - 1 ? colors.primaryContainer : 'transparent',
                color: i === pathSegments.length - 1 ? colors.onPrimaryContainer : colors.onSurfaceVariant,
              }}
            >
              {seg}
            </button>
          </span>
        ))}
      </div>

      {/* Bookmarks */}
      <div
        className="flex items-center gap-2 px-4 py-2 overflow-x-auto shrink-0"
        style={{ backgroundColor: colors.surfaceContainerLowest }}
      >
        <Bookmark className="w-4 h-4 shrink-0" style={{ color: colors.onSurfaceVariant }} />
        {BOOKMARKS.map((bm) => (
          <button
            key={bm.path}
            onClick={() => setCurrentPath(bm.path)}
            className="px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors"
            style={{
              backgroundColor: currentPath === bm.path ? colors.primaryContainer : colors.surfaceContainer,
              color: currentPath === bm.path ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            }}
            >
              {t(bm.labelKey)}
            </button>
        ))}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: colors.onSurfaceVariant }}>
            {t('filebrowser.loading')}
          </div>
        ) : error ? (
          <div className="flex flex-col py-1">
            {currentPath !== '/' && (
              <button
                onClick={navigateUp}
                className="flex items-center gap-1 px-4 py-3 transition-colors hover:opacity-80"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.secondaryContainer }}
                >
                  <Folder className="w-5 h-5" style={{ color: colors.onSecondaryContainer }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium" style={{ color: colors.onSurface }}>..</span>
                  <span className="text-xs" style={{ color: colors.error }}>{error}</span>
                </div>
              </button>
            )}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
              {showXmlOnly ? t('filebrowser.no_xml') : t('filebrowser.empty')}
            </p>
            {showXmlOnly && (
              <button
                onClick={() => setShowXmlOnly(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
              >
                {t('filebrowser.show_all')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {/* Up button — styled as a regular directory entry */}
            {currentPath !== '/' && (
              <button
                onClick={navigateUp}
                className="flex items-center gap-1 px-4 py-3 transition-colors hover:opacity-80"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.secondaryContainer }}
                >
                  <Folder className="w-5 h-5" style={{ color: colors.onSecondaryContainer }} />
                </div>
                <span className="text-sm font-medium truncate" style={{ color: colors.onSurface }}>
                  ..
                </span>
              </button>
            )}

            {visibleEntries.map((entry) => (
              <button
                key={entry.name}
                onClick={() => {
                  if (entry.isDir) {
                    navigateTo(entry.name)
                  } else {
                    const normalized = currentPath.replace(/\/+$/, '')
                    onSelect(`${normalized}/${entry.name}`)
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-80"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: entry.isDir ? colors.secondaryContainer : colors.surfaceContainerHighest,
                  }}
                >
                  {entry.isDir ? (
                    <Folder className="w-5 h-5" style={{ color: colors.onSecondaryContainer }} />
                  ) : (
                    <File className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  )}
                </div>
                <span
                  className="text-sm truncate"
                  style={{
                    color: entry.isDir ? colors.onSurface : colors.onSurfaceVariant,
                    fontWeight: entry.isDir ? 500 : 400,
                  }}
                >
                  {entry.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
