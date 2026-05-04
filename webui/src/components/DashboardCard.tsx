import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { AlertTriangle } from 'lucide-react'

interface DashboardCardProps {
  serviceRunning?: boolean
  trickyRunning?: boolean
  proxyMode?: 'auto' | 'manual'
  integrityVerified?: boolean | null
}

export function DashboardCard({
  serviceRunning = false,
  trickyRunning = false,
  proxyMode = 'manual',
  integrityVerified = null,
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

        {/* Integrity warning */}
        {integrityVerified === false && (
          <div
            className="rounded-2xl p-3 flex items-center gap-3 mb-3"
            style={{ backgroundColor: colors.errorContainer, border: `1px solid ${colors.error}30` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.error}20` }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: colors.error }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: colors.onErrorContainer }}>
                {t('dashboard.integrity_failed')}
              </p>
              <p className="text-xs" style={{ color: colors.onErrorContainer, opacity: 0.8 }}>
                {t('dashboard.integrity_desc')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* TSEET Service */}
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
                color: integrityVerified === null ? colors.onSurfaceVariant : (serviceRunning ? colors.primary : colors.error),
              }}
            >
              {integrityVerified === null ? t('status.checking') : (serviceRunning ? t('status.running') : t('status.stopped'))}
            </p>
          </div>

          {/* Tricky Store */}
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
                color: integrityVerified === null ? colors.onSurfaceVariant : (trickyRunning ? colors.primary : colors.error),
              }}
            >
              {integrityVerified === null ? t('status.checking') : (trickyRunning ? t('status.running') : t('status.stopped'))}
            </p>
          </div>

          {/* Proxy Mode */}
          <div
            className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
              {t('dashboard.app_list_proxy')}
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: proxyMode === 'auto' ? colors.primary : colors.onSurfaceVariant }}
            >
              {proxyMode === 'auto' ? t('dashboard.proxy_mode_auto') : t('dashboard.proxy_mode_manual')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
