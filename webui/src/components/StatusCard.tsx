import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'

export function StatusCard() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { state } = useApp()

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: state.serviceRunning ? colors.primaryContainer : colors.errorContainer,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
      }}
    >
      <div className="flex flex-col p-6 gap-1">
        <p
          className="text-sm font-medium"
          style={{ color: state.serviceRunning ? colors.onPrimaryContainer : colors.onErrorContainer, opacity: 0.8 }}
        >
          TS-Enhancer-Extreme
        </p>
        <p
          className="text-2xl font-normal"
          style={{ color: state.serviceRunning ? colors.onPrimaryContainer : colors.onErrorContainer }}
        >
          {state.serviceRunning ? t('status.running') : t('status.stopped')}
        </p>
      </div>
    </div>
  )
}
