import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { TSeed } from '../services/tseed'
import { Users } from 'lucide-react'

export function AboutPage() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [moduleInfo, setModuleInfo] = useState<{ name?: string; version?: string; author?: string; description?: string }>({})

  useEffect(() => {
    let cancelled = false
    const fetchInfo = async () => {
      try {
        const raw = await TSeed.device.moduleInfo()
        if (cancelled) return
        const info: typeof moduleInfo = {}
        raw.split('\n').forEach(line => {
          const [key, ...rest] = line.split('=')
          if (key && rest.length > 0) {
            const value = rest.join('=').trim()
            if (key === 'name') info.name = value
            if (key === 'version') info.version = value
            if (key === 'author') info.author = value
            if (key === 'description') info.description = value
          }
        })
        setModuleInfo(info)
      } catch { /* ignore */ }
    }
    fetchInfo()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl overflow-hidden p-6"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: colors.onSurfaceVariant }}>{t('about.module_name')}</span>
            <span style={{ color: colors.onSurface }}>{moduleInfo.name || 'TS Enhancer Extreme'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.onSurfaceVariant }}>{t('common.version')}</span>
            <span style={{ color: colors.onSurface }}>{moduleInfo.version || 'v1.0.0'}</span>
          </div>
          {moduleInfo.author && (
            <div className="flex justify-between">
              <span style={{ color: colors.onSurfaceVariant }}>Author</span>
              <span style={{ color: colors.onSurface }}>{moduleInfo.author}</span>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-3xl overflow-hidden p-6"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>
            {t('about.contributors')}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {['XtrLumen', 'Dere3046', 'Derry'].map((name, i) => (
            <div key={name} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: colors.surfaceContainer }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: i === 0 ? colors.primaryContainer : i === 1 ? colors.secondaryContainer : colors.tertiaryContainer,
                  color: i === 0 ? colors.onPrimaryContainer : i === 1 ? colors.onSecondaryContainer : colors.onTertiaryContainer,
                }}
              >
                {name[0]}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.onSurface }}>{name}</p>
                <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>{t('about.role')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

