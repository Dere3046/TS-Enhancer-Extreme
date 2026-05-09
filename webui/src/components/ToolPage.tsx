import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'
import { SecurityPatchCard } from './SecurityPatchCard'
import { FileText } from 'lucide-react'

export function ToolPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { state } = useApp()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.surfaceContainerLow }}>
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('tool.service_status')}
          </p>
        </div>
        <div className="px-6 pb-4 flex flex-col gap-2">
          {[
            { label: t('tool.tseet_service'), value: state.serviceRunning },
            { label: t('tool.tricky_status'), value: state.trickyRunning },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: colors.onSurface }}>{item.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{
                  backgroundColor: item.value ? colors.primaryContainer : colors.errorContainer,
                  color: item.value ? colors.onPrimaryContainer : colors.onErrorContainer,
                }}
              >
                {item.value ? t('status.running') : t('status.stopped')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SecurityPatchCard />

      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.surfaceContainerLow }}>
        <button
          onClick={() => onNavigate?.('logs')}
          className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.tertiaryContainer }}
          >
            <FileText className="w-5 h-5" style={{ color: colors.onTertiaryContainer }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }}>
              {t('tool.view_logs')}
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
