import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { ChevronRight } from 'lucide-react'

interface NavCardProps {
  title: string
  subtitle: string
  onClick?: () => void
}

function NavCard({ title, subtitle, onClick }: NavCardProps) {
  const { colors } = useTheme()

  return (
    <button
      onClick={onClick}
      className="rounded-3xl p-6 text-left"
      style={{
        backgroundColor: colors.secondaryContainer,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: colors.onSecondaryContainer }}
          >
            {title}
          </h3>
          <p
            className="text-sm mt-0.5"
            style={{ color: colors.onSecondaryContainer, opacity: 0.7 }}
          >
            {subtitle}
          </p>
        </div>
        <ChevronRight
          className="w-5 h-5 mt-0.5 shrink-0"
          style={{ color: colors.onSecondaryContainer, opacity: 0.5 }}
        />
      </div>
    </button>
  )
}

interface NavCardsProps {
  onTargetClick?: () => void
  onKeyboxClick?: () => void
  appCount?: number
  keyboxCount?: number
  proxyMode?: 'auto' | 'manual'
}

export function NavCards({ onTargetClick, onKeyboxClick, appCount = 0, keyboxCount = 0, proxyMode = 'manual' }: NavCardsProps) {
  const { t } = useI18n()

  const appSubtitle = proxyMode === 'auto'
    ? t('card.home.app_proxy_auto')
    : `${appCount} ${t('card.home.app_count')}`

  return (
    <div className="grid grid-cols-2 gap-4">
      <NavCard
        title={t('card.home.app_management')}
        subtitle={appSubtitle}
        onClick={onTargetClick}
      />
      <NavCard
        title={t('card.home.keybox_management')}
        subtitle={`${keyboxCount} ${t('card.home.keybox_status')}`}
        onClick={onKeyboxClick}
      />
    </div>
  )
}
