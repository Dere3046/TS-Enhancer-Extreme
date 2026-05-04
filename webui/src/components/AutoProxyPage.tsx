import { useState, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed } from '../services/tseed'
import { List, Plus, X } from 'lucide-react'

type ProxyListType = 'syswl' | 'sysbl' | 'usrbl' | 'exclude'

interface ProxyListDef {
  key: ProxyListType
  titleKey: string
  desc: string
}

const LISTS: ProxyListDef[] = [
  { key: 'syswl', titleKey: 'autoproxy.sys_whitelist', desc: 'sys_whitelist' },
  { key: 'sysbl', titleKey: 'autoproxy.sys_blacklist', desc: 'sys_blacklist' },
  { key: 'usrbl', titleKey: 'autoproxy.usr_blacklist', desc: 'usr_blacklist' },
  { key: 'exclude', titleKey: 'autoproxy.exclude', desc: 'exclude' },
]

const MODE_OPTIONS = [
  { value: 'user_only', labelKey: 'autoproxy.mode_user_only' },
  { value: 'sys_whitelist', labelKey: 'autoproxy.mode_sys_whitelist' },
  { value: 'sys_blacklist', labelKey: 'autoproxy.mode_sys_blacklist' },
  { value: 'custom', labelKey: 'autoproxy.mode_custom' },
]

export function AutoProxyPage() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [mode, setMode] = useState('user_only')
  const [items, setItems] = useState<Record<ProxyListType, string[]>>({
    syswl: [],
    sysbl: [],
    usrbl: [],
    exclude: [],
  })
  const [inputs, setInputs] = useState<Record<ProxyListType, string>>({
    syswl: '',
    sysbl: '',
    usrbl: '',
    exclude: '',
  })

  const handleSetMode = useCallback(async (newMode: string) => {
    setMode(newMode)
    try {
      await TSeed.proxyconfig.setMode(newMode)
    } catch (e) {
      console.error('Failed to set proxy mode:', e)
    }
  }, [])

  const handleAdd = useCallback(async (type: ProxyListType) => {
    const pkg = inputs[type].trim()
    if (!pkg) return
    setItems(prev => ({ ...prev, [type]: [...prev[type], pkg] }))
    setInputs(prev => ({ ...prev, [type]: '' }))
    try {
      await TSeed.proxyconfig.add(type, pkg)
    } catch (e) {
      console.error('Failed to add to proxy list:', e)
    }
  }, [inputs])

  const handleRemove = useCallback(async (type: ProxyListType, pkg: string) => {
    setItems(prev => ({ ...prev, [type]: prev[type].filter(p => p !== pkg) }))
    try {
      await TSeed.proxyconfig.remove(type, pkg)
    } catch (e) {
      console.error('Failed to remove from proxy list:', e)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Selector */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="p-6 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('autoproxy.mode')}
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-2">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSetMode(opt.value)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
              style={{
                backgroundColor: mode === opt.value ? colors.primaryContainer : colors.surfaceContainer,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: mode === opt.value ? colors.primary : colors.outline,
                }}
              >
                {mode === opt.value && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                )}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: mode === opt.value ? colors.onPrimaryContainer : colors.onSurface }}
              >
                {t(opt.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List Managers */}
      {LISTS.map((list) => (
        <div
          key={list.key}
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            boxShadow: `0 1px 2px ${colors.shadow}20`,
          }}
        >
          <div className="px-6 pt-5 pb-2 flex items-center gap-2">
            <List className="w-4 h-4" style={{ color: colors.onSurfaceVariant }} />
            <p className="text-sm font-medium" style={{ color: colors.onSurfaceVariant }}>
              {t(list.titleKey)}
            </p>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: colors.secondaryContainer,
                color: colors.onSecondaryContainer,
              }}
            >
              {items[list.key].length}
            </span>
          </div>

          {/* Add input */}
          <div className="px-6 pb-4 flex gap-2">
            <input
              type="text"
              value={inputs[list.key]}
              onChange={(e) => setInputs(prev => ({ ...prev, [list.key]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(list.key) }}
              placeholder={t('autoproxy.enter_pkg')}
              className="flex-1 px-4 py-3 rounded-xl text-sm border outline-none"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline,
                color: colors.onSurface,
              }}
            />
            <button
              onClick={() => handleAdd(list.key)}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.primaryContainer }}
            >
              <Plus className="w-5 h-5" style={{ color: colors.onPrimaryContainer }} />
            </button>
          </div>

          {/* Items */}
          <div className="px-6 pb-5 flex flex-col gap-1.5">
            {items[list.key].length === 0 ? (
              <p className="text-xs py-2 text-center" style={{ color: colors.onSurfaceVariant }}>
                {t('autoproxy.empty')}
              </p>
            ) : (
              items[list.key].map((pkg) => (
                <div
                  key={pkg}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.surfaceContainer }}
                >
                  <span className="flex-1 text-sm truncate" style={{ color: colors.onSurface }}>
                    {pkg}
                  </span>
                  <button
                    onClick={() => handleRemove(list.key, pkg)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.errorContainer }}
                  >
                    <X className="w-3.5 h-3.5" style={{ color: colors.onErrorContainer }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
