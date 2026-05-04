import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed } from '../services/tseed'
import { Calendar, RotateCcw, Check } from 'lucide-react'

const PARTITIONS = [
  { key: 'system', label: 'System (OS)' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'boot', label: 'Boot' },
  { key: 'system_ext', label: 'System Ext' },
  { key: 'product', label: 'Product' },
  { key: 'bootimage', label: 'Bootimage' },
]

type Mode = 'simple' | 'advanced'

export function SecurityPatchPage() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('simple')
  const [simpleDate, setSimpleDate] = useState('')
  const [advancedValues, setAdvancedValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState('')

  const loadConfig = useCallback(async () => {
    try {
      const result = await TSeed.system.securityPatchGet()
      setCurrentConfig(result)
      // Parse existing config
      if (result) {
        const lines = result.split('\n')
        const adv: Record<string, string> = {}
        let isAdvanced = false
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          if (trimmed.includes('=')) {
            isAdvanced = true
            const [k, v] = trimmed.split('=')
            if (k && v) adv[k.trim()] = v.trim()
          } else {
            // Simple mode single date
            setSimpleDate(trimmed)
          }
        }
        if (isAdvanced) {
          setMode('advanced')
          setAdvancedValues(adv)
        } else if (simpleDate) {
          setMode('simple')
        }
      }
    } catch (e) {
      console.error('Failed to load security patch config:', e)
    }
  }, [simpleDate])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleApply = async () => {
    setLoading(true)
    try {
      let config = ''
      if (mode === 'simple') {
        if (!/^\d{4}-\d{2}-\d{2}$|^\d{8}$/.test(simpleDate.trim())) {
          alert(t('settings.patch_invalid'))
          setLoading(false)
          return
        }
        config = simpleDate.trim()
      } else {
        const parts: string[] = []
        for (const p of PARTITIONS) {
          const v = advancedValues[p.key]?.trim()
          if (v) {
            parts.push(`${p.key}=${v}`)
          }
        }
        if (parts.length === 0) {
          alert(t('settings.patch_invalid'))
          setLoading(false)
          return
        }
        config = parts.join(',')
      }
      await TSeed.system.securityPatchSet(config)
      await TSeed.system.securityPatchSync()
      alert(t('settings.patch_updated'))
      await loadConfig()
    } catch (e) {
      console.error('Failed to apply security patch:', e)
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      await TSeed.system.securityPatchSync()
      alert(t('settings.patch_synced'))
    } catch (e) {
      console.error('Failed to sync security patch:', e)
    }
    setLoading(false)
  }

  const setAdvancedValue = (key: string, value: string) => {
    setAdvancedValues(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current config preview */}
      {currentConfig && (
        <div
          className="rounded-3xl p-5 font-mono text-xs whitespace-pre-wrap"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            boxShadow: `0 1px 2px ${colors.shadow}20`,
            color: colors.onSurfaceVariant,
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
            {t('settings.current_config')}
          </p>
          {currentConfig || t('autoproxy.empty')}
        </div>
      )}

      {/* Mode switcher */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="flex p-1 gap-1">
          <button
            onClick={() => setMode('simple')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: mode === 'simple' ? colors.primaryContainer : 'transparent',
              color: mode === 'simple' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            }}
          >
            {t('settings.patch_mode_simple')}
          </button>
          <button
            onClick={() => setMode('advanced')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: mode === 'advanced' ? colors.primaryContainer : 'transparent',
              color: mode === 'advanced' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            }}
          >
            {t('settings.patch_mode_advanced')}
          </button>
        </div>
      </div>

      {/* Simple mode */}
      {mode === 'simple' && (
        <div
          className="rounded-3xl overflow-hidden p-6"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            boxShadow: `0 1px 2px ${colors.shadow}20`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
            <p className="text-sm font-medium" style={{ color: colors.onSurface }}>
              {t('settings.enter_patch_date')}
            </p>
          </div>
          <input
            type="text"
            value={simpleDate}
            onChange={(e) => setSimpleDate(e.target.value)}
            placeholder="2024-11-01"
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
              color: colors.onSurface,
            }}
          />
          <p className="text-xs mt-2" style={{ color: colors.onSurfaceVariant }}>
            {t('settings.patch_format_hint')}
          </p>
        </div>
      )}

      {/* Advanced mode */}
      {mode === 'advanced' && (
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            boxShadow: `0 1px 2px ${colors.shadow}20`,
          }}
        >
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-medium" style={{ color: colors.onSurfaceVariant }}>
              {t('settings.patch_per_partition')}
            </p>
          </div>
          <div className="px-5 pb-4 flex flex-col gap-3">
            {PARTITIONS.map((p) => (
              <div key={p.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: colors.onSurface }}>
                    {p.label}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAdvancedValue(p.key, 'no')}
                      className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: advancedValues[p.key] === 'no' ? colors.errorContainer : colors.surfaceContainer,
                        color: advancedValues[p.key] === 'no' ? colors.onErrorContainer : colors.onSurfaceVariant,
                      }}
                    >
                      no
                    </button>
                    <button
                      onClick={() => setAdvancedValue(p.key, 'prop')}
                      className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: advancedValues[p.key] === 'prop' ? colors.primaryContainer : colors.surfaceContainer,
                        color: advancedValues[p.key] === 'prop' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                      }}
                    >
                      prop
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={advancedValues[p.key] || ''}
                  onChange={(e) => setAdvancedValue(p.key, e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.onSurface,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{
            backgroundColor: colors.primary,
            color: colors.onPrimary,
          }}
        >
          <Check className="w-4 h-4" />
          {t('common.save')}
        </button>
        <button
          onClick={handleSync}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{
            backgroundColor: colors.secondaryContainer,
            color: colors.onSecondaryContainer,
          }}
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Help text */}
      <div
          className="rounded-3xl p-5 text-xs leading-relaxed"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            boxShadow: `0 1px 2px ${colors.shadow}20`,
            color: colors.onSurfaceVariant,
        }}
      >
        <p className="font-medium mb-1" style={{ color: colors.onSurface }}>
          {t('settings.patch_help_title')}
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>{t('settings.patch_help_simple')}</li>
          <li>{t('settings.patch_help_advanced')}</li>
          <li>{t('settings.patch_help_no')}</li>
          <li>{t('settings.patch_help_prop')}</li>
        </ul>
      </div>
    </div>
  )
}
