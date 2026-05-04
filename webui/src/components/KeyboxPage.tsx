import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'
import { FileBrowser } from './FileBrowser'
import {
  Trash2,
  Shield,
  Clock,
  FileText,
  Plus,
} from 'lucide-react'

interface KeyboxPageProps {
  onBack?: () => void
}

export function KeyboxPage(_props: KeyboxPageProps) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { keyboxes, setKeyboxEnabled, removeKeybox, importKeybox, backupKeybox } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const handleExpand = (id: string) => {
    setExpanded(prev => prev === id ? null : id)
  }

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setKeyboxEnabled(id)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm(t('keybox.delete_confirm'))) return
    await removeKeybox(id)
    if (expanded === id) setExpanded(null)
  }

  const handleImport = async (path: string) => {
    try {
      await importKeybox(path)
    } catch {
      alert(t('common.failed'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Keybox List — KSU Module style cards */}
      <div className="flex flex-col gap-4">
        {keyboxes.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center text-sm"
            style={{
              backgroundColor: colors.surfaceContainerLow,
              boxShadow: `0 1px 2px ${colors.shadow}20`,
              color: colors.onSurfaceVariant,
            }}
          >
            {t('keybox.empty_folder')}
          </div>
        ) : (
          keyboxes.map((box) => {
            const isExpanded = expanded === box.id
            const shortHash = box.id.length > 20
              ? box.id.slice(0, 10) + '…' + box.id.slice(-10)
              : box.id

            return (
              <div
                key={box.id}
                className="rounded-3xl overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: colors.surfaceContainerLow,
                  boxShadow: `0 1px 2px ${colors.shadow}20`,
                }}
                onClick={() => handleExpand(box.id)}
              >
                <div className="px-5 py-4">
                  {/* Tags row */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{
                        backgroundColor: colors.secondaryContainer,
                        color: colors.onSecondaryContainer,
                      }}
                    >
                      SHA256
                    </span>
                    {box.enabled && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{
                          backgroundColor: colors.primaryContainer,
                          color: colors.onPrimaryContainer,
                        }}
                      >
                        {t('keybox.enabled')}
                      </span>
                    )}
                    {!box.enabled && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{
                          backgroundColor: colors.surfaceContainerHighest,
                          color: colors.onSurfaceVariant,
                        }}
                      >
                        {t('keybox.disabled')}
                      </span>
                    )}
                  </div>

                  {/* Title + Switch row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold" style={{ color: colors.onSurface }}>
                        {box.filename}
                      </p>
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: colors.onSurfaceVariant }}>
                        <Clock className="w-3 h-3" />
                        {box.timestamp}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleToggle(e, box.id)}
                      className="relative w-11 h-6 rounded-full transition-colors shrink-0 mt-1"
                      style={{
                        backgroundColor: box.enabled ? colors.primary : colors.surfaceContainerHighest,
                      }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform"
                        style={{
                          backgroundColor: colors.surface,
                          transform: box.enabled ? 'translateX(20px)' : 'translateX(0)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Description / Hash */}
                  <p
                    className="text-xs mt-2 font-mono truncate"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    {shortHash}
                  </p>

                  {/* Expanded actions — KSU Module style */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => handleDelete(e, box.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: colors.errorContainer,
                          color: colors.onErrorContainer,
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('common.delete')}
                      </button>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try { await backupKeybox() } catch { alert(t('common.failed')) }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: colors.tertiaryContainer,
                          color: colors.onTertiaryContainer,
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('keybox.backup')}
                      </button>

                      {box.enabled && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ml-auto"
                          style={{
                            backgroundColor: colors.primaryContainer,
                            color: colors.onPrimaryContainer,
                          }}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Sticky FAB — follows scroll within content */}
      <div className="sticky bottom-20 self-end z-40">
        <button
          onClick={() => setShowFileBrowser(true)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-opacity hover:opacity-80"
          style={{
            backgroundColor: colors.primaryContainer,
            color: colors.onPrimaryContainer,
          }}
          title={t('keybox.import')}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showFileBrowser && (
        <FileBrowser
          onSelect={(path) => {
            setShowFileBrowser(false)
            handleImport(path)
          }}
          onCancel={() => setShowFileBrowser(false)}
        />
      )}
    </div>
  )
}
