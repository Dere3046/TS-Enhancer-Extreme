import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'

interface StatusCardProps {
  proxyMode?: 'auto' | 'manual'
}

export function StatusCard({ proxyMode = 'manual' }: StatusCardProps) {
  const { colors } = useTheme()
  const { t } = useI18n()

  const isAuto = proxyMode === 'auto'

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: isAuto ? colors.primaryContainer : colors.tertiaryContainer,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
      }}
    >
      <div className="flex flex-col p-6 gap-1">
        <p
          className="text-sm font-medium"
          style={{ color: isAuto ? colors.onPrimaryContainer : colors.onTertiaryContainer, opacity: 0.8 }}
        >
          {t('dashboard.app_list_proxy')}
        </p>
        <p
          className="text-2xl font-normal"
          style={{ color: isAuto ? colors.onPrimaryContainer : colors.onTertiaryContainer }}
        >
          {isAuto ? t('dashboard.proxy_mode_auto') : t('dashboard.proxy_mode_manual')}
        </p>
      </div>
    </div>
  )
}
