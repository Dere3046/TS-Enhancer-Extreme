import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useLogger } from '../contexts/LoggerContext'
import { TSeed } from '../services/tseed'
import { Trash2, FileText, Monitor } from 'lucide-react'

export function LogsPage() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { logs, clearLogs } = useLogger()
  const [source, setSource] = useState<'console' | 'module'>('console')
  const [moduleLogs, setModuleLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return colors.error
      case 'warn': return '#ed6c02'
      case 'info': return colors.primary
      default: return colors.onSurfaceVariant
    }
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
  }

  const loadModuleLogs = async () => {
    setLoading(true)
    try {
      const result = await TSeed.log.read()
      setModuleLogs(result.trim())
    } catch {
      setModuleLogs('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (source === 'module') {
      loadModuleLogs()
      const interval = setInterval(loadModuleLogs, 3000)
      return () => clearInterval(interval)
    }
  }, [source])

  const logLines = source === 'module' && moduleLogs
    ? moduleLogs.split('\n').filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-3">
      {/* Source toggle + clear */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: colors.surfaceContainerHighest }}>
          <button
            onClick={() => setSource('module')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor: source === 'module' ? colors.surface : 'transparent',
              color: source === 'module' ? colors.onSurface : colors.onSurfaceVariant,
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            {t('logs.module_log')}
          </button>
          <button
            onClick={() => setSource('console')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor: source === 'console' ? colors.surface : 'transparent',
              color: source === 'console' ? colors.onSurface : colors.onSurfaceVariant,
            }}
          >
            <Monitor className="w-3.5 h-3.5" />
            {t('logs.console_log')}
          </button>
        </div>

        <button
          onClick={() => {
            clearLogs()
            setModuleLogs('')
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{
            backgroundColor: colors.errorContainer,
            color: colors.onErrorContainer,
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('common.delete')}
        </button>
      </div>

      {/* Log container */}
      <div
        className="rounded-3xl p-4 overflow-auto font-mono text-xs"
        style={{
          backgroundColor: colors.surfaceContainerLow,
          boxShadow: `0 1px 2px ${colors.shadow}20`,
          maxHeight: 'calc(100vh - 220px)',
          color: colors.onSurface,
        }}
      >
        {source === 'console' ? (
          logs.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.onSurfaceVariant }}>
              {t('logs.empty')}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="shrink-0 opacity-50">{formatTime(log.timestamp)}</span>
                  <span
                    className="shrink-0 font-bold uppercase w-12"
                    style={{ color: levelColor(log.level) }}
                  >
                    {log.level}
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          loading && logLines.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.onSurfaceVariant }}>
              {t('common.loading')}
            </div>
          ) : logLines.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.onSurfaceVariant }}>
              {t('logs.empty')}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 whitespace-pre-wrap">
              {logLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
