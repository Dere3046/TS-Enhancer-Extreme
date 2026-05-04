import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { TSeed } from '../services/tseed'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'running' | 'pending'
  detail: string
  ms: number
}

export function TestPage() {
  const { colors } = useTheme()
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const run = async (name: string, fn: () => Promise<any>) => {
    const start = Date.now()
    try {
      const output = await fn()
      const s = typeof output === 'string' ? output : JSON.stringify(output).slice(0, 80)
      return { name, status: 'pass' as const, detail: s, ms: Date.now() - start }
    } catch (e: any) {
      return { name, status: 'fail' as const, detail: String(e?.message || e).slice(0, 120), ms: Date.now() - start }
    }
  }

  const runAll = async () => {
    setRunning(true)
    const add = (r: TestResult) => setResults(prev => {
      const idx = prev.findIndex(t => t.name === r.name)
      if (idx >= 0) { const n = [...prev]; n[idx] = r; return n }
      return [...prev, r]
    })
    const init = (name: string) => add({ name, status: 'running', detail: '', ms: 0 })

    // ── Basic ───────────────────────────────────────
    init('Ping (integrity)'); add(await run('Ping (integrity)', () => TSeed.system.ping()))
    init('Service state'); add(await run('Service state', () => TSeed.service.test()))
    init('Auto-proxy state'); add(await run('Auto-proxy state', () => TSeed.system.autoproxyState()))
    init('Kernel version'); add(await run('Kernel version', () => TSeed.device.kernelVersion()))
    init('Module info'); add(await run('Module info', () => TSeed.device.moduleInfo()))

    // ── VBHash ───────────────────────────────────────
    init('VBHash state'); add(await run('VBHash state', () => TSeed.system.vbhashState()))
    const h = results.find(r => r.name === 'VBHash state')
    if (h?.detail?.startsWith('persisted:')) {
      const hash = h.detail.split(':')[1]
      init('VBHash apply'); add(await run('VBHash apply', () => TSeed.system.vbhashApply(hash)))
      init('VBHash persist'); add(await run('VBHash persist', () => TSeed.system.vbhashPersist(hash)))
      init('VBHash clear'); add(await run('VBHash clear', () => TSeed.system.vbhashClear()))
    } else {
      init('VBHash get'); add(await run('VBHash get', () => TSeed.system.vbhashGet()))
    }

    // ── Service control ─────────────────────────────
    init('Enable auto-proxy'); add(await run('Enable auto-proxy', () => TSeed.system.autoproxyEnable()))
    init('Sync targets'); add(await run('Sync targets', () => TSeed.service.proxy('sync')))
    init('Disable auto-proxy'); add(await run('Disable auto-proxy', () => TSeed.system.autoproxyDisable()))

    // ── App management ──────────────────────────────
    init('App list'); add(await run('App list', () => TSeed.app.listNames()))
    init('App info'); add(await run('App info', () => TSeed.app.info('com.android.settings', 'android')))

    // ── Logs ─────────────────────────────────────────
    init('Log read'); add(await run('Log read', () => TSeed.log.read()))

    // ── Keybox ───────────────────────────────────────
    init('Keybox list'); add(await run('Keybox list', () => TSeed.keybox.list()))
    init('Keybox exists'); add(await run('Keybox exists', () => TSeed.keybox.exists()))

    // ── Security patch ───────────────────────────────
    init('Security patch get'); add(await run('Security patch get', () => TSeed.system.securityPatchGet()))

    // ── Cache ────────────────────────────────────────
    init('Clear cache'); add(await run('Clear cache', () => TSeed.system.clearCache()))

    // ── Settings ─────────────────────────────────────
    init('Settings get'); add(await run('Settings get', () => TSeed.system.settingsGet()))
    init('Settings set'); add(await run('Settings set', () => TSeed.system.settingsSet('{"theme":"dark"}')))

    // ── Edge tests ───────────────────────────────────
    init('VbhashApply invalid'); add(await run('VbhashApply invalid', () => TSeed.system.vbhashApply('not-a-hash')))
    init('App info nonexistent'); add(await run('App info nonexistent', () => TSeed.app.info('com.nonexistent.xyz')))
    init('Proxyconfig list'); add(await run('Proxyconfig list', () => TSeed.proxyconfig.list('syswl')))

    // ── Stress tests ─────────────────────────────────
    init('Stress: 5x concurrent ping')
    const start = Date.now()
    const res = await Promise.allSettled([
      TSeed.system.ping(), TSeed.system.ping(), TSeed.system.ping(),
      TSeed.system.ping(), TSeed.system.ping(),
    ])
    const allOk = res.every(r => r.status === 'fulfilled' && r.value.trim() === 'pong')
    add({ name: 'Stress: 5x concurrent ping', status: allOk ? 'pass' : 'fail', detail: allOk ? 'all pong' : 'some failed', ms: Date.now() - start })

    init('Stress: 10x sequential ping')
    const s2 = Date.now()
    let seqOk = true
    for (let i = 0; i < 10; i++) {
      try { const v = await TSeed.system.ping(); if (v.trim() !== 'pong') seqOk = false }
      catch { seqOk = false }
    }
    add({ name: 'Stress: 10x sequential ping', status: seqOk ? 'pass' : 'fail', detail: seqOk ? 'all pong' : 'failed', ms: Date.now() - s2 })

    // App list stress
    init('Stress: App list (socket)')
    const s3 = Date.now()
    try {
      const apps = await TSeed.app.listNames()
      const count = JSON.parse(apps).length
      add({ name: 'Stress: App list (socket)', status: 'pass', detail: `${count} apps loaded`, ms: Date.now() - s3 })
    } catch (e: any) {
      add({ name: 'Stress: App list (socket)', status: 'fail', detail: String(e?.message || '').slice(0, 80), ms: Date.now() - s3 })
    }

    // Second app list (should be instant from cache)
    init('Stress: App list 2nd (cached)')
    const s4 = Date.now()
    try {
      const apps2 = await TSeed.app.listNames()
      const count2 = JSON.parse(apps2).length
      add({ name: 'Stress: App list 2nd (cached)', status: 'pass', detail: `${count2} apps, ${Date.now() - s4}ms`, ms: Date.now() - s4 })
    } catch {
      add({ name: 'Stress: App list 2nd (cached)', status: 'fail', detail: 'failed', ms: Date.now() - s4 })
    }

    setRunning(false)
  }

  useEffect(() => { runAll() }, [])

  const statusColor = (s: string) => {
    if (s === 'pass') return '#2e7d32'
    if (s === 'fail') return '#c62828'
    if (s === 'running') return colors.primary
    return colors.onSurfaceVariant
  }

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium" style={{ color: colors.onSurface }}>Diagnostics</h2>
          <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>
            {passed} passed / {failed} failed / {results.length} total
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}
        >
          {running ? 'Running...' : 'Re-run'}
        </button>
      </div>

      {results.map((r, i) => (
        <div
          key={i}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: colors.surfaceContainerLow }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: statusColor(r.status) }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: colors.onSurface }}>{r.name}</p>
            {r.detail && (
              <p className="text-xs truncate font-mono" style={{ color: colors.onSurfaceVariant }}>{r.detail}</p>
            )}
          </div>
          <span className="text-xs shrink-0" style={{ color: colors.onSurfaceVariant }}>
            {r.ms > 0 ? `${r.ms}ms` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
