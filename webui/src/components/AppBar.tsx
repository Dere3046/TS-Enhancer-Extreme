import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { Globe, Sun, Moon, Search, MoreVertical, ArrowLeft, X, Check, RefreshCw, Settings, Wrench, Info } from 'lucide-react'

type PageType = 'home' | 'settings' | 'logs' | 'target' | 'keybox' | 'autoproxy' | 'securitypatch' | 'tool' | 'about' | 'test'

export interface AppBarProps {
  currentPage: PageType
  onBack?: () => void
  onNavigate?: (page: PageType) => void
  navigationMode?: 'bottom' | 'floating'
  searchText?: string
  onSearchChange?: (v: string) => void
  showSystemApps?: boolean
  onShowSystemAppsChange?: (v: boolean) => void
  onSelectAll?: (includeSystem: boolean, mode: 'auto' | 'modify' | 'generate') => void
}

export function AppBar({
  currentPage,
  onBack,
  onNavigate,
  navigationMode = 'bottom',
  searchText = '',
  onSearchChange,
  showSystemApps = true,
  onShowSystemAppsChange,
  onSelectAll,
}: AppBarProps) {
  const { colors, isDark, toggleDark } = useTheme()
  const { lang, setLang, t } = useI18n()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSelectAll, setShowSelectAll] = useState(false)
  const [selectAllIncludeSystem, setSelectAllIncludeSystem] = useState(false)
  const [selectAllMode, setSelectAllMode] = useState<'auto' | 'modify' | 'generate'>('auto')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isTarget = currentPage === 'target'
  const isKeybox = currentPage === 'keybox'
  const isHome = currentPage === 'home'
  const showSearch = isTarget
  const showMore = isTarget || isKeybox
  const showBack = navigationMode === 'bottom'
    ? (!isHome && currentPage !== 'settings' && currentPage !== 'tool')
    : !isHome

  const titles: Record<string, string> = {
    home: t('app.name'),
    target: t('nav.apps'),
    keybox: t('nav.keybox'),
    settings: t('nav.settings'),
    logs: t('logs.title'),
    tool: t('nav.tool'),
    about: t('about.module'),
  }
  const title = titles[currentPage] || t('app.name')

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearching])

  useEffect(() => {
    setIsSearching(false)
  }, [currentPage])

  const languages = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
  ]

  const handleSelectAllConfirm = () => {
    onSelectAll?.(selectAllIncludeSystem, selectAllMode)
    setShowSelectAll(false)
    setShowMoreMenu(false)
  }

  return (
    <>
      <header
        style={{
          backgroundColor: colors.background,
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Back button */}
          {showBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 -ml-1"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.onSurface }} />
            </button>
          )}

          {/* Title / Search */}
          <div className="flex-1 min-w-0 relative h-10 flex items-center">
            {/* Title */}
            <h1
              className={`text-xl font-bold absolute inset-0 flex items-center transition-opacity duration-200 ${isSearching ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              style={{ color: colors.onSurface }}
            >
              <span className="truncate">{title}</span>
            </h1>

            {/* Search Input */}
            {showSearch && (
              <div
                className={`absolute inset-0 flex items-center transition-opacity duration-200 ${isSearching ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={t('apps.search')}
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none border"
                  style={{
                    backgroundColor: colors.surfaceContainerHighest,
                    borderColor: colors.outlineVariant,
                    color: colors.onSurface,
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Search Toggle */}
            {showSearch && !isSearching && (
              <button
                onClick={() => { setIsSearching(true); setShowMoreMenu(false) }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <Search className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              </button>
            )}

            {/* Search Close */}
            {showSearch && isSearching && (
              <button
                onClick={() => { setIsSearching(false); onSearchChange?.('') }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              </button>
            )}

            {/* More Menu */}
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
                    style={{
                      backgroundColor: colors.surfaceContainerHigh,
                    }}
                  >
                    {isTarget && (
                      <>
                        <button
                          onClick={() => { setShowSelectAll(true); setShowMoreMenu(false) }}
                          className="w-full px-4 py-2.5 text-left text-sm"
                          style={{ color: colors.onSurface }}
                        >
                          {t('apps.select_all')}
                        </button>
                        <button
                          onClick={() => { onShowSystemAppsChange?.(!showSystemApps); setShowMoreMenu(false) }}
                          className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between"
                          style={{ color: colors.onSurface }}
                        >
                          <span>{t('apps.include_system_apps')}</span>
                          <span
                            className="w-4 h-4 rounded border flex items-center justify-center"
                            style={{
                              borderColor: colors.primary,
                              backgroundColor: showSystemApps ? colors.primary : 'transparent',
                            }}
                          >
                            {showSystemApps && <Check className="w-3 h-3" style={{ color: colors.onPrimary }} />}
                          </span>
                        </button>
                      </>
                    )}
                    {isKeybox && (
                      <button
                        onClick={() => { setShowMoreMenu(false); /* refresh handled by AppContext polling */ }}
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

            {/* Home-only actions */}
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
                      style={{
                        backgroundColor: colors.surfaceContainerHigh,
                      }}
                    >
                      {languages.map((language) => (
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
                  <button
                    onClick={() => onNavigate?.('tool')}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    title={t('nav.tool')}
                  >
                    <Wrench className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  </button>
                )}

                {navigationMode === 'floating' && (
                  <button
                    onClick={() => onNavigate?.('settings')}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    title={t('nav.settings')}
                  >
                    <Settings className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
                  </button>
                )}
              </>
            )}

            {currentPage === 'settings' && onNavigate && (
              <button
                onClick={() => onNavigate('about')}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                title={t('about.module')}
              >
                <Info className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Select All Dialog */}
      {showSelectAll && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowSelectAll(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{
              backgroundColor: colors.surfaceContainerHigh,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold" style={{ color: colors.onSurface }}>
              {t('apps.select_all')}
            </h3>

            {/* Include system apps */}
            <button
              onClick={() => setSelectAllIncludeSystem(!selectAllIncludeSystem)}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm" style={{ color: colors.onSurface }}>
                {t('apps.include_system_apps')}
              </span>
              <span
                className="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                style={{
                  borderColor: selectAllIncludeSystem ? colors.primary : colors.outline,
                  backgroundColor: selectAllIncludeSystem ? colors.primary : 'transparent',
                }}
              >
                {selectAllIncludeSystem && <Check className="w-3.5 h-3.5" style={{ color: colors.onPrimary }} />}
              </span>
            </button>

            {/* Cert mode */}
            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: colors.onSurface }}>{t('apps.cert_mode')}</span>
              <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: colors.surfaceContainerHighest }}>
                {(['auto', 'modify', 'generate'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectAllMode(m)}
                    className="flex-1 py-2 text-xs font-medium rounded-md transition-colors capitalize"
                    style={{
                      backgroundColor: selectAllMode === m ? colors.surface : 'transparent',
                      color: selectAllMode === m ? colors.onSurface : colors.onSurfaceVariant,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowSelectAll(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ color: colors.onSurfaceVariant }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSelectAllConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
