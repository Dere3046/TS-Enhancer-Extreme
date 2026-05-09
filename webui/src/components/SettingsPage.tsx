import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import {
  Sun,
  Moon,
  Palette,
  ChevronRight,
  Bug,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface SettingsPageProps {
  navigationMode?: 'bottom' | 'floating'
  onNavigationModeChange?: (mode: 'bottom' | 'floating') => void
}

export function SettingsPage({ navigationMode = 'bottom', onNavigationModeChange }: SettingsPageProps) {
  const { colors, isDark, toggleDark, seedColor, setSeedColor } = useTheme()
  const { lang, setLang, t, availableLangs } = useI18n()
  const { state, setState } = useApp()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorInput, setColorInput] = useState(seedColor)

  const handleColorSubmit = () => {
    setSeedColor(colorInput)
    setShowColorPicker(false)
  }

  const colorPresets = [
    { key: 'default', color: '#006c4c', label: t('theme.default') },
    { key: 'purple', color: '#6750a4', label: 'Purple' },
    { key: 'blue', color: '#0077c8', label: 'Blue' },
    { key: 'green', color: '#2e7d32', label: 'Green' },
    { key: 'orange', color: '#ed6c02', label: 'Orange' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="px-6 pt-5 pb-3">
          <p
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: colors.onSurfaceVariant }}
          >
            {t('settings.personalization')}
          </p>
        </div>

        <button
          onClick={toggleDark}
          className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
          style={{ backgroundColor: colors.surfaceContainerLow }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.primaryContainer }}
          >
            {isDark ? (
              <Sun className="w-5 h-5" style={{ color: colors.onPrimaryContainer }} />
            ) : (
              <Moon className="w-5 h-5" style={{ color: colors.onPrimaryContainer }} />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }} >
              {t('settings.theme_color')}
            </p>
            <p className="text-sm" style={{ color: colors.onSurfaceVariant }} >
              {isDark ? 'Dark' : 'Light'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
        </button>

        <div
          className="mx-6 h-px"
          style={{ backgroundColor: colors.outlineVariant }}
        />

        <div className="px-6 py-4">
          <p className="text-sm font-medium mb-3" style={{ color: colors.onSurface }}>
            {t('settings.language')}
          </p>
          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: colors.surfaceContainerHighest }}>
            {availableLangs.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="flex-1 py-2 text-xs font-medium rounded-md transition-colors"
                style={{
                  backgroundColor: lang === l.code ? colors.surface : 'transparent',
                  color: lang === l.code ? colors.onSurface : colors.onSurfaceVariant,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="mx-6 h-px"
          style={{ backgroundColor: colors.outlineVariant }}
        />

        <div className="px-6 py-4">
          <p className="text-sm font-medium mb-3" style={{ color: colors.onSurface }} >
            {t('settings.theme_color')}
          </p>
          <div className="flex gap-3 flex-wrap">
            {colorPresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => {
                  if (preset.key === 'default') {
                    setSeedColor('#006c4c')
                  } else {
                    setSeedColor(preset.color)
                  }
                }}
                className="w-10 h-10 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: preset.color,
                  border: seedColor === preset.color ? `3px solid ${colors.onSurface}` : '3px solid transparent',
                  boxShadow: seedColor === preset.color ? `0 0 0 2px ${colors.surface}` : 'none',
                }}
                title={preset.label}
              />
            ))}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              style={{
                backgroundColor: colors.surfaceContainerHighest,
                border: `2px solid ${colors.outline}`,
              }}
              title="Custom"
            >
              <Palette className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
            </button>
          </div>

          {showColorPicker && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
                placeholder="#006c4c"
              />
              <input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
              <button
                onClick={handleColorSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.onPrimary,
                }}
              >
                {t('common.save')}
              </button>
            </div>
          )}

          <div
            className="mx-0 my-4 h-px"
            style={{ backgroundColor: colors.outlineVariant }}
          />

          <div className="px-0 pb-2">
            <p className="text-sm font-medium mb-3" style={{ color: colors.onSurface }}>
              {t('settings.navigation_mode')}
            </p>
            <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: colors.surfaceContainerHighest }}>
              {([
                { value: 'bottom' as const, label: t('settings.nav_bottom') },
                { value: 'floating' as const, label: t('settings.nav_floating') },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onNavigationModeChange?.(opt.value)}
                  className="flex-1 py-2 text-xs font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: navigationMode === opt.value ? colors.surface : 'transparent',
                    color: navigationMode === opt.value ? colors.onSurface : colors.onSurfaceVariant,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-0 my-4 h-px" style={{ backgroundColor: colors.outlineVariant }} />
          <button
            onClick={() => setState({ developerMode: !state.developerMode })}
            className="w-full px-0 py-2 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: state.developerMode ? colors.errorContainer : colors.surfaceContainerHighest }}
            >
              <Bug className="w-5 h-5" style={{ color: state.developerMode ? colors.onErrorContainer : colors.onSurfaceVariant }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: colors.onSurface }}>Developer Mode</p>
            </div>
            <div
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: state.developerMode ? colors.error : colors.surfaceContainerHighest }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform"
                style={{
                  backgroundColor: colors.surface,
                  transform: state.developerMode ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

