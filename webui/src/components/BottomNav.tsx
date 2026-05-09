import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { Home, Settings, Wrench } from 'lucide-react'

interface BottomNavProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { colors } = useTheme()
  const { t } = useI18n()

  const items = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'tool', icon: Wrench, label: t('nav.tool') },
    { id: 'settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: colors.surfaceContainer,
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors"
            >
              <div
                className="w-16 h-8 rounded-2xl flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isActive ? colors.secondaryContainer : 'transparent',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                  }}
                />
              </div>
              <span
                className="text-xs transition-colors"
                style={{
                  color: isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
