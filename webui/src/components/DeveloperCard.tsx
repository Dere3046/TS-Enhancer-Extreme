import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useApp } from '../contexts/AppContext'
import { TSeed } from '../services/tseed'
import { Bug, Play, Square, RefreshCw, Terminal } from 'lucide-react'

export function DeveloperCard() {
  const { colors } = useTheme()
  const { state, refreshStatus } = useApp()
  const [loading, setLoading] = useState(false)
  const [rawState, setRawState] = useState('')

  if (!state.developerMode) return null

  const devAction = async (label: string, fn: () => Promise<any>) => {
    setLoading(true)
    try {
      const result = await fn()
      setRawState(`${label}: ${typeof result === 'string' ? result.slice(0, 200) : 'OK'}`)
      await refreshStatus()
    } catch (e: any) {
      setRawState(`${label} FAIL: ${String(e?.message || e).slice(0, 120)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Bug className="w-5 h-5" style={{ color: colors.error }} />
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            Developer
          </p>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => devAction('Start TS', () => TSeed.tsctl('start'))}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
          >
            <Play className="w-3.5 h-3.5" />
            Start TS
          </button>
          <button
            onClick={() => devAction('Stop TS', () => TSeed.tsctl('stop'))}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.errorContainer, color: colors.onErrorContainer }}
          >
            <Square className="w-3.5 h-3.5" />
            Stop TS
          </button>
          <button
            onClick={() => devAction('Start TSEE', () => TSeed.tseectl('start'))}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
          >
            <Play className="w-3.5 h-3.5" />
            Start TSEE
          </button>
          <button
            onClick={() => devAction('Stop TSEE', () => TSeed.tseectl('stop'))}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.errorContainer, color: colors.onErrorContainer }}
          >
            <Square className="w-3.5 h-3.5" />
            Stop TSEE
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => devAction('Sync', () => TSeed.packagelistupdate())}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Targets
          </button>
          <button
            onClick={() => devAction('Refresh', () => TSeed.staterefresh())}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            State
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => devAction('Service', () => TSeed.tseectl('state'))} disabled={loading}
            className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-50 text-left"
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}>
            TSEE State
          </button>
          <button onClick={() => devAction('TS State', () => TSeed.tsctl('state'))} disabled={loading}
            className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-50 text-left"
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}>
            TS State
          </button>
          <button onClick={() => devAction('Root', () => TSeed.rootDetect())} disabled={loading}
            className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-50 text-left"
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}>
            Root Detect
          </button>
          <button onClick={() => devAction('Log', () => TSeed.log.read())} disabled={loading}
            className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-50 text-left"
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}>
            Log Read
          </button>
        </div>

        {rawState && (
          <div className="rounded-2xl px-3 py-2 font-mono text-xs" style={{ backgroundColor: colors.surfaceContainer }}>
            <Terminal className="w-3.5 h-3.5 inline mr-1" style={{ color: colors.primary }} />
            <span style={{ color: colors.onSurfaceVariant }}>{rawState}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3 text-[11px]" style={{ color: colors.onSurfaceVariant }}>
          <span>TSEET: {state.serviceRunning ? 'running' : 'stopped'}</span>
          <span>Tricky: {state.trickyRunning ? 'running' : 'stopped'}</span>
        </div>
      </div>
    </div>
  )
}

