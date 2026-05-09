import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'

interface DashboardCardProps {
  serviceRunning?: boolean
  trickyRunning?: boolean
}

export function DashboardCard({
  serviceRunning = false,
  trickyRunning = false,
}: DashboardCardProps) {
  const { colors } = useTheme()
  const { t } = useI18n()

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: colors.surfaceContainerLow,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
      }}
    >
      <div className="p-6">
        <p
          className="text-sm font-medium mb-3"
          style={{ color: colors.onSurfaceVariant }}
        >
          {t('home.dashboard')}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
              {t('dashboard.service_status')}
            </p>
            <p
              className="text-sm font-medium"
              style={{
                color: serviceRunning ? colors.primary : colors.error,
              }}
            >
              {serviceRunning ? t('status.running') : t('status.stopped')}
            </p>
          </div>

          <div
            className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
              {t('dashboard.tricky_status')}
            </p>
            <p
              className="text-sm font-medium"
              style={{
                color: trickyRunning ? colors.primary : colors.error,
              }}
            >
              {trickyRunning ? t('status.running') : t('status.stopped')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
