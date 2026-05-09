import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed } from '../services/tseed'
import { Shield, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react'

const PARTITIONS = [
  { key: 'system', label: 'System (OS)' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'boot', label: 'Boot' },
  { key: 'system_ext', label: 'System Ext' },
  { key: 'product', label: 'Product' },
  { key: 'bootimage', label: 'Bootimage' },
]

type Mode = 'simple' | 'advanced'

export function SecurityPatchCard() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<Mode>('simple')
  const [simpleDate, setSimpleDate] = useState('')
  const [advancedValues, setAdvancedValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      const result = await TSeed.system.securityPatchGet()
      if (!result.trim()) return

      const lines = result.split('\n')
      const adv: Record<string, string> = {}
      let isAdvanced = false
      let simple = ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        if (trimmed.includes('=')) {
          isAdvanced = true
          const [k, v] = trimmed.split('=')
          if (k && v) adv[k.trim()] = v.trim()
        } else {
          simple = trimmed
        }
      }

      if (isAdvanced) {
        setMode('advanced')
        setAdvancedValues(adv)
      } else if (simple) {
        setMode('simple')
        setSimpleDate(simple)
      }
    } catch (e) {
      console.error('load security patch config failed:', e)
    }
  }, [])

  useEffect(() => {
    if (expanded) loadConfig()
  }, [expanded, loadConfig])

  const setAdvancedValue = (key: string, value: string) => {
    setAdvancedValues(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = async () => {
    setLoading(true)
    try {
      let config = ''

      if (mode === 'simple') {
        const date = simpleDate.trim()
        if (!/^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(date)) {
          alert(t('settings.patch_invalid') || 'Invalid date format')
          setLoading(false)
          return
        }
        config = date
      } else {
        const parts: string[] = []
        for (const p of PARTITIONS) {
          const v = advancedValues[p.key]?.trim()
          if (v) parts.push(`${p.key}=${v}`)
        }
        if (parts.length === 0) {
          alert(t('settings.patch_invalid') || 'Invalid config')
          setLoading(false)
          return
        }
        config = parts.join('\n')
      }

      await TSeed.system.securityPatchSet(config)
      await TSeed.system.securityPatchSync()
      alert(t('common.success'))
      await loadConfig()
    } catch (e) {
      console.error('apply security patch failed:', e)
      alert(t('common.failed'))
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      await TSeed.system.securityPatchSync()
      alert(t('common.success'))
    } catch (e) {
      console.error('sync security patch failed:', e)
      alert(t('common.failed'))
    }
    setLoading(false)
  }

  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.surfaceContainerLow }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: colors.secondaryContainer }}
        >
          <Shield className="w-5 h-5" style={{ color: colors.onSecondaryContainer }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-base font-medium" style={{ color: colors.onSurface }}>
            {t('tool.security_patch')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.onSurfaceVariant }}>
            {t('tool.security_patch_desc')}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 shrink-0" style={{ color: colors.onSurfaceVariant }} />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0" style={{ color: colors.onSurfaceVariant }} />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-5 flex flex-col gap-4">
          <div className="flex p-1 gap-1 rounded-xl" style={{ backgroundColor: colors.surfaceContainerHighest }}>
            <button
              onClick={() => setMode('simple')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'simple' ? colors.surface : 'transparent',
                color: mode === 'simple' ? colors.onSurface : colors.onSurfaceVariant,
              }}
            >
              {t('settings.patch_mode_simple')}
            </button>
            <button
              onClick={() => setMode('advanced')}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'advanced' ? colors.surface : 'transparent',
                color: mode === 'advanced' ? colors.onSurface : colors.onSurfaceVariant,
              }}
            >
              {t('settings.patch_mode_advanced')}
            </button>
          </div>

          {mode === 'simple' && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={simpleDate}
                onChange={(e) => setSimpleDate(e.target.value)}
                placeholder="20241101"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: colors.surfaceContainer,
                  color: colors.onSurface,
                  border: `1px solid ${colors.outlineVariant}`,
                }}
              />
              <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
                {t('settings.patch_format_hint')}
              </p>
            </div>
          )}

          {mode === 'advanced' && (
            <div className="flex flex-col gap-3">
              {PARTITIONS.map((p) => (
                <div key={p.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: colors.onSurface }}>{p.label}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAdvancedValue(p.key, 'no')}
                        className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                        style={{
                          backgroundColor: advancedValues[p.key] === 'no' ? colors.errorContainer : colors.surfaceContainerHighest,
                          color: advancedValues[p.key] === 'no' ? colors.onErrorContainer : colors.onSurfaceVariant,
                        }}
                      >
                        no
                      </button>
                      <button
                        onClick={() => setAdvancedValue(p.key, 'prop')}
                        className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                        style={{
                          backgroundColor: advancedValues[p.key] === 'prop' ? colors.primaryContainer : colors.surfaceContainerHighest,
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
                    placeholder="YYYY-MM-DD or YYYYMM"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: colors.surfaceContainer,
                      color: colors.onSurface,
                      border: `1px solid ${colors.outlineVariant}`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

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
        </div>
      )}
    </div>
  )
}
