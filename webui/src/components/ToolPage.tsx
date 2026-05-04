import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'
import { TSeed, showToast } from '../services/tseed'
import {
  Server,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Shield,
  ShieldAlert,
  Activity,
  Hash,
  CheckCircle,
  XCircle,
  Info,
  FileText,
} from 'lucide-react'

export function ToolPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { state, setState } = useApp()

  // VerifiedBootHash
  const [vbhash, setVbhash] = useState('')
  const [vbhashLoading, setVbhashLoading] = useState(false)

  // Service control loading
  const [serviceLoading, setServiceLoading] = useState(false)

  // Load persisted VBHash on mount
  useEffect(() => {
    (async () => {
      try {
        const state = await TSeed.system.vbhashState()
        const m = state.trim().match(/^persisted:([0-9a-fA-F]{64}):/)
        if (m) setVbhash(m[1])
      } catch { /* no persisted hash */ }
    })()
  }, [])

  const handleVbhashGet = async () => {
    setVbhashLoading(true)
    try {
      const result = await TSeed.system.vbhashGet()
      const hash = result.trim()
      if (hash.length === 64) {
        setVbhash(hash)
      } else {
        showToast(t('settings.vbhash_fetch_failed'))
      }
    } catch {
      showToast(t('settings.vbhash_fetch_failed'))
    } finally {
      setVbhashLoading(false)
    }
  }

  const handleVbhashApplyOnce = async () => {
    if (!vbhash || vbhash.length !== 64) {
      showToast(t('settings.vbhash_invalid'))
      return
    }
    try {
      await TSeed.system.vbhashApply(vbhash)
      showToast(t('settings.vbhash_applied'))
    } catch {
      showToast(t('common.failed'))
    }
  }

  const handleVbhashPersist = async () => {
    if (!vbhash || vbhash.length !== 64) {
      showToast(t('settings.vbhash_invalid'))
      return
    }
    try {
      await TSeed.system.vbhashPersist(vbhash)
      showToast(t('settings.vbhash_persisted'))
    } catch {
      showToast(t('common.failed'))
    }
  }

  const handleVbhashClear = async () => {
    try {
      await TSeed.system.vbhashClear()
      setVbhash('')
      showToast(t('settings.vbhash_cleared'))
    } catch {
      showToast(t('common.failed'))
    }
  }

  const handleServiceControl = async (action: string) => {
    setServiceLoading(true)
    try {
      if (action === 'start') {
        await TSeed.service.proxy('start')
      } else if (action === 'stop') {
        await TSeed.service.proxy('stop')
      } else if (action === 'sync') {
        await TSeed.service.proxy('sync')
      }
      setState({ proxyRunning: action === 'start' })
      showToast(t('common.success'))
    } catch {
      showToast(t('common.failed'))
    } finally {
      setServiceLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await TSeed.system.clearCache()
      showToast(t('toast.cache_cleared'))
    } catch {
      showToast(t('common.failed'))
    }
  }

  const handleRefreshState = async () => {
    try {
      await TSeed.system.stateRefresh()
      showToast(t('common.success'))
    } catch {
      showToast(t('common.failed'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Service Control Section */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('tool.service_control')}
          </p>
        </div>

        <div className="px-6 pb-4 flex gap-2">
          <button
            onClick={() => handleServiceControl('start')}
            disabled={serviceLoading || state.proxyRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
          >
            <Play className="w-4 h-4" />
            {t('tool.start_proxy')}
          </button>
          <button
            onClick={() => handleServiceControl('stop')}
            disabled={serviceLoading || !state.proxyRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: colors.errorContainer, color: colors.onErrorContainer }}
          >
            <Square className="w-4 h-4" />
            {t('tool.stop_proxy')}
          </button>
        </div>

        <div className="px-6 pb-4 flex gap-2">
          <button
            onClick={() => handleServiceControl('sync')}
            disabled={serviceLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
          >
            <RefreshCw className="w-4 h-4" />
            {t('tool.sync_targets')}
          </button>
          <button
            onClick={handleRefreshState}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }}
          >
            <Activity className="w-4 h-4" />
            {t('tool.refresh_state')}
          </button>
        </div>
      </div>

      {/* Service Status */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('tool.service_status')}
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              <span className="text-sm" style={{ color: colors.onSurface }}>{t('tool.tseet_service')}</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: state.serviceRunning ? colors.primaryContainer : colors.errorContainer,
                color: state.serviceRunning ? colors.onPrimaryContainer : colors.onErrorContainer,
              }}
            >
              {state.serviceRunning ? t('status.running') : t('status.stopped')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              <span className="text-sm" style={{ color: colors.onSurface }}>{t('tool.tricky_status')}</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: state.trickyRunning ? colors.primaryContainer : colors.errorContainer,
                color: state.trickyRunning ? colors.onPrimaryContainer : colors.onErrorContainer,
              }}
            >
              {state.trickyRunning ? t('status.running') : t('status.stopped')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              <span className="text-sm" style={{ color: colors.onSurface }}>{t('tool.proxy_status')}</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: state.proxyRunning ? colors.primaryContainer : colors.errorContainer,
                color: state.proxyRunning ? colors.onPrimaryContainer : colors.onErrorContainer,
              }}
            >
              {state.proxyRunning ? t('status.running') : t('status.stopped')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
              <span className="text-sm" style={{ color: colors.onSurface }}>{t('tool.integrity')}</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: state.integrityVerified === true ? colors.primaryContainer
                  : state.integrityVerified === false ? colors.errorContainer : colors.surfaceContainer,
                color: state.integrityVerified === true ? colors.onPrimaryContainer
                  : state.integrityVerified === false ? colors.onErrorContainer : colors.onSurfaceVariant,
              }}
            >
              {state.integrityVerified === true ? t('tool.verified')
                : state.integrityVerified === false ? t('tool.verification_failed') : t('status.unknown')}
            </span>
          </div>
        </div>
      </div>

      {/* VerifiedBootHash */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('settings.verified_boot_hash')}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>
            {t('settings.verified_boot_hash_desc')}
          </p>
        </div>

        <div className="px-6 pb-3">
          <div
            className="rounded-lg px-3 py-2 text-xs font-mono break-all"
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}
          >
            {vbhash || t('settings.vbhash_empty')}
          </div>
        </div>

        <div className="px-6 pb-2 flex gap-2">
          <button
            onClick={handleVbhashGet}
            disabled={vbhashLoading}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
          >
            <RefreshCw className={`w-4 h-4 ${vbhashLoading ? 'animate-spin' : ''}`} />
            {t('settings.vbhash_get')}
          </button>
          <button
            onClick={handleVbhashClear}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: colors.errorContainer, color: colors.onErrorContainer }}
          >
            <XCircle className="w-4 h-4" />
            {t('settings.vbhash_clear')}
          </button>
        </div>

        <div className="px-6 pb-3 flex gap-2">
          <button
            onClick={handleVbhashApplyOnce}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }}
          >
            <CheckCircle className="w-4 h-4" />
            {t('settings.vbhash_apply_once')}
          </button>
          <button
            onClick={handleVbhashPersist}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
          >
            <Hash className="w-4 h-4" />
            {t('settings.vbhash_persist')}
          </button>
        </div>

        <div className="px-6 pb-4">
          <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
            {t('settings.vbhash_persist_hint')}
          </p>
        </div>
      </div>

      {/* Cache & Info */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: colors.surfaceContainerLow, boxShadow: `0 1px 2px ${colors.shadow}20` }}
      >
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: colors.onSurfaceVariant }}>
            {t('tool.maintenance')}
          </p>
        </div>

        <button
          onClick={() => onNavigate?.('logs')}
          className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
          style={{ backgroundColor: colors.surfaceContainerLow }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.tertiaryContainer }}
          >
            <FileText className="w-5 h-5" style={{ color: colors.onTertiaryContainer }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }}>
              {t('home.view_logs')}
            </p>
          </div>
        </button>

        <div className="mx-6 h-px" style={{ backgroundColor: colors.outlineVariant }} />

        <button
          onClick={handleClearCache}
          className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
          style={{ backgroundColor: colors.surfaceContainerLow }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.errorContainer }}
          >
            <Trash2 className="w-5 h-5" style={{ color: colors.onErrorContainer }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }}>
              {t('home.clear_cache')}
            </p>
          </div>
        </button>

        <div className="mx-6 h-px" style={{ backgroundColor: colors.outlineVariant }} />

        <button
          onClick={() => onNavigate?.('test')}
          className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:opacity-80"
          style={{ backgroundColor: colors.surfaceContainerLow }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.tertiaryContainer }}
          >
            <Info className="w-5 h-5" style={{ color: colors.onTertiaryContainer }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }}>
              Auto Test / Diagnostics
            </p>
          </div>
        </button>

        <div className="mx-6 h-px" style={{ backgroundColor: colors.outlineVariant }} />

        <div className="px-6 py-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.tertiaryContainer }}
          >
            <Info className="w-5 h-5" style={{ color: colors.onTertiaryContainer }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-medium" style={{ color: colors.onSurface }}>
              {t('common.version')}
            </p>
          </div>
          <span className="text-sm" style={{ color: colors.onSurfaceVariant }}>
            {state.moduleVersion || t('status.unknown')}
          </span>
        </div>
      </div>
    </div>
  )
}
