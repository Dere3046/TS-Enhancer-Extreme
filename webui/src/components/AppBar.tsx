import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { Globe, Sun, Moon, MoreVertical, ArrowLeft, Settings, Wrench, Info, RefreshCw } from 'lucide-react'

type PageType = 'home' | 'settings' | 'logs' | 'keybox' | 'tool' | 'about'

export interface AppBarProps {
  currentPage: PageType
  onBack?: () => void
  onNavigate?: (page: PageType) => void
  navigationMode?: 'bottom' | 'floating'
  onKeyboxRefresh?: () => void
}

export function AppBar({
  currentPage,
  onBack,
  onNavigate,
  navigationMode = 'bottom',
  onKeyboxRefresh,
}: AppBarProps) {
  const { colors, isDark, toggleDark } = useTheme()
  const { lang, setLang, t, availableLangs } = useI18n()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isKeybox = currentPage === 'keybox'
  const isHome = currentPage === 'home'
  const showMore = isKeybox
  const showBack = navigationMode === 'bottom'
    ? (!isHome && currentPage !== 'settings' && currentPage !== 'tool')
    : !isHome

  const titles: Record<string, string> = {
    home: 'TS-Enhancer-Extreme',
    keybox: t('keybox.title'),
    settings: t('nav.settings'),
    logs: t('logs.title'),
    tool: t('nav.tool'),
    about: t('about.title'),
  }
  const title = titles[currentPage] || 'TS-Enhancer-Extreme'

  useEffect(() => {
    setShowMoreMenu(false)
  }, [currentPage])

  return (
    <>
      <header
        style={{ backgroundColor: colors.background }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 -ml-1"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.onSurface }} />
            </button>
          )}
          <div className="flex-1 min-w-0 relative h-10 flex items-center">
            <h1
              className="text-xl font-bold flex items-center"
              style={{ color: colors.onSurface }}
            >
              <span className="truncate">{title}</span>
            </h1>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {showMore && (
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                </button>

                {showMoreMenu && (
                  <div
                    className="absolute right-0 top-12 w-52 py-2 rounded-xl shadow-lg z-50"
                    style={{ backgroundColor: colors.surfaceContainerHigh }}
                  >
                    {isKeybox && (
                      <button
                        onClick={() => { onKeyboxRefresh?.(); setShowMoreMenu(false) }}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2"
                        style={{ color: colors.onSurface }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t('common.refresh')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {isHome && (
              <>
                <button
                  onClick={toggleDark}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  ) : (
                    <Moon className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    title="Language"
                  >
                    <Globe className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  </button>

                  {showLangMenu && (
                    <div
                      className="absolute right-0 top-12 w-40 py-2 rounded-xl shadow-lg"
                      style={{ backgroundColor: colors.surfaceContainerHigh }}
                    >
                      {availableLangs.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => { setLang(language.code); setShowLangMenu(false) }}
                          className="w-full px-4 py-2 text-left text-sm"
                          style={{
                            color: colors.onSurface,
                            fontWeight: lang === language.code ? '600' : '400',
                          }}
                        >
                          {language.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {navigationMode === 'floating' && (
                  <>
                    <button
                      onClick={() => onNavigate?.('tool')}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      title={t('nav.tool')}
                    >
                      <Wrench className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                    </button>
                    <button
                      onClick={() => onNavigate?.('settings')}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      title={t('nav.settings')}
                    >
                      <Settings className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                    </button>
                  </>
                )}
              </>
            )}

            {currentPage === 'settings' && onNavigate && (
              <button
                onClick={() => onNavigate('about')}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                title={t('about.title')}
              >
                <Info className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

