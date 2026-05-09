import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed, Paths } from '../services/tseed'
import { Download, FileInput, Shield } from 'lucide-react'

export function KeyboxPage() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [importPath, setImportPath] = useState('')
  const [hasKeybox, setHasKeybox] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkKeybox = useCallback(async () => {
    try {
      const result = await TSeed.file.exists(Paths.KEYBOX)
      setHasKeybox(result.trim() === 'exists')
    } catch { setHasKeybox(false) }
  }, [])

  useEffect(() => {
    checkKeybox()
  }, [checkKeybox])

  const handleSteal = async (source: 'a' | 'b' | 'c') => {
    setLoading(true)
    try {
      await TSeed.stealkeybox(source)
      await checkKeybox()
    } catch (e) {
      console.error('Steal failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importPath.trim()) return
    setLoading(true)
    try {
      await TSeed.file.cp(importPath.trim(), Paths.KEYBOX)
      await TSeed.file.chmod(Paths.KEYBOX, '644')
      setImportPath('')
      await checkKeybox()
    } catch (e) {
      console.error('Import failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl p-6 flex items-center gap-4"
        style={{ backgroundColor: colors.surfaceContainerLow }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: hasKeybox ? colors.primaryContainer : colors.errorContainer }}
        >
          <Shield className="w-6 h-6"
            style={{ color: hasKeybox ? colors.onPrimaryContainer : colors.onErrorContainer }}
          />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: colors.onSurface }}>
            {t('keybox.current_status')}
          </p>
          <p className="text-xs" style={{ color: hasKeybox ? colors.primary : colors.error }}>
            {hasKeybox ? t('keybox.exists') : t('keybox.not_found')}
          </p>
        </div>
      </div>
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.surfaceContainerLow }}>
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('keybox.title')}
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-2">
          {(['a', 'b', 'c'] as const).map((src) => (
            <button
              key={src}
              onClick={() => handleSteal(src)}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
            >
              <Download className="w-4 h-4" />
              {t(`keybox.steal_${src}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.surfaceContainerLow }}>
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('keybox.import')}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>
            {t('keybox.import_desc')}
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-3">
          <input
            type="text"
            value={importPath}
            onChange={(e) => setImportPath(e.target.value)}
            placeholder={t('keybox.import_path')}
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
              color: colors.onSurface,
            }}
          />
          <button
            onClick={handleImport}
            disabled={loading || !importPath.trim()}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
          >
            <FileInput className="w-4 h-4" />
            {t('keybox.import')}
          </button>
        </div>
      </div>
    </div>
  )
}

