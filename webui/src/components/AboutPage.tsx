import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { Users, Scale, Info } from 'lucide-react'

const LICENSE_TEXT = `MIT License

Copyright (c) 2026 Dere3046, Derry

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export function AboutPage() {
  const { colors } = useTheme()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4">
      {/* Module Info */}
      <div
        className="rounded-3xl overflow-hidden p-6"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>
            {t('about.module')}
          </h2>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: colors.onSurfaceVariant }}>{t('about.name')}</span>
            <span style={{ color: colors.onSurface }}>TS Enhancer Extreme</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.onSurfaceVariant }}>{t('common.version')}</span>
            <span style={{ color: colors.onSurface }}>v1.1.0</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.onSurfaceVariant }}>{t('about.license')}</span>
            <span style={{ color: colors.onSurface }}>MIT / GPL v3</span>
          </div>
        </div>
      </div>

      {/* Contributors */}
      <div
        className="rounded-3xl overflow-hidden p-6"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>
            {t('about.contributors')}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
            >
              D
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.onSurface }}>Dere3046</p>
              <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>{t('about.developer')}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }}
            >
              D
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.onSurface }}>Derry</p>
              <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>{t('about.developer')}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: colors.surfaceContainer }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
            >
              X
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.onSurface }}>XtrLumen</p>
              <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>{t('about.developer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* License — MIT */}
      <div
        className="rounded-3xl overflow-hidden p-6"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>
            MIT — WEBUI / TSEET / TSEEV
          </h2>
        </div>
        <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: colors.onSurfaceVariant }}>
{LICENSE_TEXT}
        </pre>
      </div>

      {/* License — GPL v3 */}
      <div
        className="rounded-3xl overflow-hidden p-6"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>
            GPL v3 — TSEED / Module
          </h2>
        </div>
        <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
          See the COPYING file in the project root for the full GNU General Public License v3 text.
        </p>
      </div>
    </div>
  )
}
